"use client";

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
    <div className="space-y-1.5" data-testid="token-picker">
      <p className="text-xs font-medium text-slate-600">Insert variable</p>
      <div className="flex flex-wrap gap-1.5">
        {ACTIVE_TOKENS.map(({ token, label }) => (
          <button
            key={token}
            type="button"
            data-testid={`token-${token}`}
            onClick={() => onInsert(token)}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          data-testid="token-personalization"
          disabled
          title={FUTURE_TOKEN.tooltip}
          className="cursor-not-allowed rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-400"
        >
          {FUTURE_TOKEN.label}
        </button>
      </div>
    </div>
  );
}
