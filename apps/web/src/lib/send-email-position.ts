import type { Edge, Node } from "@xyflow/react";

import { getNodeDefinition } from "@/lib/node-definitions";
import { filterTemplates, type EmailTemplate } from "@/lib/email-templates";
import type { WorkflowNodeData } from "@/components/campaign/nodes/types";

const SEND_EMAIL_TYPE = "action-send-email";

function isSendEmailNode(node: Node<WorkflowNodeData>): boolean {
  return node.data.nodeType === SEND_EMAIL_TYPE;
}

function isTerminalNode(node: Node<WorkflowNodeData>): boolean {
  return Boolean(getNodeDefinition(node.data.nodeType)?.terminal);
}

function findEntryTrigger(
  nodes: Node<WorkflowNodeData>[],
): Node<WorkflowNodeData> | undefined {
  return nodes.find(
    (node) => getNodeDefinition(node.data.nodeType)?.isEntryTrigger,
  );
}

function buildAdjacency(edges: Edge[]): Map<string, string[]> {
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    const next = adjacency.get(edge.source) ?? [];
    next.push(edge.target);
    adjacency.set(edge.source, next);
  }
  return adjacency;
}

function countSendEmailsOnPath(
  path: string[],
  nodesById: Map<string, Node<WorkflowNodeData>>,
): number {
  return path.filter((id) => {
    const node = nodesById.get(id);
    return node ? isSendEmailNode(node) : false;
  }).length;
}

/**
 * MOCK — replace with real family/step metadata once Template Library exists.
 * Total Send Email nodes on the longest path from entry trigger to any terminal.
 */
export function getTotalStepsInPath(
  nodes: Node<WorkflowNodeData>[],
  edges: Edge[],
): number | undefined {
  const entry = findEntryTrigger(nodes);
  if (!entry) return undefined;

  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const adjacency = buildAdjacency(edges);
  const terminals = nodes.filter(isTerminalNode).map((node) => node.id);
  if (terminals.length === 0) return undefined;

  let maxSendEmails = 0;
  let foundPath = false;

  const walk = (nodeId: string, path: string[], visited: Set<string>) => {
    if (visited.has(nodeId)) return;
    const nextVisited = new Set(visited);
    nextVisited.add(nodeId);
    const nextPath = [...path, nodeId];

    const node = nodesById.get(nodeId);
    if (node && isTerminalNode(node)) {
      foundPath = true;
      maxSendEmails = Math.max(maxSendEmails, countSendEmailsOnPath(nextPath, nodesById));
      return;
    }

    const children = adjacency.get(nodeId) ?? [];
    if (children.length === 0) return;

    for (const child of children) {
      walk(child, nextPath, nextVisited);
    }
  };

  walk(entry.id, [], new Set());
  return foundPath ? maxSendEmails : undefined;
}

/**
 * MOCK — ordinal Send Email position along the first reachable path from entry.
 */
export function getStepPosition(
  nodes: Node<WorkflowNodeData>[],
  edges: Edge[],
  nodeId: string,
): number | undefined {
  const entry = findEntryTrigger(nodes);
  if (!entry) return undefined;

  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const target = nodesById.get(nodeId);
  if (!target || !isSendEmailNode(target)) return undefined;

  const adjacency = buildAdjacency(edges);
  const queue: { id: string; path: string[] }[] = [{ id: entry.id, path: [entry.id] }];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.id)) continue;
    visited.add(current.id);

    if (current.id === nodeId) {
      return countSendEmailsOnPath(current.path, nodesById);
    }

    for (const child of adjacency.get(current.id) ?? []) {
      queue.push({ id: child, path: [...current.path, child] });
    }
  }

  return undefined;
}

export function filterTemplatesForNode(
  nodes: Node<WorkflowNodeData>[],
  edges: Edge[],
  nodeId: string,
): EmailTemplate[] {
  const stepPosition = getStepPosition(nodes, edges, nodeId);
  const familySize = getTotalStepsInPath(nodes, edges);
  return filterTemplates(stepPosition, familySize);
}
