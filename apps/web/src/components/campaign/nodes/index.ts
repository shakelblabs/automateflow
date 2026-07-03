import type { NodeTypes } from "@xyflow/react";

import { ActionNode } from "@/components/campaign/nodes/action-node";
import { HandoffNode } from "@/components/campaign/nodes/handoff-node";
import { LogicNode } from "@/components/campaign/nodes/logic-node";
import { TriggerNode } from "@/components/campaign/nodes/trigger-node";

/**
 * One distinct custom component per node category, registered via `nodeTypes`.
 * A node's React Flow `type` equals its definition `category`
 * (trigger | action | logic | handoff) — Section 2.10.
 */
export const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  logic: LogicNode,
  handoff: HandoffNode,
};

export type { WorkflowNodeData } from "@/components/campaign/nodes/types";
