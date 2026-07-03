"use client";

import { useState } from "react";
import { GripVertical, Lock, Search } from "lucide-react";

import {
  PALETTE_GROUPS,
  getNodesByPaletteGroup,
  type NodeDefinition,
} from "@/lib/node-definitions";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const DEFERRED_TOOLTIP = "Available in a future release";

interface NodePaletteProps {
  onAddNode: (type: string) => void;
}

function PaletteItem({
  node,
  onAddNode,
}: {
  node: NodeDefinition;
  onAddNode: (type: string) => void;
}) {
  const Icon = node.icon;

  const onDragStart = (event: React.DragEvent) => {
    // Drag payload contract with the canvas (rule: MIME `application/reactflow`).
    event.dataTransfer.setData("application/reactflow", node.type);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <button
      type="button"
      draggable
      data-testid={`palette-item-${node.type}`}
      onDragStart={onDragStart}
      onClick={() => onAddNode(node.type)}
      className="group flex w-full items-start gap-2.5 rounded-[0.625rem] border border-slate-200 bg-white p-2.5 text-left transition-colors hover:border-emerald-300 hover:bg-emerald-50/50 active:cursor-grabbing"
    >
      <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 group-hover:text-slate-400" />
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          node.category === "trigger"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-slate-100 text-slate-600",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900">{node.label}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
          {node.description}
        </p>
      </div>
    </button>
  );
}

/**
 * Deferred node (Section 2.9): visually greyed, NOT draggable and NOT clickable
 * — a plain div with no drag payload or click handler. Tooltip on hover.
 */
function DeferredItem({ node }: { node: NodeDefinition }) {
  const Icon = node.icon;

  return (
    <div
      data-testid={`palette-deferred-${node.type}`}
      title={DEFERRED_TOOLTIP}
      aria-disabled="true"
      className="flex w-full cursor-not-allowed items-start gap-2.5 rounded-[0.625rem] border border-dashed border-slate-200 bg-slate-50 p-2.5 opacity-60 select-none"
    >
      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-400">{node.label}</p>
        <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">
          {DEFERRED_TOOLTIP}
        </p>
      </div>
    </div>
  );
}

export function NodePalette({ onAddNode }: NodePaletteProps) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();

  const matches = (node: NodeDefinition) =>
    !normalized ||
    node.label.toLowerCase().includes(normalized) ||
    node.description.toLowerCase().includes(normalized);

  const groups = PALETTE_GROUPS.map((group) => {
    const nodes = getNodesByPaletteGroup(group.id);
    return {
      ...group,
      active: nodes.filter((node) => !node.deferred && matches(node)),
      deferred: nodes.filter((node) => node.deferred && matches(node)),
    };
  }).filter((group) => group.active.length > 0 || group.deferred.length > 0);

  return (
    <aside className="flex w-[320px] min-h-0 shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-900">Workflow steps</h2>
        <p className="mt-1 text-xs text-slate-500">
          Drag or click to add steps to your canvas
        </p>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search steps…"
            aria-label="Search steps"
            className="h-9 pl-9 focus-visible:ring-emerald-500"
          />
        </div>
      </div>

      <ScrollArea data-testid="workflow-steps-scroll" className="min-h-0 flex-1">
        <div className="space-y-5 p-4">
          {groups.length === 0 ? (
            <p
              data-testid="palette-empty"
              className="px-1 text-sm text-slate-500"
            >
              No steps match “{query}”.
            </p>
          ) : (
            groups.map((group) => (
              <section key={group.id}>
                <div className="mb-2">
                  <h3 className="text-xs font-semibold tracking-wide text-slate-900 uppercase">
                    {group.label}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {group.description}
                  </p>
                </div>

                {group.active.length > 0 && (
                  <div className="space-y-2">
                    {group.active.map((node) => (
                      <PaletteItem
                        key={node.type}
                        node={node}
                        onAddNode={onAddNode}
                      />
                    ))}
                  </div>
                )}

                {group.deferred.length > 0 && (
                  <div
                    data-testid={`palette-coming-soon-${group.id}`}
                    className="mt-3"
                  >
                    <p className="mb-2 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                      Coming soon
                    </p>
                    <div className="space-y-2">
                      {group.deferred.map((node) => (
                        <DeferredItem key={node.type} node={node} />
                      ))}
                    </div>
                  </div>
                )}
              </section>
            ))
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
