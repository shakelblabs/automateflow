"use client";

import { useState } from "react";

import { AppButton } from "@/components/app-button";
import { checkSpamScore, highlightSpamText } from "@/lib/template-spam-score";

interface SpamScorePanelProps {
  subject: string;
  body: string;
}

export function SpamScorePanel({ subject, body }: SpamScorePanelProps) {
  const [checked, setChecked] = useState(false);
  const result = checkSpamScore(subject, body);
  const subjectSegments = highlightSpamText(subject, result.flags, 0);
  const bodyOffset = subject.length + 2;
  const bodySegments = highlightSpamText(body, result.flags, bodyOffset);

  return (
    <div className="space-y-3 rounded-[0.625rem] border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-600">Spam score check</p>
        <AppButton
          variant="secondary"
          size="sm"
          data-testid="check-spam-score"
          onClick={() => setChecked(true)}
        >
          Check Spam Score
        </AppButton>
      </div>

      {checked && (subject.trim() || body.trim()) ? (
        <div data-testid="spam-score-result" className="space-y-2">
          <p className="text-sm font-semibold text-slate-900">
            Score: {result.score}/100 — {result.risk} risk
          </p>

          {result.flags.length > 0 ? (
            <ul className="space-y-1 text-xs text-slate-600">
              {result.flags.map((flag, index) => (
                <li key={`${flag.phrase}-${index}`}>
                  <span className="font-medium text-amber-700">{flag.phrase}</span>
                  {" — "}
                  {flag.suggestion}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">No spam triggers detected.</p>
          )}

          <div className="rounded-md border border-slate-200 bg-white p-2 text-xs text-slate-700">
            <p className="mb-1 font-medium text-slate-500">Subject</p>
            <p>
              {subjectSegments.map((segment, index) =>
                segment.flagged ? (
                  <mark
                    key={index}
                    className="rounded bg-amber-100 px-0.5 text-amber-900"
                  >
                    {segment.text}
                  </mark>
                ) : (
                  <span key={index}>{segment.text}</span>
                ),
              )}
            </p>
            <p className="mb-1 mt-2 font-medium text-slate-500">Body</p>
            <p className="whitespace-pre-wrap">
              {bodySegments.map((segment, index) =>
                segment.flagged ? (
                  <mark
                    key={index}
                    className="rounded bg-amber-100 px-0.5 text-amber-900"
                  >
                    {segment.text}
                  </mark>
                ) : (
                  <span key={index}>{segment.text}</span>
                ),
              )}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
