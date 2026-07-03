import {
  getDefaultConfig,
  getNodeDefinition,
  LEAD_LISTS,
  type NodeConfigValues,
} from "@/lib/node-definitions";

/** Playwright-only prompt — deterministic fixture, not user-facing. */
export const E2E_FIXTURE_PROMPT_V1_TAG_LEAD = "__e2e-fixture:v1-tag-lead__";

/**
 * Deterministic, mock chat-to-canvas generation (v2 §4.1).
 *
 * There is NO real LLM call. This maps simple keyword patterns in the user's
 * plain-text prompt to a pre-wired sequence of node types. The output is a plain
 * description of nodes + links; the canvas turns it into real nodes via
 * `applyGenerated`, merging each step's config over `getDefaultConfig`.
 *
 * Send Email steps are explicitly created with empty template fields (no
 * templateId / aTemplateId / bTemplateId) — users must pick templates after
 * generation. Validation warnings until then are expected, not a bug.
 */

export interface GeneratedStep {
  /** Local key used only to wire links; the canvas assigns real node ids. */
  key: string;
  /** A node definition `type` from the node catalog. */
  type: string;
  position: { x: number; y: number };
  /** Config overrides merged over the node's defaults in applyGenerated. */
  config?: NodeConfigValues;
}

export interface GeneratedLink {
  from: string;
  to: string;
  /** Branch handle for Condition: Replied? outputs. */
  sourceHandle?: "yes" | "no";
}

export interface GeneratedSequence {
  steps: GeneratedStep[];
  links: GeneratedLink[];
}

const WORD_NUMBERS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
};

const COLUMN_X = 320;
const BRANCH_X = 600;
const ROW_STEP = 150;
const START_Y = 40;

/** v2 §4.1 — explicit empty Send Email config (no template pre-selected). */
function emptySendEmailConfig(): NodeConfigValues {
  return getDefaultConfig("action-send-email");
}

/** Extract how many Send Email + Wait touches the prompt asks for. */
export function parseTouches(prompt: string): number {
  const text = prompt.toLowerCase();

  const digit = text.match(
    /(\d+)\s*(?:x\s*)?(?:touch(?:es)?|emails?|follow[\s-]?ups?|steps?|messages?)/,
  );
  if (digit) return clampTouches(Number(digit[1]));

  const word = text.match(
    /\b(one|two|three|four|five|six)\s+(?:touch(?:es)?|emails?|follow[\s-]?ups?|steps?|messages?)/,
  );
  if (word) return clampTouches(WORD_NUMBERS[word[1]]);

  // A generic sequence intent with no explicit count → a sensible default of 3.
  if (/follow[\s-]?up|touch|sequence|outreach|drip|nurture|cadence|campaign/.test(text)) {
    return 3;
  }

  return 1;
}

function clampTouches(n: number): number {
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 6);
}

/** Whether the prompt asks to branch on a reply (→ Condition: Replied?). */
export function wantsReplyBranch(prompt: string): boolean {
  return /repl(?:y|ies|ied)|respond|response|answers?\b|hears?\s+back/.test(
    prompt.toLowerCase(),
  );
}

export function generateSequence(prompt: string): GeneratedSequence {
  if (prompt.trim() === E2E_FIXTURE_PROMPT_V1_TAG_LEAD) {
    return {
      steps: [
        {
          key: "v1-tag",
          type: "action-tag-lead",
          position: { x: 320, y: 200 },
          config: { tag: "custom", customTag: "Enterprise" },
        },
      ],
      links: [],
    };
  }

  const touches = parseTouches(prompt);
  const replyBranch = wantsReplyBranch(prompt);

  const steps: GeneratedStep[] = [];
  const links: GeneratedLink[] = [];
  let row = 0;
  const nextY = () => START_Y + row++ * ROW_STEP;

  const add = (type: string, x = COLUMN_X, config?: NodeConfigValues) => {
    const key = `gen-${steps.length}`;
    steps.push({ key, type, position: { x, y: nextY() }, config });
    return key;
  };
  const link = (
    from: string,
    to: string,
    sourceHandle?: "yes" | "no",
  ) => links.push({ from, to, sourceHandle });

  // Entry trigger — seed lead list so post-generate validation focuses on templates.
  let prev = add("trigger-new-lead", COLUMN_X, {
    ...getDefaultConfig("trigger-new-lead"),
    leadList: LEAD_LISTS[0].id,
  });

  // `touches` Send Email + Wait pairs — each email starts with no template selected.
  for (let i = 0; i < touches; i += 1) {
    const email = add("action-send-email", COLUMN_X, emptySendEmailConfig());
    link(prev, email);
    const wait = add("action-wait");
    link(email, wait);
    prev = wait;
  }

  if (replyBranch) {
    const condition = add("condition-replied");
    link(prev, condition);

    const handoff = add("handoff-unibox", BRANCH_X);
    link(condition, handoff, "yes");

    const exit = add("action-exit");
    link(condition, exit, "no");
  } else {
    const exit = add("action-exit");
    link(prev, exit);
  }

  return {
    steps: steps.filter((step) => getNodeDefinition(step.type)),
    links,
  };
}
