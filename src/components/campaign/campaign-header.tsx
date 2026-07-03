"use client";

import { useEffect, useRef, useState } from "react";
import { LayoutTemplate, Play, Rocket, Save, Sparkles } from "lucide-react";

import { AppButton } from "@/components/app-button";
import { cn } from "@/lib/utils";

export type CampaignStatus = "draft" | "active" | "paused";

const STATUS_ORDER: CampaignStatus[] = ["draft", "active", "paused"];

const STATUS_STYLES: Record<CampaignStatus, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "border-slate-200 bg-slate-50 text-slate-600",
  },
  active: {
    label: "Active",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  paused: {
    label: "Paused",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
};

interface CampaignHeaderProps {
  campaignName: string;
  onCampaignNameChange: (name: string) => void;
  subtitle: string;
  onSubtitleChange: (subtitle: string) => void;
  status: CampaignStatus;
  onStatusChange: (status: CampaignStatus) => void;
  onSave: () => void;
  onTestRun: () => void;
  onPublish: () => void;
  onGenerateWithAI: () => void;
  onSaveAsTemplate: () => void;
  onViewTemplates: () => void;
}

function InlineEdit({
  value,
  onChange,
  ariaLabel,
  testId,
  className,
  inputClassName,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  testId: string;
  className?: string;
  inputClassName?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    const next = draft.trim();
    if (next) onChange(next);
    else setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        aria-label={ariaLabel}
        data-testid={`${testId}-input`}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit();
          if (event.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className={cn(
          "rounded-md border border-slate-200 bg-white px-1 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
          inputClassName,
        )}
      />
    );
  }

  return (
    <button
      type="button"
      data-testid={testId}
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      className={cn(
        "rounded-md px-1 text-left hover:bg-slate-100",
        className,
      )}
    >
      {value}
    </button>
  );
}

export function CampaignHeader({
  campaignName,
  onCampaignNameChange,
  subtitle,
  onSubtitleChange,
  status,
  onStatusChange,
  onSave,
  onTestRun,
  onPublish,
  onGenerateWithAI,
  onSaveAsTemplate,
  onViewTemplates,
}: CampaignHeaderProps) {
  const statusStyle = STATUS_STYLES[status];

  const cycleStatus = () => {
    const index = STATUS_ORDER.indexOf(status);
    onStatusChange(STATUS_ORDER[(index + 1) % STATUS_ORDER.length]);
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-[0.625rem] bg-emerald-600 text-sm font-bold text-white">
          AF
        </div>
        <div className="min-w-0">
          <InlineEdit
            value={campaignName}
            onChange={onCampaignNameChange}
            ariaLabel="Campaign name"
            testId="campaign-name"
            className="max-w-[280px] truncate text-base font-semibold text-slate-900"
            inputClassName="max-w-[280px] text-base font-semibold text-slate-900"
          />
          <InlineEdit
            value={subtitle}
            onChange={onSubtitleChange}
            ariaLabel="Campaign subtitle"
            testId="campaign-subtitle"
            className="block max-w-[280px] truncate text-xs text-slate-500"
            inputClassName="max-w-[280px] text-xs text-slate-500"
          />
        </div>
        <button
          type="button"
          data-testid="status-badge"
          onClick={cycleStatus}
          title="Click to change status"
          className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
            statusStyle.className,
          )}
        >
          {statusStyle.label}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <AppButton variant="ghost" size="sm" onClick={onGenerateWithAI}>
          <Sparkles className="h-4 w-4" />
          Generate with AI
        </AppButton>
        <AppButton variant="ghost" size="sm" onClick={onTestRun}>
          <Play className="h-4 w-4" />
          Test run
        </AppButton>
        <AppButton variant="ghost" size="sm" onClick={onSaveAsTemplate}>
          <LayoutTemplate className="h-4 w-4" />
          Save as Campaign Template
        </AppButton>
        <AppButton variant="ghost" size="sm" onClick={onViewTemplates}>
          <LayoutTemplate className="h-4 w-4" />
          Saved Templates
        </AppButton>
        <AppButton variant="secondary" size="sm" onClick={onSave}>
          <Save className="h-4 w-4" />
          Save
        </AppButton>
        <AppButton variant="primary" size="sm" onClick={onPublish}>
          <Rocket className="h-4 w-4" />
          Publish
        </AppButton>
      </div>
    </header>
  );
}
