"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Edge, Node } from "@xyflow/react";
import { toast } from "sonner";

import {
  CampaignHeader,
  type CampaignStatus,
} from "@/components/campaign/campaign-header";
import { BlueprintListDialog } from "@/components/campaign/blueprint-list-dialog";
import { GenerateDialog } from "@/components/campaign/generate-dialog";
import { SaveTemplateDialog } from "@/components/campaign/save-template-dialog";
import { NodeConfigPanel } from "@/components/campaign/node-config-panel";
import { NodePalette } from "@/components/campaign/node-palette";
import {
  WorkflowCanvas,
  type WorkflowCanvasHandle,
} from "@/components/campaign/workflow-canvas";
import type { WorkflowNodeData } from "@/components/campaign/workflow-node";
import { generateSequence } from "@/lib/ai-generate";
import {
  serializeBlueprint,
  type CampaignBlueprint,
} from "@/lib/campaign-blueprint";

export function CampaignBuilder() {
  const canvasRef = useRef<WorkflowCanvasHandle>(null);
  const [campaignName, setCampaignName] = useState("Q2 Outbound Sequence");
  const [subtitle, setSubtitle] = useState("Cold outreach · 4 touches");
  const [status, setStatus] = useState<CampaignStatus>("draft");
  const [generateOpen, setGenerateOpen] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [blueprintListOpen, setBlueprintListOpen] = useState(false);
  const [savedBlueprints, setSavedBlueprints] = useState<CampaignBlueprint[]>(
    [],
  );
  const [selectedNode, setSelectedNode] = useState<Node<WorkflowNodeData> | null>(
    null,
  );
  const [canvasNodes, setCanvasNodes] = useState<Node<WorkflowNodeData>[]>([]);
  const [canvasEdges, setCanvasEdges] = useState<Edge[]>([]);

  const handleCanvasChange = useCallback(
    (nodes: Node<WorkflowNodeData>[], edges: Edge[]) => {
      setCanvasNodes(nodes);
      setCanvasEdges(edges);
    },
    [],
  );

  const handleSave = useCallback(() => {
    toast.success("Campaign saved", {
      description: `"${campaignName}" draft saved locally.`,
    });
  }, [campaignName]);

  const handleTestRun = useCallback(() => {
    toast.info("Test run started", {
      description: "Simulating workflow with 3 sample leads…",
    });
  }, []);

  const handlePublish = useCallback(() => {
    toast.success("Ready to publish", {
      description: "Connect your sending accounts to go live.",
    });
  }, []);

  const handleGenerateWithAI = useCallback(() => {
    setGenerateOpen(true);
  }, []);

  const handleSaveAsTemplate = useCallback(() => {
    setSaveTemplateOpen(true);
  }, []);

  const handleViewTemplates = useCallback(() => {
    setBlueprintListOpen(true);
  }, []);

  const handleSaveTemplateSubmit = useCallback(
    (name: string) => {
      const blueprint = serializeBlueprint(name, canvasNodes, canvasEdges);
      setSavedBlueprints((current) => [...current, blueprint]);
      setSaveTemplateOpen(false);
      toast.success("Campaign template saved", {
        description: `"${name}" is available in Saved Templates.`,
      });
    },
    [canvasNodes, canvasEdges],
  );

  const handleGenerateSubmit = useCallback((prompt: string) => {
    const sequence = generateSequence(prompt);
    canvasRef.current?.applyGenerated(sequence);
    setSelectedNode(null);
    setGenerateOpen(false);
    toast.success("Canvas generated", {
      description: `Built ${sequence.steps.length} steps from your prompt — every step is editable.`,
    });
  }, []);

  const handleAddNodeFromPalette = useCallback((type: string) => {
    canvasRef.current?.addNode(type);
  }, []);

  const handleNodeSelect = useCallback((node: Node<WorkflowNodeData> | null) => {
    setSelectedNode(node);
  }, []);

  const handleConfigChange = useCallback(
    (config: WorkflowNodeData["config"]) => {
      if (!selectedNode) return;

      canvasRef.current?.updateNodeConfig(selectedNode.id, config);
      setSelectedNode((current) =>
        current
          ? { ...current, data: { ...current.data, config } }
          : null,
      );
    },
    [selectedNode],
  );

  const handleClosePanel = useCallback(() => {
    setSelectedNode(null);
    canvasRef.current?.clearSelection();
  }, []);

  const handleDeleteNode = useCallback(() => {
    if (!selectedNode) return;
    canvasRef.current?.deleteNode(selectedNode.id);
    setSelectedNode(null);
  }, [selectedNode]);

  // Section 1: pressing Esc returns the inspector to the "No step selected" state.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClosePanel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClosePanel]);

  return (
    <div className="flex h-screen flex-col bg-white">
      <CampaignHeader
        campaignName={campaignName}
        onCampaignNameChange={setCampaignName}
        subtitle={subtitle}
        onSubtitleChange={setSubtitle}
        status={status}
        onStatusChange={setStatus}
        onSave={handleSave}
        onTestRun={handleTestRun}
        onPublish={handlePublish}
        onGenerateWithAI={handleGenerateWithAI}
        onSaveAsTemplate={handleSaveAsTemplate}
        onViewTemplates={handleViewTemplates}
      />

      <div className="flex min-h-0 flex-1">
        <NodePalette onAddNode={handleAddNodeFromPalette} />

        <main className="relative min-w-0 flex-1 border-x border-slate-200">
          <WorkflowCanvas
            ref={canvasRef}
            selectedNodeId={selectedNode?.id ?? null}
            onNodeSelect={handleNodeSelect}
            onCanvasChange={handleCanvasChange}
          />
        </main>

        <NodeConfigPanel
          selectedNode={selectedNode}
          canvasNodes={canvasNodes}
          canvasEdges={canvasEdges}
          onConfigChange={handleConfigChange}
          onClose={handleClosePanel}
          onDelete={handleDeleteNode}
        />
      </div>

      <GenerateDialog
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        onGenerate={handleGenerateSubmit}
      />

      <SaveTemplateDialog
        open={saveTemplateOpen}
        onClose={() => setSaveTemplateOpen(false)}
        onSave={handleSaveTemplateSubmit}
      />

      <BlueprintListDialog
        open={blueprintListOpen}
        blueprints={savedBlueprints}
        onClose={() => setBlueprintListOpen(false)}
      />
    </div>
  );
}
