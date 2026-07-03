"use client";

import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";

import { AppButton } from "@/components/app-button";
import { Textarea } from "@/components/ui/textarea";

interface GenerateDialogProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (prompt: string) => void;
}

const EXAMPLES = [
  "Cold outreach, 4 touches, stop if they reply",
  "3 follow-up emails then exit",
  "2 touches, hand off to Unibox when they respond",
];

/**
 * Chat-to-canvas entry point (Section 4). A lightweight modal that takes a
 * plain-text description and hands it to the deterministic generator. No real
 * LLM call happens here.
 */
export function GenerateDialog({
  open,
  onClose,
  onGenerate,
}: GenerateDialogProps) {
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    if (open) setPrompt("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const submit = () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    onGenerate(trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 pt-[12vh]"
      data-testid="generate-overlay"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Generate campaign with AI"
        data-testid="generate-dialog"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Generate with AI
              </h2>
              <p className="text-xs text-slate-500">
                Describe your sequence — we&apos;ll build the canvas.
              </p>
            </div>
          </div>
          <AppButton
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
            data-testid="generate-cancel"
          >
            <X className="h-4 w-4" />
          </AppButton>
        </div>

        <div className="space-y-3 p-4">
          <Textarea
            autoFocus
            data-testid="generate-input"
            value={prompt}
            placeholder="e.g. Cold outreach, 4 touches, stop if they reply"
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                submit();
              }
            }}
            className="min-h-[96px] focus-visible:ring-emerald-500"
          />

          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((example, index) => (
              <button
                key={example}
                type="button"
                data-testid={`generate-example-${index}`}
                onClick={() => setPrompt(example)}
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 transition-colors hover:border-emerald-300 hover:text-emerald-700"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 p-4">
          <AppButton variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </AppButton>
          <AppButton
            variant="primary"
            size="sm"
            onClick={submit}
            disabled={!prompt.trim()}
            data-testid="generate-submit"
          >
            <Sparkles className="h-4 w-4" />
            Generate
          </AppButton>
        </div>
      </div>
    </div>
  );
}
