type NodeConfigValues = Record<
  string,
  string | number | boolean | undefined
>;

export interface WorkflowNodeData extends Record<string, unknown> {
  nodeType: string;
  label: string;
  config: NodeConfigValues;
}
