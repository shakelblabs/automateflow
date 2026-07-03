"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Edge, Node } from "@xyflow/react";

import type { WorkflowNodeData } from "@/components/campaign/nodes/types";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { getTemplateById } from "@/lib/email-templates";
import type { NodeConfigValues } from "@/lib/node-definitions";
import {
  getEffectiveTemplateId,
  type SendEmailTemplateField,
} from "@/lib/send-email-config";
import { filterTemplatesForNode } from "@/lib/send-email-position";
import { cn } from "@/lib/utils";

interface SendEmailConfigProps {
  config: NodeConfigValues;
  onChange: (next: NodeConfigValues) => void;
  canvasNodes: Node<WorkflowNodeData>[];
  canvasEdges: Edge[];
  selectedNodeId: string;
}

type TemplateSelectorScope = "base" | "a" | "b";

interface TemplateSelectorFormProps extends SendEmailConfigProps {
  templateField: SendEmailTemplateField;
  scope: TemplateSelectorScope;
}

const METRIC_LABELS: Record<string, string> = {
  open: "Open rate",
  reply: "Reply rate",
  click: "Click rate",
};

function scopeTestId(scope: TemplateSelectorScope, suffix: string): string {
  return scope === "base" ? suffix : `variant-${scope}-${suffix}`;
}

/** v2 §3 / §4 — reusable template selector (base + A/B variants). */
function TemplateSelectorForm({
  config,
  onChange,
  canvasNodes,
  canvasEdges,
  selectedNodeId,
  templateField,
  scope,
}: TemplateSelectorFormProps) {
  const templateId = getEffectiveTemplateId(config, templateField);
  const filteredTemplates = useMemo(
    () => filterTemplatesForNode(canvasNodes, canvasEdges, selectedNodeId),
    [canvasNodes, canvasEdges, selectedNodeId],
  );
  const selectedTemplate = getTemplateById(templateId);

  const setField = (id: string, value: NodeConfigValues[string]) =>
    onChange({ ...config, [id]: value });

  const previewText = selectedTemplate?.previewText;

  return (
    <div
      data-testid={scopeTestId(scope, "template-selector")}
      className="space-y-4"
    >
      <div className="space-y-1.5">
        <Label htmlFor={`field-${templateField}`}>Select Template</Label>
        <Select
          value={templateId ?? ""}
          onValueChange={(next) => next && setField(templateField, next)}
        >
          <SelectTrigger
            id={`field-${templateField}`}
            data-testid={`field-${templateField}`}
            className="w-full focus-visible:ring-emerald-500"
          >
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {filteredTemplates.map((template) => (
              <SelectItem
                key={template.id}
                value={template.id}
                data-testid={`option-${templateField}-${template.id}`}
              >
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filteredTemplates.length === 0 ? (
          <p className="text-xs text-slate-500">
            No templates match this step — connect this node in the sequence or
            add more Send Email steps to determine family size.
          </p>
        ) : null}
      </div>

      <Link
        href="/template-builder"
        data-testid={scopeTestId(scope, "template-builder-link")}
        className="inline-flex text-sm font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
      >
        Create or edit in Template Builder →
      </Link>

      {previewText ? (
        <div
          data-testid={scopeTestId(scope, "template-preview")}
          className="rounded-[0.625rem] border border-slate-200 bg-slate-50 p-3"
        >
          <p className="mb-1 text-xs font-medium text-slate-500">Preview</p>
          <p className="whitespace-pre-wrap text-sm text-slate-700">
            {previewText}
          </p>
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          Select a template to preview its content.
        </p>
      )}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  testId,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  testId: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-[0.625rem] border border-slate-200 bg-slate-50 px-3 py-2.5">
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        {description ? (
          <p className="text-xs text-slate-500">{description}</p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        data-testid={testId}
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          checked ? "bg-emerald-600" : "bg-slate-200",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}

export function SendEmailConfig({
  config,
  onChange,
  canvasNodes,
  canvasEdges,
  selectedNodeId,
}: SendEmailConfigProps) {
  const abEnabled = Boolean(config.abEnabled);
  const split = Number(config.abSplit ?? 50);
  const setField = (id: string, value: NodeConfigValues[string]) =>
    onChange({ ...config, [id]: value });

  const selectorProps = {
    config,
    onChange,
    canvasNodes,
    canvasEdges,
    selectedNodeId,
  };

  return (
    <div className="space-y-4">
      {abEnabled ? (
        <div className="space-y-4">
          <div
            data-testid="variant-a"
            className="rounded-[0.625rem] border border-slate-200 p-3"
          >
            <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Variant A
            </p>
            <TemplateSelectorForm
              {...selectorProps}
              templateField="aTemplateId"
              scope="a"
            />
          </div>
          <div
            data-testid="variant-b"
            className="rounded-[0.625rem] border border-slate-200 p-3"
          >
            <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Variant B
            </p>
            <TemplateSelectorForm
              {...selectorProps}
              templateField="bTemplateId"
              scope="b"
            />
          </div>
        </div>
      ) : (
        <TemplateSelectorForm
          {...selectorProps}
          templateField="templateId"
          scope="base"
        />
      )}

      <Separator />

      <ToggleRow
        label="A/B testing"
        description="Split traffic between two variants"
        checked={abEnabled}
        onChange={(next) => setField("abEnabled", next)}
        testId="ab-toggle"
      />

      {abEnabled ? (
        <div data-testid="ab-config" className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="ab-split">Split ratio</Label>
              <span data-testid="ab-split-label" className="text-xs text-slate-500">
                A {split}% / B {100 - split}%
              </span>
            </div>
            <input
              id="ab-split"
              data-testid="ab-split"
              type="range"
              min={10}
              max={90}
              step={10}
              value={split}
              onChange={(event) =>
                setField("abSplit", Number(event.target.value))
              }
              className="w-full accent-emerald-600"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="field-abMetric">Winning metric</Label>
            <Select
              value={String(config.abMetric ?? "reply")}
              onValueChange={(next) => next && setField("abMetric", next)}
              items={METRIC_LABELS}
            >
              <SelectTrigger
                id="field-abMetric"
                data-testid="field-abMetric"
                className="w-full focus-visible:ring-emerald-500"
              >
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open" data-testid="option-abMetric-open">
                  Open rate
                </SelectItem>
                <SelectItem value="reply" data-testid="option-abMetric-reply">
                  Reply rate
                </SelectItem>
                <SelectItem value="click" data-testid="option-abMetric-click">
                  Click rate
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ToggleRow
            label="Lock winner"
            description="Stop testing and send only the winner"
            checked={Boolean(config.abLockWinner)}
            onChange={(next) => setField("abLockWinner", next)}
            testId="ab-lock"
          />
        </div>
      ) : null}
    </div>
  );
}
