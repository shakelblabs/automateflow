import type { Edge, Node } from "@xyflow/react";

import type { CampaignBlueprint, WorkflowNodeData } from "@automateflow/shared-types";

export function serializeBlueprint(
  name: string,
  nodes: Node<WorkflowNodeData>[],
  edges: Edge[],
): CampaignBlueprint {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    savedAt: new Date().toISOString(),
    nodes: structuredClone(nodes),
    edges: structuredClone(edges),
  };
}
