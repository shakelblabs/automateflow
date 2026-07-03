"use client";

import { Trash2, X } from "lucide-react";

import { AppButton } from "@/components/app-button";
import { SendEmailConfig } from "@/components/campaign/send-email-config";
import { useTemplateLibrary } from "@/components/shell/template-library-provider";
import {
  getNodeDefinition,
  summarize,
  type NodeField,
} from "@/lib/node-definitions";
import type { WorkflowNodeData } from "@/components/campaign/workflow-node";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { Edge, Node } from "@xyflow/react";

interface NodeConfigPanelProps {
  selectedNode: Node<WorkflowNodeData> | null;
  canvasNodes: Node<WorkflowNodeData>[];
  canvasEdges: Edge[];
  onConfigChange: (config: WorkflowNodeData["config"]) => void;
  onClose: () => void;
  onDelete: () => void;
}

function ConfigField({
  field,
  value,
  onChange,
}: {
  field: NodeField;
  value: string | number | boolean | undefined;
  onChange: (value: string | number | boolean) => void;
}) {
  if (field.type === "toggle") {
    const checked = Boolean(value);
    return (
      <div className="flex items-center justify-between rounded-[0.625rem] border border-slate-200 bg-slate-50 px-3 py-2.5">
        <div>
          <Label htmlFor={field.id} className="text-sm text-slate-900">
            {field.label}
          </Label>
          {field.helperText ? (
            <p className="text-xs text-slate-500">{field.helperText}</p>
          ) : null}
        </div>
        <button
          id={field.id}
          data-testid={`field-${field.id}`}
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            checked ? "bg-emerald-600" : "bg-slate-200"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              checked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={field.id}>{field.label}</Label>
        <Select
          value={String(value ?? "")}
          onValueChange={(next) => {
            if (next != null) onChange(next);
          }}
        >
          <SelectTrigger
            id={field.id}
            data-testid={`field-${field.id}`}
            className="w-full focus-visible:ring-emerald-500"
          >
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                data-testid={`option-${field.id}-${option.value}`}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {field.helperText ? (
          <p className="text-xs text-slate-500">{field.helperText}</p>
        ) : null}
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={field.id}>{field.label}</Label>
        <Textarea
          id={field.id}
          data-testid={`field-${field.id}`}
          value={String(value ?? "")}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-[100px] focus-visible:ring-emerald-500"
        />
        {field.helperText ? (
          <p className="text-xs text-slate-500">{field.helperText}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={field.id}>{field.label}</Label>
      <Input
        id={field.id}
        data-testid={`field-${field.id}`}
        type={field.type === "number" ? "number" : "text"}
        value={String(value ?? "")}
        placeholder={field.placeholder}
        onChange={(event) =>
          onChange(
            field.type === "number"
              ? Number(event.target.value)
              : event.target.value,
          )
        }
        className="focus-visible:ring-emerald-500"
      />
      {field.helperText ? (
        <p className="text-xs text-slate-500">{field.helperText}</p>
      ) : null}
    </div>
  );
}

export function NodeConfigPanel({
  selectedNode,
  canvasNodes,
  canvasEdges,
  onConfigChange,
  onClose,
  onDelete,
}: NodeConfigPanelProps) {
  const { templates } = useTemplateLibrary();
  const definition = selectedNode
    ? getNodeDefinition(selectedNode.data.nodeType)
    : undefined;
  const Icon = definition?.icon;

  if (!selectedNode || !definition) {
    return (
      <aside className="flex w-[340px] shrink-0 flex-col bg-white">
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-400">
            ⚙
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-900">
            No step selected
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Click a node on the canvas to edit its settings, or add a new step
            from the left panel.
          </p>
        </div>
      </aside>
    );
  }

  const config = selectedNode.data.config;

  return (
    <aside className="flex w-[340px] min-h-0 shrink-0 flex-col overflow-hidden border-l border-slate-200 bg-white">
      <div className="flex items-start justify-between border-b border-slate-200 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            {Icon ? <Icon className="h-5 w-5" /> : null}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {selectedNode.data.label}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">{definition.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <AppButton
            variant="ghost"
            size="icon"
            onClick={onDelete}
            data-testid="delete-node-btn"
            aria-label="Delete step"
            className="text-slate-500 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </AppButton>
          <AppButton
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </AppButton>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 p-4">
          <div>
            <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Step settings
            </p>
            <Separator className="mt-2" />
          </div>

          {selectedNode.data.nodeType === "action-send-email" ? (
            <SendEmailConfig
              config={config}
              onChange={onConfigChange}
              canvasNodes={canvasNodes}
              canvasEdges={canvasEdges}
              selectedNodeId={selectedNode.id}
            />
          ) : definition.fields.length === 0 ? (
            <div
              data-testid="config-note"
              className="rounded-[0.625rem] border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600"
            >
              {definition.configNote ?? "This step has no settings to configure."}
            </div>
          ) : (
            definition.fields
              .filter((field) => !field.showIf || field.showIf(config))
              .map((field) => (
                <ConfigField
                  key={field.id}
                  field={field}
                  value={config[field.id]}
                  onChange={(next) =>
                    onConfigChange({
                      ...config,
                      [field.id]: next,
                    })
                  }
                />
              ))
          )}

          <div className="rounded-[0.625rem] border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-600">Summary</p>
            <p className="mt-1 text-sm text-slate-900">
              {summarize(selectedNode.data.nodeType, config, templates)}
            </p>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
