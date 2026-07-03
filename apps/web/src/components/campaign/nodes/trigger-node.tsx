"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Zap } from "lucide-react";

import { useSelectedNodeId } from "@/components/campaign/selected-node-context";
import type { WorkflowNodeData } from "@/components/campaign/nodes/types";
import { getNodeDefinition, summarize } from "@/lib/node-definitions";
import { cn } from "@/lib/utils";

/**
 * Trigger visual treatment (Section 2.10): emerald entry card with a solid
 * header eyebrow and a circular icon. No input handle — triggers start a flow.
 */
function TriggerNodeComponent({ id, data }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  const selected = useSelectedNodeId() === id;
  const definition = getNodeDefinition(nodeData.nodeType);
  const Icon = definition?.icon;
  const summary = summarize(nodeData.nodeType, nodeData.config);

  return (
    <div
      data-testid="workflow-node"
      data-node-category="trigger"
      className={cn(
        "w-[248px] overflow-hidden rounded-2xl border-2 border-emerald-500/60 bg-white shadow-sm transition-shadow",
        selected && "ring-2 ring-emerald-500 ring-offset-2",
      )}
    >
      <div className="flex items-center gap-1.5 bg-emerald-600 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white">
        <Zap className="h-3 w-3 fill-white" />
        Trigger
      </div>

      <div className="flex items-start gap-3 bg-gradient-to-b from-emerald-50/60 to-white p-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 ring-4 ring-emerald-50">
          {Icon ? <Icon className="h-4.5 w-4.5" /> : null}
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

export const TriggerNode = memo(TriggerNodeComponent);
