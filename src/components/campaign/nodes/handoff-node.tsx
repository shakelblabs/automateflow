"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { LogOut } from "lucide-react";

import { useSelectedNodeId } from "@/components/campaign/selected-node-context";
import type { WorkflowNodeData } from "@/components/campaign/nodes/types";
import { getNodeDefinition, summarize } from "@/lib/node-definitions";
import { cn } from "@/lib/utils";

/**
 * Handoff visual treatment (Section 2.10): dashed indigo terminal card with a
 * "handoff" eyebrow. Input handle only — it is a dead-end boundary (Section 2.8).
 */
function HandoffNodeComponent({ id, data }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  const selected = useSelectedNodeId() === id;
  const definition = getNodeDefinition(nodeData.nodeType);
  const Icon = definition?.icon;
  const summary = summarize(nodeData.nodeType, nodeData.config);

  return (
    <div
      data-testid="workflow-node"
      data-node-category="handoff"
      className={cn(
        "w-[248px] overflow-hidden rounded-[0.625rem] border-2 border-dashed border-indigo-300 bg-indigo-50/40 shadow-sm transition-shadow",
        selected && "ring-2 ring-emerald-500 ring-offset-2",
      )}
    >
      {definition?.hasInput && (
        <Handle
          type="target"
          position={Position.Top}
          data-testid="handle-target"
          className="!h-2.5 !w-2.5 !border-2 !border-white !bg-indigo-400"
        />
      )}

      <div className="flex items-center gap-1.5 border-b border-indigo-200/70 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-600">
        <LogOut className="h-3 w-3" />
        Handoff
      </div>

      <div className="flex items-start gap-3 p-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
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
    </div>
  );
}

export const HandoffNode = memo(HandoffNodeComponent);
