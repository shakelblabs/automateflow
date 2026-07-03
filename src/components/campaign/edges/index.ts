import type { EdgeTypes } from "@xyflow/react";

import { LabeledEdge } from "@/components/campaign/edges/labeled-edge";

/** All edges use the custom labeled edge (rule 8). */
export const edgeTypes: EdgeTypes = {
  labeled: LabeledEdge,
};

export type { LabeledEdgeData } from "@/components/campaign/edges/labeled-edge";
