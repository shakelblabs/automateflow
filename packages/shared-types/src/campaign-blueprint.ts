import type { Edge, Node } from "@xyflow/react";

import type { WorkflowNodeData } from "./workflow-node";

/**
 * In-memory campaign blueprint (v2 §6). MOCK — replace with API persistence
 * once backend exists. No localStorage; session-only React state in CampaignBuilder.
 */
export interface CampaignBlueprint {
  id: string;
  name: string;
  savedAt: string;
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
}
