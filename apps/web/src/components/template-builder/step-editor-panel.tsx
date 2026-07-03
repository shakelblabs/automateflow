"use client";

import { useCallback, useState } from "react";

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
import { SequenceFitPanel } from "@/components/template-builder/sequence-fit-panel";
import { SpamScorePanel } from "@/components/template-builder/spam-score-panel";
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
  priorStep?: { subject: string; body: string };
  onChange: (next: StepEditorState) => void;
}

type FocusField = "subject" | "body";

export function StepEditorPanel({
  step,
  priorStep,
  onChange,
}: StepEditorPanelProps) {
  const [focusField, setFocusField] = useState<FocusField>("body");

  const patch = (updates: Partial<StepEditorState>) =>
    onChange({ ...step, ...updates });

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
    [focusField, step.subject, step.body, onChange, step],
  );

  const handleGenerate = () => {
    const generated = generateTemplateCopy(step.aiPrompt, step.aiTone);
    patch({ subject: generated.subject, body: generated.body, mode: "manual" });
  };

  return (
    <div
      className="space-y-4"
      data-testid={`step-editor-${step.stepPosition}`}
    >
      <div className="space-y-1.5">
        <Label htmlFor={`step-name-${step.stepPosition}`}>Step name</Label>
        <Input
          id={`step-name-${step.stepPosition}`}
          data-testid={`step-name-${step.stepPosition}`}
          value={step.name}
          onChange={(event) => patch({ name: event.target.value })}
          className="focus-visible:ring-emerald-500"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          data-testid="mode-manual"
          onClick={() => patch({ mode: "manual" })}
          className={cn(
            "rounded-md border px-3 py-1.5 text-xs font-medium",
            step.mode === "manual"
              ? "border-emerald-600 bg-emerald-50 text-emerald-800"
              : "border-slate-200 text-slate-600",
          )}
        >
          Manual
        </button>
        <button
          type="button"
          data-testid="mode-ai"
          onClick={() => patch({ mode: "ai" })}
          className={cn(
            "rounded-md border px-3 py-1.5 text-xs font-medium",
            step.mode === "ai"
              ? "border-emerald-600 bg-emerald-50 text-emerald-800"
              : "border-slate-200 text-slate-600",
          )}
        >
          AI-Assist
        </button>
      </div>

      {step.mode === "ai" ? (
        <div className="space-y-3 rounded-[0.625rem] border border-slate-200 p-3">
          <div className="space-y-1.5">
            <Label htmlFor="field-aiPrompt">Intent / offer prompt</Label>
            <Textarea
              id="field-aiPrompt"
              data-testid="field-aiPrompt"
              value={step.aiPrompt}
              onChange={(event) => patch({ aiPrompt: event.target.value })}
              placeholder="Describe the offer or reason for reaching out…"
              className="min-h-[80px] focus-visible:ring-emerald-500"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="field-aiTone">Tone</Label>
            <Select
              value={step.aiTone}
              onValueChange={(next) => next && patch({ aiTone: next as AiTone })}
            >
              <SelectTrigger
                id="field-aiTone"
                data-testid="field-aiTone"
                className="w-full focus-visible:ring-emerald-500"
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
            size="sm"
            data-testid="ai-generate-button"
            onClick={handleGenerate}
          >
            Generate
          </AppButton>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="field-subject">Subject</Label>
        <Textarea
          id="field-subject"
          data-testid="field-subject"
          value={step.subject}
          onFocus={() => setFocusField("subject")}
          onChange={(event) => patch({ subject: event.target.value })}
          className="min-h-[56px] focus-visible:ring-emerald-500"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="field-body">Body</Label>
        <Textarea
          id="field-body"
          data-testid="field-body"
          value={step.body}
          onFocus={() => setFocusField("body")}
          onChange={(event) => patch({ body: event.target.value })}
          className="min-h-[140px] focus-visible:ring-emerald-500"
        />
      </div>

      <TokenPicker onInsert={insertToken} />

      <div
        data-testid="template-preview"
        className="rounded-[0.625rem] border border-slate-200 bg-white p-3"
      >
        <p className="mb-1 text-xs font-medium text-slate-500">Preview</p>
        <p className="text-sm font-medium text-slate-800">
          {step.subject || "(No subject)"}
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
          {step.body || "(No body)"}
        </p>
      </div>

      <SpamScorePanel subject={step.subject} body={step.body} />
      <SequenceFitPanel
        subject={step.subject}
        body={step.body}
        tone={step.aiTone}
        stepPosition={step.stepPosition}
        priorStep={priorStep}
      />
    </div>
  );
}
