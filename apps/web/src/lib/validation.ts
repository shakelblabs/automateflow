import type { Edge, Node } from "@xyflow/react";

import { getNodeDefinition } from "@/lib/node-definitions";
import { getEffectiveTemplateId } from "@/lib/send-email-config";
import type { WorkflowNodeData } from "@/components/campaign/nodes/types";

export type ValidationCode =
  | "no-entry-trigger"
  | "dead-end"
  | "unconnected-yes"
  | "no-lead-list"
  | "no-template-selected";

export interface ValidationIssue {
  code: ValidationCode;
  message: string;
  nodeId?: string;
}

/**
 * Live canvas validation (Section 3). Runs on every nodes/edges change.
 * Terminal nodes (Exit Sequence, Handoff: Unibox — `terminal: true`) are
 * intentionally excluded from the dead-end check: they are correct dead-ends
 * by design and must not raise a false warning.
 */
export function validateCanvas(
  nodes: Node<WorkflowNodeData>[],
  edges: Edge[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // 1) No entry trigger on canvas.
  const entryTriggers = nodes.filter(
    (node) => getNodeDefinition(node.data.nodeType)?.isEntryTrigger,
  );
  if (entryTriggers.length === 0) {
    issues.push({
      code: "no-entry-trigger",
      message:
        'No entry trigger — add a "New Lead Added" step to start the campaign.',
    });
  }

  for (const node of nodes) {
    const definition = getNodeDefinition(node.data.nodeType);
    if (!definition) continue;

    const outgoing = edges.filter((edge) => edge.source === node.id);

    // 2a) Entry trigger with no lead list selected (v2 §2).
    if (definition.isEntryTrigger && !node.data.config.leadList) {
      issues.push({
        code: "no-lead-list",
        nodeId: node.id,
        message: `"${node.data.label}" has no lead list selected.`,
      });
    }

    // 2b) Send Email template validation (v2 §3–§4).
    if (node.data.nodeType === "action-send-email") {
      const cfg = node.data.config;
      const missingTemplate = cfg.abEnabled
        ? !getEffectiveTemplateId(cfg, "aTemplateId") ||
          !getEffectiveTemplateId(cfg, "bTemplateId")
        : !getEffectiveTemplateId(cfg, "templateId");

      if (missingTemplate) {
        issues.push({
          code: "no-template-selected",
          nodeId: node.id,
          message: `"${node.data.label}" has no template selected.`,
        });
      }
    }

    // 2) Dead end: a node that should have an outgoing connection but has none.
    //    Terminal nodes are excluded by design.
    if (definition.hasOutput && !definition.terminal && outgoing.length === 0) {
      issues.push({
        code: "dead-end",
        nodeId: node.id,
        message: `"${node.data.label}" is a dead end — connect it to the next step.`,
      });
    }

    // 3) Condition: Replied? Yes-path not connected.
    if (definition.outputs === 2 && !definition.deferred) {
      const hasYes = edges.some(
        (edge) => edge.source === node.id && edge.sourceHandle === "yes",
      );
      if (!hasYes) {
        issues.push({
          code: "unconnected-yes",
          nodeId: node.id,
          message: `"${node.data.label}" Yes-path is not connected.`,
        });
      }
    }
  }

  return issues;
}
