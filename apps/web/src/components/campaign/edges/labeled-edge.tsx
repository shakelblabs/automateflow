"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";

export interface LabeledEdgeData extends Record<string, unknown> {
  /** Branch label rendered on the edge (e.g. "Yes" / "No"). */
  label?: string;
  /** Branch tone drives the edge color. */
  tone?: "yes" | "no";
}

const TONE_COLOR: Record<string, string> = {
  yes: "#059669", // emerald-600
  no: "#94a3b8", // slate-400
  default: "#059669",
};

/**
 * Custom edge (registered via `edgeTypes`) — consistent styling everywhere, with
 * an optional colored branch label for the Condition: Replied? Yes/No paths
 * (Section 2.5 / rule 8).
 */
function LabeledEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeData = data as LabeledEdgeData | undefined;
  const tone = edgeData?.tone;
  const stroke = TONE_COLOR[tone ?? "default"];
  const label = edgeData?.label;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ stroke, strokeWidth: 2 }}
      />
      {label ? (
        <EdgeLabelRenderer>
          <div
            data-testid={`edge-label-${id}`}
            data-branch={tone}
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            className="pointer-events-none rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shadow-sm"
          >
            <span
              className={
                tone === "yes"
                  ? "text-emerald-700"
                  : tone === "no"
                    ? "text-slate-500"
                    : "text-slate-500"
              }
            >
              {label}
            </span>
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

export const LabeledEdge = LabeledEdgeComponent;
