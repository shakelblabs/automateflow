"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react";

import type { CampaignStatus } from "@/components/campaign/campaign-header";
import type { WorkflowNodeData } from "@/components/campaign/workflow-node";
import type { CampaignBlueprint } from "@automateflow/shared-types";
import {
  LEAD_LISTS,
  getDefaultConfig,
} from "@/lib/node-definitions";

export const INITIAL_CANVAS_NODES: Node<WorkflowNodeData>[] = [
  {
    id: "node-1",
    type: "trigger",
    position: { x: 320, y: 80 },
    data: {
      nodeType: "trigger-new-lead",
      label: "New Lead Added",
      config: {
        ...getDefaultConfig("trigger-new-lead"),
        leadList: LEAD_LISTS[0].id,
      },
    },
  },
];

export const INITIAL_CANVAS_EDGES: Edge[] = [];

interface CampaignCanvasContextValue {
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange<Node<WorkflowNodeData>>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  setNodes: React.Dispatch<React.SetStateAction<Node<WorkflowNodeData>[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  nextNodeId: () => string;
  campaignName: string;
  setCampaignName: (name: string) => void;
  subtitle: string;
  setSubtitle: (subtitle: string) => void;
  status: CampaignStatus;
  setStatus: (status: CampaignStatus) => void;
  savedBlueprints: CampaignBlueprint[];
  setSavedBlueprints: React.Dispatch<React.SetStateAction<CampaignBlueprint[]>>;
  selectedNode: Node<WorkflowNodeData> | null;
  setSelectedNode: React.Dispatch<
    React.SetStateAction<Node<WorkflowNodeData> | null>
  >;
}

const CampaignCanvasContext = createContext<CampaignCanvasContextValue | null>(
  null,
);

export function CampaignCanvasProvider({ children }: { children: ReactNode }) {
  const [nodes, setNodes] =
    useState<Node<WorkflowNodeData>[]>(INITIAL_CANVAS_NODES);
  const [edges, setEdges] = useState<Edge[]>(INITIAL_CANVAS_EDGES);
  const nodeIdCounterRef = useRef(2);
  const [campaignName, setCampaignName] = useState("Q2 Outbound Sequence");
  const [subtitle, setSubtitle] = useState("Cold outreach · 4 touches");
  const [status, setStatus] = useState<CampaignStatus>("draft");
  const [savedBlueprints, setSavedBlueprints] = useState<CampaignBlueprint[]>(
    [],
  );
  const [selectedNode, setSelectedNode] = useState<Node<WorkflowNodeData> | null>(
    null,
  );

  const nextNodeId = useCallback(() => {
    const id = `node-${nodeIdCounterRef.current}`;
    nodeIdCounterRef.current += 1;
    return id;
  }, []);

  const onNodesChange = useCallback(
    (changes: NodeChange<Node<WorkflowNodeData>>[]) => {
      setNodes((current) => applyNodeChanges(changes, current));
    },
    [],
  );

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((current) => applyEdgeChanges(changes, current));
  }, []);

  const value = useMemo(
    () => ({
      nodes,
      edges,
      onNodesChange,
      onEdgesChange,
      setNodes,
      setEdges,
      nextNodeId,
      campaignName,
      setCampaignName,
      subtitle,
      setSubtitle,
      status,
      setStatus,
      savedBlueprints,
      setSavedBlueprints,
      selectedNode,
      setSelectedNode,
    }),
    [
      nodes,
      edges,
      onNodesChange,
      onEdgesChange,
      nextNodeId,
      campaignName,
      subtitle,
      status,
      savedBlueprints,
      selectedNode,
    ],
  );

  return (
    <CampaignCanvasContext.Provider value={value}>
      {children}
    </CampaignCanvasContext.Provider>
  );
}

export function useCampaignCanvas() {
  const context = useContext(CampaignCanvasContext);
  if (!context) {
    throw new Error("useCampaignCanvas must be used within CampaignCanvasProvider");
  }
  return context;
}
