"use client";

import { useCallback, useState } from "react";
import { Sparkles, PenTool } from "lucide-react";

import { AppButton } from "@/components/app-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TokenPicker } from "@/components/template-builder/token-picker";
import {
  generateTemplateCopy,
  type AiTone,
} from "@/lib/template-ai-generate";
import { cn } from "@/lib/utils";

export type StepEditorMode = "manual" | "ai";

export interface StepEditorState {
  stepPosition: number;
  name: string;
  mode: StepEditorMode;
  subject: string;
  body: string;
  aiPrompt: string;
  aiTone: AiTone;
}

interface StepEditorPanelProps {
  step: StepEditorState;
  onChange: (next: StepEditorState) => void;
}

type FocusField = "subject" | "body";

export function StepEditorPanel({
  step,
  onChange,
}: StepEditorPanelProps) {
  const [focusField, setFocusField] = useState<FocusField>("body");

  const patch = useCallback((updates: Partial<StepEditorState>) =>
    onChange({ ...step, ...updates }), [onChange, step]);

  const insertToken = useCallback(
    (token: string) => {
      const field = focusField;
      const element = document.getElementById(
        field === "subject" ? "field-subject" : "field-body",
      ) as HTMLTextAreaElement | null;
      const current = field === "subject" ? step.subject : step.body;
      const start = element?.selectionStart ?? current.length;
      const end = element?.selectionEnd ?? current.length;
      const nextValue =
        current.slice(0, start) + token + current.slice(end);
      patch(field === "subject" ? { subject: nextValue } : { body: nextValue });
    },
    [focusField, step.subject, step.body, patch, step],
  );

  const handleGenerate = () => {
    const generated = generateTemplateCopy(step.aiPrompt, step.aiTone);
    patch({ subject: generated.subject, body: generated.body, mode: "manual" });
  };

  return (
    <div
      className="space-y-8"
      data-testid={`step-editor-${step.stepPosition}`}
    >
      {/* Header: Name & Mode Toggle */}
      <div className="flex items-start justify-between border-b border-slate-100 pb-6">
        <div className="space-y-1.5 flex-1 max-w-md">
          <Label htmlFor={`step-name-${step.stepPosition}`} className="text-slate-500">Step Name</Label>
          <Input
            id={`step-name-${step.stepPosition}`}
            data-testid={`step-name-${step.stepPosition}`}
            value={step.name}
            onChange={(event) => patch({ name: event.target.value })}
            className="border-transparent bg-transparent px-0 text-xl font-semibold text-slate-900 shadow-none focus-visible:border-slate-300 focus-visible:bg-white focus-visible:px-3 focus-visible:ring-emerald-500 transition-all h-9"
            placeholder="e.g. Initial Outreach"
          />
        </div>

        <div className="flex rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            data-testid="mode-manual"
            onClick={() => patch({ mode: "manual" })}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              step.mode === "manual"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            )}
          >
            <PenTool className="h-3.5 w-3.5" />
            Manual
          </button>
          <button
            type="button"
            data-testid="mode-ai"
            onClick={() => patch({ mode: "ai" })}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              step.mode === "ai"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-500 hover:text-indigo-600",
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI-Assist
          </button>
        </div>
      </div>

      {step.mode === "ai" ? (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="field-aiPrompt" className="text-indigo-900">Intent / Offer Prompt</Label>
            <Textarea
              id="field-aiPrompt"
              data-testid="field-aiPrompt"
              value={step.aiPrompt}
              onChange={(event) => patch({ aiPrompt: event.target.value })}
              placeholder="Describe the offer or reason for reaching out…"
              className="min-h-[80px] bg-white border-indigo-200 focus-visible:ring-indigo-500"
            />
          </div>
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="field-aiTone" className="text-indigo-900">Tone</Label>
              <Select
                value={step.aiTone}
                onValueChange={(next) => next && patch({ aiTone: next as AiTone })}
              >
                <SelectTrigger
                  id="field-aiTone"
                  data-testid="field-aiTone"
                  className="w-full bg-white border-indigo-200 focus-visible:ring-indigo-500"
                >
                  <SelectValue placeholder="Select tone…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <AppButton
              variant="primary"
              data-testid="ai-generate-button"
              onClick={handleGenerate}
              className="bg-indigo-600 hover:bg-indigo-700 w-32"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate
            </AppButton>
          </div>
        </div>
      ) : null}

      <div className="relative rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
        {/* Token Picker Toolbar */}
        <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-2">
          <TokenPicker onInsert={insertToken} />
        </div>

        {/* Email Composer Layout */}
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-4 border-b border-slate-100 pb-4">
            <Label htmlFor="field-subject" className="w-16 shrink-0 pt-2 text-slate-500">Subject</Label>
            <Textarea
              id="field-subject"
              data-testid="field-subject"
              value={step.subject}
              onFocus={() => setFocusField("subject")}
              onChange={(event) => patch({ subject: event.target.value })}
              placeholder="Enter subject line..."
              className="min-h-[40px] resize-none border-0 p-2 text-base font-medium placeholder:text-slate-300 focus-visible:ring-0 shadow-none"
            />
          </div>

          <div className="flex items-start gap-4">
            <Label htmlFor="field-body" className="w-16 shrink-0 pt-2 text-slate-500">Body</Label>
            <Textarea
              id="field-body"
              data-testid="field-body"
              value={step.body}
              onFocus={() => setFocusField("body")}
              onChange={(event) => patch({ body: event.target.value })}
              placeholder="Write your email content here..."
              className="min-h-[200px] border-0 p-2 text-sm text-slate-700 placeholder:text-slate-300 focus-visible:ring-0 shadow-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
