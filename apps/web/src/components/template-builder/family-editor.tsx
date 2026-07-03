"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

import { AppButton } from "@/components/app-button";
import {
  StepEditorPanel,
  type StepEditorState,
} from "@/components/template-builder/step-editor-panel";
import type { FamilyDraft } from "@/components/shell/template-library-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { defaultStepName } from "@/lib/template-families";

interface FamilyEditorProps {
  draft: FamilyDraft;
  onDraftChange: (draft: FamilyDraft) => void;
  onSave: () => void;
  onCancel: () => void;
  isEditing?: boolean;
}

function createStepStates(draft: FamilyDraft): StepEditorState[] {
  return draft.steps.map((step) => ({
    stepPosition: step.stepPosition,
    name: step.name,
    mode: "manual" as const,
    subject: step.subject,
    body: step.body,
    aiPrompt: "",
    aiTone: "professional" as const,
  }));
}

export function FamilyEditor({
  draft,
  onDraftChange,
  onSave,
  onCancel,
  isEditing = false,
}: FamilyEditorProps) {
  const [stepStates, setStepStates] = useState<StepEditorState[]>(() =>
    createStepStates(draft),
  );
  const [activeTab, setActiveTab] = useState("1");

  const syncDraft = useCallback(
    (nextSteps: StepEditorState[]) => {
      onDraftChange({
        ...draft,
        steps: nextSteps.map((step) => ({
          stepPosition: step.stepPosition,
          name: step.name,
          subject: step.subject,
          body: step.body,
        })),
      });
    },
    [draft, onDraftChange],
  );

  const updateStep = (stepPosition: number, next: StepEditorState) => {
    const nextSteps = stepStates.map((step) =>
      step.stepPosition === stepPosition ? next : step,
    );
    setStepStates(nextSteps);
    syncDraft(nextSteps);
  };

  const handleSave = () => {
    syncDraft(stepStates);
    onSave();
    toast.success(isEditing ? "Family updated" : "Family saved", {
      description: `${draft.familyName} is available in Campaign Canvas.`,
    });
  };

  return (
    <div data-testid="family-editor" className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            {isEditing ? "Edit family" : "Create family"}: {draft.familyName}
          </h2>
          <p className="text-xs text-slate-500">
            {draft.familySize}-step sequence — fill each step, then save all at once.
          </p>
        </div>
        <div className="flex gap-2">
          <AppButton variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </AppButton>
          <AppButton
            variant="primary"
            size="sm"
            data-testid="save-family"
            onClick={handleSave}
          >
            Save Family
          </AppButton>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100">
          {stepStates.map((step) => (
            <TabsTrigger
              key={step.stepPosition}
              value={String(step.stepPosition)}
              data-testid={`step-tab-${step.stepPosition}`}
            >
              Step {step.stepPosition}
              {!step.subject.trim() && !step.body.trim()
                ? ` (${defaultStepName(step.stepPosition, draft.familySize)})`
                : ""}
            </TabsTrigger>
          ))}
        </TabsList>

        {stepStates.map((step) => {
          const prior = stepStates.find(
            (candidate) => candidate.stepPosition === step.stepPosition - 1,
          );
          return (
            <TabsContent
              key={step.stepPosition}
              value={String(step.stepPosition)}
            >
              <StepEditorPanel
                step={step}
                priorStep={
                  prior
                    ? { subject: prior.subject, body: prior.body }
                    : undefined
                }
                onChange={(next) => updateStep(step.stepPosition, next)}
              />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
