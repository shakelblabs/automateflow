"use client";

import { useMemo, useState } from "react";
import { ListTree, Info, AlertTriangle, CheckCircle2 } from "lucide-react";

import { AppButton } from "@/components/app-button";
import type { AiTone } from "@/lib/template-ai-generate";
import { checkSequenceFit } from "@/lib/template-sequence-fit";

interface SequenceFitPanelProps {
  subject: string;
  body: string;
  tone: AiTone;
  stepPosition: number;
  priorStep?: { subject: string; body: string };
}

export function SequenceFitPanel({
  subject,
  body,
  tone,
  stepPosition,
  priorStep,
}: SequenceFitPanelProps) {
  const [checked, setChecked] = useState(false);

  const result = useMemo(
    () =>
      checkSequenceFit({
        subject,
        body,
        tone,
        stepPosition,
        priorStep,
      }),
    [subject, body, tone, stepPosition, priorStep],
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm mt-6">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-4">
        <div className="flex items-center gap-2">
          <ListTree className="h-4 w-4 text-slate-400" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Sequence Fit
          </h4>
        </div>
        <AppButton
          variant="secondary"
          size="sm"
          data-testid="check-sequence-fit"
          onClick={() => setChecked(true)}
          className="h-7 text-[11px] px-2.5"
        >
          Check Fit
        </AppButton>
      </div>

      {checked ? (
        <div data-testid="sequence-fit-result" className="p-4 space-y-4">
          <div className="flex items-start gap-2.5 rounded-lg bg-indigo-50/50 p-3 border border-indigo-100/50 text-indigo-900">
            <Info className="h-4 w-4 shrink-0 text-indigo-500 mt-0.5" />
            <p className="text-xs font-medium leading-relaxed">
              {result.stepGuidance}
            </p>
          </div>

          {(result.toneMessages.length > 0 || result.repetitionMessages.length > 0) ? (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Fit Warnings
              </p>
              <ul className="space-y-2">
                {result.toneMessages.map((message) => (
                  <li key={message} className="flex items-start gap-2 text-xs">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500 mt-0.5" />
                    <span className="font-medium text-slate-700">{message}</span>
                  </li>
                ))}
                {result.repetitionMessages.map((message) => (
                  <li key={message} className="flex items-start gap-2 text-xs">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500 mt-0.5" />
                    <span className="font-medium text-slate-700">{message}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 rounded-lg bg-emerald-50 p-3 text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <p className="text-xs font-medium">
                Perfect! No tone or repetition issues flagged.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 text-center text-xs text-slate-400">
          Click check to analyze how well this step fits into the overall sequence.
        </div>
      )}
    </div>
  );
}
