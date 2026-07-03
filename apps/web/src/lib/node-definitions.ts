import type { LucideIcon } from "lucide-react";
import {
  Clock,
  DoorOpen,
  GitBranch,
  Inbox,
  MailOpen,
  MousePointerClick,
  Reply,
  Send,
  Smile,
  Tag,
  UserPlus,
} from "lucide-react";

import { getTemplateById, type EmailTemplate } from "@/lib/email-templates";
import { getEffectiveTemplateId } from "@/lib/send-email-config";

/**
 * Single source of truth for the Campaign Canvas node catalog.
 * Node types are fixed to Section 2 of docs/specs/campaign-canvas-v1-spec.md.
 * Do not invent new node types here without flagging a spec update first.
 */

// Visual treatment bucket (drives the custom node component per Section 2.10).
export type NodeCategory = "trigger" | "action" | "logic" | "handoff";

// Palette grouping headers (Section 1 / Section 2 — Triggers / Actions / Logic).
export type PaletteGroup = "triggers" | "actions" | "logic";

export type FieldType = "text" | "textarea" | "number" | "select" | "toggle";

export type NodeConfigValues = Record<
  string,
  string | number | boolean | undefined
>;

export interface NodeField {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: { label: string; value: string }[];
  defaultValue?: string | number | boolean;
  helperText?: string;
  /** Only show this field when the predicate passes (e.g. mode-dependent fields). */
  showIf?: (config: NodeConfigValues) => boolean;
}

export interface NodeDefinition {
  type: string;
  label: string;
  /** Short palette/inspector description — NOT the on-canvas summary line. */
  description: string;
  category: NodeCategory;
  paletteGroup: PaletteGroup;
  icon: LucideIcon;
  fields: NodeField[];
  hasInput: boolean;
  hasOutput: boolean;
  /** Number of source handles. 2 => branching node with `yes`/`no` handles. */
  outputs?: number;
  /** Entry trigger — exactly one required on canvas (Section 2.1). */
  isEntryTrigger?: boolean;
  /** Terminal node — no outgoing connector allowed (Exit / Unibox). */
  terminal?: boolean;
  /** Coming-soon palette entry: greyed, non-draggable (Section 2.9). */
  deferred?: boolean;
  /** Informational note shown in the inspector for nodes with no config. */
  configNote?: string;
  /**
   * Live, auto-generated one-line summary of the current config, rendered in the
   * node card body. MUST be derived from config — never static placeholder text.
   */
  summary: (config: NodeConfigValues, templates?: EmailTemplate[]) => string;
}

export const PALETTE_GROUPS: {
  id: PaletteGroup;
  label: string;
  description: string;
}[] = [
  {
    id: "triggers",
    label: "Triggers",
    description: "Start or resume a sequence when an event occurs",
  },
  {
    id: "actions",
    label: "Actions",
    description: "Steps a lead moves through in the sequence",
  },
  {
    id: "logic",
    label: "Logic",
    description: "Branching and flow control",
  },
];

function labelFor(
  options: NodeField["options"],
  value: string | number | boolean | undefined,
): string {
  const match = options?.find((option) => option.value === String(value));
  return match?.label ?? String(value ?? "");
}

/**
 * MOCK — existing lead lists referenced by the New Lead Added trigger (v2 §2).
 * List creation/management is out of scope for Campaign Builder; this node only
 * references an already-existing list. Shape is swap-compatible with future real
 * lead-list data ({ id, name, leadCount }).
 */
export const LEAD_LISTS: { id: string; name: string; leadCount: number }[] = [
  { id: "q2-saas-founders", name: "Q2 SaaS Founders", leadCount: 240 },
  { id: "enterprise-cto", name: "Enterprise CTOs", leadCount: 88 },
  { id: "webinar-signups", name: "Webinar Signups — May", leadCount: 512 },
];

export const NODE_DEFINITIONS: NodeDefinition[] = [
  // ── 2.1 Trigger: New Lead Added ──────────────────────────────────────────
  {
    type: "trigger-new-lead",
    label: "New Lead Added",
    description: "Entry trigger — starts the sequence when a lead is added",
    category: "trigger",
    paletteGroup: "triggers",
    icon: UserPlus,
    hasInput: false,
    hasOutput: true,
    isEntryTrigger: true,
    fields: [
      {
        // v2 §2: references an existing lead list only — no import/creation UI.
        // No defaultValue → empty state ("No list selected") raises a warning.
        id: "leadList",
        label: "Lead List",
        type: "select",
        options: LEAD_LISTS.map((list) => ({
          label: list.name,
          value: list.id,
        })),
      },
    ],
    summary: (config) => {
      const list = LEAD_LISTS.find((item) => item.id === config.leadList);
      return list
        ? `List: ${list.name} (${list.leadCount} leads)`
        : "No list selected";
    },
  },

  // ── 2.2 Trigger: Email Replied ───────────────────────────────────────────
  {
    type: "trigger-email-replied",
    label: "Email Replied",
    description: "Re-entry trigger — lead replied to a prior campaign",
    category: "trigger",
    paletteGroup: "triggers",
    icon: Reply,
    hasInput: false,
    hasOutput: true,
    fields: [
      {
        id: "campaign",
        label: "Replies from campaign",
        type: "select",
        defaultValue: "q1-outbound",
        options: [
          { label: "Q1 Outbound", value: "q1-outbound" },
          { label: "Product Launch", value: "product-launch" },
          { label: "Webinar Follow-up", value: "webinar" },
          { label: "Any campaign", value: "any" },
        ],
      },
    ],
    summary: (config) =>
      `Replies from: ${labelFor(
        [
          { label: "Q1 Outbound", value: "q1-outbound" },
          { label: "Product Launch", value: "product-launch" },
          { label: "Webinar Follow-up", value: "webinar" },
          { label: "Any campaign", value: "any" },
        ],
        config.campaign,
      )}`,
  },

  // ── Send Email — template selector (v2 §3); A/B variants deferred to item 4 ─
  {
    type: "action-send-email",
    label: "Send Email",
    description: "Send an email from a template, with optional A/B testing",
    category: "action",
    paletteGroup: "actions",
    icon: Send,
    hasInput: true,
    hasOutput: true,
    // Full config rendered by SendEmailConfig (template selector + A/B shell).
    fields: [],
    summary: (config, templates) => {
      if (config.abEnabled) {
        const nameA =
          getTemplateById(getEffectiveTemplateId(config, "aTemplateId"), templates)
            ?.name ?? "No template selected";
        const nameB =
          getTemplateById(getEffectiveTemplateId(config, "bTemplateId"), templates)
            ?.name ?? "No template selected";
        const metric = labelFor(
          [
            { label: "Open rate", value: "open" },
            { label: "Reply rate", value: "reply" },
            { label: "Click rate", value: "click" },
          ],
          config.abMetric ?? "reply",
        );
        return `A/B: ${nameA} vs ${nameB} (${metric})`;
      }
      const templateId = getEffectiveTemplateId(config);
      const template = getTemplateById(templateId, templates);
      return template ? `Template: ${template.name}` : "No template selected";
    },
  },

  // ── 2.4 Action: Wait / Delay ─────────────────────────────────────────────
  {
    type: "action-wait",
    label: "Wait / Delay",
    description: "Pause the sequence before the next step",
    category: "action",
    paletteGroup: "actions",
    icon: Clock,
    hasInput: true,
    hasOutput: true,
    fields: [
      {
        id: "duration",
        label: "Duration",
        type: "number",
        defaultValue: 2,
      },
      {
        id: "unit",
        label: "Unit",
        type: "select",
        defaultValue: "days",
        options: [
          { label: "Minutes", value: "minutes" },
          { label: "Hours", value: "hours" },
          { label: "Days", value: "days" },
        ],
      },
      {
        id: "businessHours",
        label: "Only send during business hours",
        type: "toggle",
        defaultValue: false,
      },
    ],
    summary: (config) => {
      const duration = config.duration ?? 0;
      const unit = String(config.unit ?? "days");
      const unitLabel = Number(duration) === 1 ? unit.replace(/s$/, "") : unit;
      return `Wait ${duration} ${unitLabel}`;
    },
  },

  // ── Tag Lead — deferred to "Coming soon" (v2 §5) ─────────────────────────
  // Moved out of the active Actions group into the Logic deferred subsection.
  // category stays "action" so any existing v1 canvas data still renders via the
  // action node component (defensive requirement — read-only is acceptable).
  {
    type: "action-tag-lead",
    label: "Tag Lead",
    description: "Apply a tag to the lead",
    category: "action",
    paletteGroup: "logic",
    deferred: true,
    icon: Tag,
    hasInput: true,
    hasOutput: true,
    fields: [
      {
        id: "tag",
        label: "Tag",
        type: "select",
        defaultValue: "interested",
        options: [
          { label: "Interested", value: "interested" },
          { label: "No Response", value: "no-response" },
          { label: "DNC", value: "dnc" },
          { label: "Custom", value: "custom" },
        ],
      },
      {
        id: "customTag",
        label: "Custom tag",
        type: "text",
        placeholder: "e.g. Enterprise",
        defaultValue: "",
        showIf: (config) => config.tag === "custom",
      },
    ],
    summary: (config) => {
      if (config.tag === "custom") {
        return `Tag as: ${config.customTag || "Custom"}`;
      }
      return `Tag as: ${labelFor(
        [
          { label: "Interested", value: "interested" },
          { label: "No Response", value: "no-response" },
          { label: "DNC", value: "dnc" },
        ],
        config.tag,
      )}`;
    },
  },

  // ── 2.7 Action: Exit Sequence ────────────────────────────────────────────
  {
    type: "action-exit",
    label: "Exit Sequence",
    description: "Terminal — the lead's journey ends here",
    category: "action",
    paletteGroup: "actions",
    icon: DoorOpen,
    hasInput: true,
    hasOutput: false,
    terminal: true,
    fields: [],
    configNote:
      "This is a terminal step. The lead's journey ends here — there are no settings to configure and no outgoing connection.",
    summary: () => "Journey ends here",
  },

  // ── 2.8 Handoff: Unibox ──────────────────────────────────────────────────
  {
    type: "handoff-unibox",
    label: "Handoff: Unibox",
    description: "Terminal — reply handling continues in Unibox",
    category: "handoff",
    paletteGroup: "actions",
    icon: Inbox,
    hasInput: true,
    hasOutput: false,
    terminal: true,
    fields: [],
    configNote: "Reply handling continues in Unibox.",
    summary: () => "Reply handling continues in Unibox",
  },

  // ── 2.5 Condition: Replied? (branching, Yes/No) ──────────────────────────
  {
    type: "condition-replied",
    label: "Condition: Replied?",
    description: "Branch on whether the lead has replied",
    category: "logic",
    paletteGroup: "logic",
    icon: GitBranch,
    hasInput: true,
    hasOutput: true,
    outputs: 2,
    fields: [],
    configNote:
      "No configuration needed. This step automatically reads from the campaign's reply trigger and branches: the Yes path handles replies, the No path continues the sequence.",
    summary: () => "If replied → Yes / No",
  },

  // ── 2.9 Deferred / coming soon (greyed, non-draggable) ───────────────────
  {
    type: "condition-opened",
    label: "Condition: Opened?",
    description: "Available in a future release",
    category: "logic",
    paletteGroup: "logic",
    icon: MailOpen,
    hasInput: true,
    hasOutput: true,
    outputs: 2,
    deferred: true,
    fields: [],
    summary: () => "Available in a future release",
  },
  {
    type: "condition-clicked",
    label: "Condition: Link Clicked?",
    description: "Available in a future release",
    category: "logic",
    paletteGroup: "logic",
    icon: MousePointerClick,
    hasInput: true,
    hasOutput: true,
    outputs: 2,
    deferred: true,
    fields: [],
    summary: () => "Available in a future release",
  },
  {
    type: "condition-sentiment",
    label: "Condition: Reply Sentiment",
    description: "Available in a future release",
    category: "logic",
    paletteGroup: "logic",
    icon: Smile,
    hasInput: true,
    hasOutput: true,
    outputs: 2,
    deferred: true,
    fields: [],
    summary: () => "Available in a future release",
  },
];

export function getNodeDefinition(type: string): NodeDefinition | undefined {
  return NODE_DEFINITIONS.find((node) => node.type === type);
}

export function getNodesByPaletteGroup(group: PaletteGroup): NodeDefinition[] {
  return NODE_DEFINITIONS.filter((node) => node.paletteGroup === group);
}

export function getDefaultConfig(type: string): NodeConfigValues {
  const definition = getNodeDefinition(type);
  if (!definition) return {};

  const config = definition.fields.reduce<NodeConfigValues>((acc, field) => {
    acc[field.id] = field.defaultValue ?? (field.type === "toggle" ? false : "");
    return acc;
  }, {});

  // Send Email defaults (v2 §3–§4).
  if (type === "action-send-email") {
    config.templateId = undefined;
    config.aTemplateId = undefined;
    config.bTemplateId = undefined;
    config.abEnabled = false;
    config.abMetric = "reply";
    config.abSplit = 50;
    config.abLockWinner = false;
  }

  return config;
}

export function summarize(
  type: string,
  config: NodeConfigValues,
  templates?: EmailTemplate[],
): string {
  const definition = getNodeDefinition(type);
  return definition ? definition.summary(config, templates) : "";
}
