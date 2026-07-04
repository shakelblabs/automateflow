"use client";

import { Braces } from "lucide-react";

interface TokenPickerProps {
  onInsert: (token: string) => void;
}

export const ACTIVE_TOKENS = [
  { token: "{first_name}", label: "First name" },
  { token: "{last_name}", label: "Last name" },
  { token: "{company}", label: "Company" },
  { token: "{job_title}", label: "Job title" },
  { token: "{city}", label: "City" },
] as const;

const FUTURE_TOKEN = {
  token: "{personalization}",
  label: "Personalization",
  tooltip: "Coming soon — AI-powered personalization from lead data",
};

export function TokenPicker({ onInsert }: TokenPickerProps) {
  return (
    <div className="flex items-center gap-3" data-testid="token-picker">
      <div className="flex items-center gap-1.5 text-slate-400">
        <Braces className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wider">Variables</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {ACTIVE_TOKENS.map(({ token, label }) => (
          <button
            key={token}
            type="button"
            data-testid={`token-${token}`}
            onClick={() => onInsert(token)}
            className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-emerald-100 hover:text-emerald-700 active:bg-emerald-200"
          >
            {label}
          </button>
        ))}
        <div className="h-4 w-px bg-slate-200 mx-1" />
        <button
          type="button"
          data-testid="token-personalization"
          disabled
          title={FUTURE_TOKEN.tooltip}
          className="cursor-not-allowed rounded-full border border-dashed border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-400"
        >
          {FUTURE_TOKEN.label}
        </button>
      </div>
    </div>
  );
}
