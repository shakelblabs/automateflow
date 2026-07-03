"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { nodeTypes, type WorkflowNodeData } from "@/components/campaign/nodes";
import { edgeTypes } from "@/components/campaign/edges";
import { getDefaultConfig, getNodeDefinition } from "@/lib/node-definitions";
import type { GeneratedSequence } from "@/lib/ai-generate";
import { validateCanvas } from "@/lib/validation";
import { SelectedNodeProvider } from "@/components/campaign/selected-node-context";
import { ValidationBanner } from "@/components/campaign/validation-banner";

export interface WorkflowCanvasHandle {
  addNode: (type: string) => void;
  updateNodeConfig: (
    nodeId: string,
    config: WorkflowNodeData["config"],
  ) => void;
  deleteNode: (nodeId: string) => void;
  clearSelection: () => void;
  applyGenerated: (sequence: GeneratedSequence) => void;
}

interface WorkflowCanvasProps {
  selectedNodeId: string | null;
  onNodeSelect: (node: Node<WorkflowNodeData> | null) => void;
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange<Node<WorkflowNodeData>>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  setNodes: React.Dispatch<React.SetStateAction<Node<WorkflowNodeData>[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  nextNodeId: () => string;
}

const WorkflowCanvasInner = forwardRef<WorkflowCanvasHandle, WorkflowCanvasProps>(
  function WorkflowCanvasInner(
    {
      selectedNodeId,
      onNodeSelect,
      nodes,
      edges,
      onNodesChange,
      onEdgesChange,
      setNodes,
      setEdges,
      nextNodeId,
    },
    ref,
  ) {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { screenToFlowPosition, fitView } = useReactFlow();

    const issues = useMemo(() => validateCanvas(nodes, edges), [nodes, edges]);

    const addNode = useCallback(
      (type: string, position?: { x: number; y: number }) => {
        const definition = getNodeDefinition(type);
        if (!definition || definition.deferred) return;

        const id = nextNodeId();

        setNodes((current) => {
          const resolved =
            position ??
            (current.length === 0
              ? { x: 320, y: 80 }
              : {
                  x: 320,
                  y:
                    Math.max(...current.map((node) => node.position.y)) + 150,
                });

          const newNode: Node<WorkflowNodeData> = {
            id,
            type: definition.category,
            position: resolved,
            data: {
              nodeType: type,
              label: definition.label,
              config: getDefaultConfig(type),
            },
          };

          return [...current, newNode];
        });
      },
      [setNodes, nextNodeId],
    );

    const updateNodeConfig = useCallback(
      (nodeId: string, config: WorkflowNodeData["config"]) => {
        setNodes((current) =>
          current.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, config } }
              : node,
          ),
        );
      },
      [setNodes],
    );

    const deleteNode = useCallback(
      (nodeId: string) => {
        setNodes((current) => current.filter((node) => node.id !== nodeId));
        setEdges((current) =>
          current.filter(
            (edge) => edge.source !== nodeId && edge.target !== nodeId,
          ),
        );
        onNodeSelect(null);
      },
      [setNodes, setEdges, onNodeSelect],
    );

    const applyGenerated = useCallback(
      (sequence: GeneratedSequence) => {
        const idByKey = new Map<string, string>();

        const generatedNodes = sequence.steps.flatMap((step) => {
          const definition = getNodeDefinition(step.type);
          if (!definition) return [];
          const id = nextNodeId();
          idByKey.set(step.key, id);
          const node: Node<WorkflowNodeData> = {
            id,
            type: definition.category,
            position: step.position,
            data: {
              nodeType: step.type,
              label: definition.label,
              config: { ...getDefaultConfig(step.type), ...(step.config ?? {}) },
            },
          };
          return [node];
        });

        const generatedEdges: Edge[] = sequence.links.flatMap((link, index) => {
          const source = idByKey.get(link.from);
          const target = idByKey.get(link.to);
          if (!source || !target) return [];
          const branch =
            link.sourceHandle === "yes"
              ? { label: "Yes", tone: "yes" as const }
              : link.sourceHandle === "no"
                ? { label: "No", tone: "no" as const }
                : {};
          return [
            {
              id: `edge-gen-${index}-${source}-${target}`,
              source,
              target,
              sourceHandle: link.sourceHandle,
              type: "labeled",
              data: branch,
            },
          ];
        });

        setNodes(generatedNodes);
        setEdges(generatedEdges);
        onNodeSelect(null);
        window.setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 60);
      },
      [setNodes, setEdges, onNodeSelect, fitView, nextNodeId],
    );

    useImperativeHandle(
      ref,
      () => ({
        addNode: (type: string) => addNode(type),
        updateNodeConfig,
        deleteNode,
        clearSelection: () => onNodeSelect(null),
        applyGenerated,
      }),
      [addNode, updateNodeConfig, deleteNode, onNodeSelect, applyGenerated],
    );

    const onConnect = useCallback(
      (connection: Connection) => {
        const branch =
          connection.sourceHandle === "yes"
            ? { label: "Yes", tone: "yes" as const }
            : connection.sourceHandle === "no"
              ? { label: "No", tone: "no" as const }
              : {};

        setEdges((current) =>
          addEdge({ ...connection, type: "labeled", data: branch }, current),
        );
      },
      [setEdges],
    );

    const onNodesDelete = useCallback(
      (deleted: Node[]) => {
        const deletedIds = new Set(deleted.map((node) => node.id));
        setEdges((current) =>
          current.filter(
            (edge) =>
              !deletedIds.has(edge.source) && !deletedIds.has(edge.target),
          ),
        );
        if (selectedNodeId && deletedIds.has(selectedNodeId)) {
          onNodeSelect(null);
        }
      },
      [setEdges, selectedNodeId, onNodeSelect],
    );

    const onNodeClick = useCallback(
      (_event: React.MouseEvent, node: Node<WorkflowNodeData>) => {
        onNodeSelect(node);
      },
      [onNodeSelect],
    );

    const onPaneClick = useCallback(() => {
      onNodeSelect(null);
    }, [onNodeSelect]);

    const onDragOver = useCallback((event: React.DragEvent) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    }, []);

    const onDrop = useCallback(
      (event: React.DragEvent) => {
        event.preventDefault();
        const type = event.dataTransfer.getData("application/reactflow");
        if (!type || !reactFlowWrapper.current) return;

        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        addNode(type, position);
      },
      [addNode, screenToFlowPosition],
    );

    return (
      <SelectedNodeProvider selectedNodeId={selectedNodeId}>
        <div ref={reactFlowWrapper} className="relative h-full w-full">
          <ValidationBanner issues={issues} />
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodesDelete={onNodesDelete}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            defaultEdgeOptions={{ type: "labeled" }}
            proOptions={{ hideAttribution: true }}
            className="bg-slate-50"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#cbd5e1"
            />
            <Controls
              showInteractive={false}
              className="!rounded-[0.625rem] !border-slate-200 !shadow-sm [&>button]:!border-slate-200 [&>button]:!bg-white [&>button]:hover:!bg-slate-50"
            />
            <MiniMap
              nodeColor="#059669"
              maskColor="rgba(15, 23, 42, 0.08)"
              className="!rounded-[0.625rem] !border !border-slate-200 !bg-white !shadow-sm"
            />
          </ReactFlow>
        </div>
      </SelectedNodeProvider>
    );
  },
);

export const WorkflowCanvas = forwardRef<
  WorkflowCanvasHandle,
  WorkflowCanvasProps
>(function WorkflowCanvas(props, ref) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner ref={ref} {...props} />
    </ReactFlowProvider>
  );
});
