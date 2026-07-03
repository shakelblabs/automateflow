"use client";

import { useMemo, useState } from "react";

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
    <div className="space-y-3 rounded-[0.625rem] border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-600">
          Tone &amp; sequence fit
        </p>
        <AppButton
          variant="secondary"
          size="sm"
          data-testid="check-sequence-fit"
          onClick={() => setChecked(true)}
        >
          Check Tone &amp; Sequence Fit
        </AppButton>
      </div>

      {checked ? (
        <div data-testid="sequence-fit-result" className="space-y-2 text-xs text-slate-600">
          <p className="font-medium text-slate-800">{result.stepGuidance}</p>

          {result.toneMessages.map((message) => (
            <p key={message} className="text-amber-800">
              {message}
            </p>
          ))}

          {result.repetitionMessages.map((message) => (
            <p key={message} className="text-amber-800">
              {message}
            </p>
          ))}

          {result.toneMessages.length === 0 &&
          result.repetitionMessages.length === 0 ? (
            <p className="text-slate-500">No tone or repetition issues flagged.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
