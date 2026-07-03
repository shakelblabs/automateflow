"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

import { useSelectedNodeId } from "@/components/campaign/selected-node-context";
import type { WorkflowNodeData } from "@automateflow/shared-types";
import { getNodeDefinition, summarize } from "@/lib/node-definitions";
import { cn } from "@/lib/utils";

/**
 * Logic visual treatment (Section 2.10): amber branching card with a rotated
 * (diamond) icon tile. Branching nodes (outputs === 2, e.g. Condition: Replied?)
 * render two distinct, named source handles — `yes` (green) and `no` (grey) —
 * with visible labels, per rule 9. Never a single ambiguous output.
 */
function LogicNodeComponent({ id, data }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  const selected = useSelectedNodeId() === id;
  const definition = getNodeDefinition(nodeData.nodeType);
  const Icon = definition?.icon;
  const summary = summarize(nodeData.nodeType, nodeData.config);
  const branching = definition?.outputs === 2;

  return (
    <div
      data-testid="workflow-node"
      data-node-category="logic"
      data-branching={branching ? "true" : "false"}
      className={cn(
        "w-[248px] rounded-[0.625rem] border-2 border-amber-300 bg-amber-50/50 shadow-sm transition-shadow",
        selected && "ring-2 ring-emerald-500 ring-offset-2",
      )}
    >
      {definition?.hasInput && (
        <Handle
          type="target"
          position={Position.Top}
          data-testid="handle-target"
          className="!h-2.5 !w-2.5 !border-2 !border-white !bg-amber-500"
        />
      )}

      <div className="flex items-start gap-3 p-3">
        <div className="flex h-9 w-9 shrink-0 rotate-45 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          {Icon ? <Icon className="h-4 w-4 -rotate-45" /> : null}
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

      {branching ? (
        <div className="relative flex justify-between px-7 pb-2.5 text-[10px] font-semibold uppercase tracking-wide">
          <span data-testid="branch-label-yes" className="text-emerald-600">
            Yes
          </span>
          <span data-testid="branch-label-no" className="text-slate-400">
            No
          </span>
          <Handle
            id="yes"
            type="source"
            position={Position.Bottom}
            data-testid="handle-yes"
            style={{ left: "28%" }}
            className="!h-2.5 !w-2.5 !border-2 !border-white !bg-emerald-600"
          />
          <Handle
            id="no"
            type="source"
            position={Position.Bottom}
            data-testid="handle-no"
            style={{ left: "72%" }}
            className="!h-2.5 !w-2.5 !border-2 !border-white !bg-slate-400"
          />
        </div>
      ) : (
        definition?.hasOutput && (
          <Handle
            type="source"
            position={Position.Bottom}
            data-testid="handle-source"
            className="!h-2.5 !w-2.5 !border-2 !border-white !bg-amber-500"
          />
        )
      )}
    </div>
  );
}

export const LogicNode = memo(LogicNodeComponent);
