import type { NodeConfigValues } from "@/lib/node-definitions";

export interface WorkflowNodeData extends Record<string, unknown> {
  nodeType: string;
  label: string;
  config: NodeConfigValues;
}
