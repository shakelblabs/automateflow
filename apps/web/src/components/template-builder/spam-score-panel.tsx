"use client";

import { useState } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";

import { AppButton } from "@/components/app-button";
import { checkSpamScore, highlightSpamText } from "@/lib/template-spam-score";
import { cn } from "@/lib/utils";

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

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "low":
        return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case "medium":
        return "text-amber-600 bg-amber-50 border-amber-200";
      case "high":
        return "text-rose-600 bg-rose-50 border-rose-200";
      default:
        return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-slate-400" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Spam Analysis
          </h4>
        </div>
        <AppButton
          variant="secondary"
          size="sm"
          data-testid="check-spam-score"
          onClick={() => setChecked(true)}
          className="h-7 text-[11px] px-2.5"
        >
          Check Score
        </AppButton>
      </div>

      {checked && (subject.trim() || body.trim()) ? (
        <div data-testid="spam-score-result" className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                {result.score}
              </span>
              <span className="text-xs text-slate-500">/ 100</span>
            </div>
            <div
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                getRiskColor(result.risk)
              )}
            >
              {result.risk} Risk
            </div>
          </div>

          {result.flags.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Identified Issues
              </p>
              <ul className="space-y-2">
                {result.flags.map((flag, index) => (
                  <li key={`${flag.phrase}-${index}`} className="flex items-start gap-2 text-xs">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-700">&quot;{flag.phrase}&quot;</span>
                      <p className="text-slate-500 mt-0.5">{flag.suggestion}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">
              Looks good! No major spam triggers detected.
            </div>
          )}

          {result.flags.length > 0 && (
            <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-700">
              <p className="mb-1 text-[10px] font-semibold uppercase text-slate-500">Subject</p>
              <p className="mb-3 truncate">
                {subjectSegments.map((segment, index) =>
                  segment.flagged ? (
                    <mark
                      key={index}
                      className="rounded-sm bg-amber-100 px-0.5 text-amber-900 font-medium"
                    >
                      {segment.text}
                    </mark>
                  ) : (
                    <span key={index}>{segment.text}</span>
                  ),
                )}
              </p>
              <p className="mb-1 text-[10px] font-semibold uppercase text-slate-500">Body Preview</p>
              <p className="line-clamp-3">
                {bodySegments.map((segment, index) =>
                  segment.flagged ? (
                    <mark
                      key={index}
                      className="rounded-sm bg-amber-100 px-0.5 text-amber-900 font-medium"
                    >
                      {segment.text}
                    </mark>
                  ) : (
                    <span key={index}>{segment.text}</span>
                  ),
                )}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 text-center text-xs text-slate-400">
          Click check to analyze your content for common spam filters.
        </div>
      )}
    </div>
  );
}
