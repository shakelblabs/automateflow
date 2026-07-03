"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

import { useSelectedNodeId } from "@/components/campaign/selected-node-context";
import type { WorkflowNodeData } from "@automateflow/shared-types";
import { useTemplateLibrary } from "@/components/shell/template-library-provider";
import { getNodeDefinition, summarize } from "@/lib/node-definitions";
import { cn } from "@/lib/utils";

/**
 * Action visual treatment (Section 2.10): clean rectangular card with a square
 * icon tile on the left. Input handle on top, output on the bottom (unless the
 * node is terminal, e.g. Exit Sequence).
 */
function ActionNodeComponent({ id, data }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  const selected = useSelectedNodeId() === id;
  const { templates } = useTemplateLibrary();
  const definition = getNodeDefinition(nodeData.nodeType);
  const Icon = definition?.icon;
  const summary = summarize(nodeData.nodeType, nodeData.config, templates);
  const terminal = definition?.terminal;

  return (
    <div
      data-testid="workflow-node"
      data-node-category="action"
      className={cn(
        "w-[248px] rounded-[0.625rem] border border-slate-200 bg-white shadow-sm transition-shadow",
        terminal && "border-slate-300 border-dashed",
        selected && "ring-2 ring-emerald-500 ring-offset-2",
      )}
    >
      {definition?.hasInput && (
        <Handle
          type="target"
          position={Position.Top}
          data-testid="handle-target"
          className="!h-2.5 !w-2.5 !border-2 !border-white !bg-slate-400"
        />
      )}

      <div className="flex items-start gap-3 p-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600"
        >
          {Icon ? <Icon className="h-4 w-4" /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">
            {nodeData.label}
          </p>
          <p
            data-testid="node-summary"
            className="mt-0.5 line-clamp-2 text-xs text-slate-500"
          >
            {summary}
          </p>
        </div>
      </div>

      {definition?.hasOutput && (
        <Handle
          type="source"
          position={Position.Bottom}
          data-testid="handle-source"
          className="!h-2.5 !w-2.5 !border-2 !border-white !bg-emerald-600"
        />
      )}
    </div>
  );
}

export const ActionNode = memo(ActionNodeComponent);
