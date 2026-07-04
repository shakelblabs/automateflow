"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, ChevronRight, Save } from "lucide-react";

import { AppButton } from "@/components/app-button";
import {
  StepEditorPanel,
  type StepEditorState,
} from "@/components/template-builder/step-editor-panel";
import { SpamScorePanel } from "@/components/template-builder/spam-score-panel";
import { SequenceFitPanel } from "@/components/template-builder/sequence-fit-panel";
import type { FamilyDraft } from "@/components/shell/template-library-provider";
import { defaultStepName } from "@/lib/template-families";

interface FamilyEditorProps {
  draft: FamilyDraft;
  onDraftChange: (draft: FamilyDraft) => void;
  onSave: () => void;
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
}: FamilyEditorProps) {
  const [stepStates, setStepStates] = useState<StepEditorState[]>(() =>
    createStepStates(draft),
  );
  const [activeStepId, setActiveStepId] = useState<number>(1);

  const activeStep = stepStates.find((s) => s.stepPosition === activeStepId)!;
  const priorStep = stepStates.find(
    (candidate) => candidate.stepPosition === activeStepId - 1,
  );

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

  const updateActiveStep = (next: StepEditorState) => {
    const nextSteps = stepStates.map((step) =>
      step.stepPosition === activeStepId ? next : step,
    );
    setStepStates(nextSteps);
    syncDraft(nextSteps);
  };

  const handleSave = () => {
    syncDraft(stepStates);
    onSave();
    toast.success(draft.familyId ? "Sequence updated" : "Sequence saved", {
      description: `${draft.familyName} is available in Campaign Canvas.`,
    });
  };

  return (
    <div
      data-testid="family-editor"
      className="flex h-full flex-col bg-white overflow-hidden"
    >
      {/* Editor Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 px-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-900">
            {draft.familyName}
          </span>
          <ChevronRight className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-500">
            {draft.familySize}-Step Sequence
          </span>
        </div>
        <AppButton
          variant="primary"
          size="sm"
          data-testid="save-family"
          onClick={handleSave}
          className="shadow-sm"
        >
          <Save className="mr-2 h-4 w-4" />
          Save Sequence
        </AppButton>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left Sub-column: Timeline */}
        <div className="w-64 shrink-0 border-r border-slate-200 bg-slate-50/50 p-6 overflow-y-auto">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-6">
            Sequence Timeline
          </h3>
          <div className="relative">
            {/* Continuous line */}
            <div className="absolute left-[11px] top-2 bottom-6 w-0.5 bg-slate-200" />
            
            <div className="space-y-6 relative">
              {stepStates.map((step, index) => {
                const isActive = step.stepPosition === activeStepId;
                const isFilled = step.subject.trim() || step.body.trim();
                
                return (
                  <button
                    key={step.stepPosition}
                    data-testid={`step-tab-${step.stepPosition}`}
                    onClick={() => setActiveStepId(step.stepPosition)}
                    className="flex w-full items-start gap-4 text-left group"
                  >
                    <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white border-2 shadow-sm transition-colors mt-0.5"
                      style={{
                        borderColor: isActive ? '#10b981' : isFilled ? '#94a3b8' : '#e2e8f0',
                      }}
                    >
                      {isFilled ? (
                        <CheckCircle2 className={`h-4 w-4 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                      ) : (
                        <span className={`text-[10px] font-bold ${isActive ? 'text-emerald-500' : 'text-slate-400'}`}>
                          {step.stepPosition}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium transition-colors ${isActive ? "text-emerald-700" : "text-slate-700 group-hover:text-slate-900"}`}>
                        Step {step.stepPosition}
                      </p>
                      <p className="text-xs text-slate-500 truncate max-w-[150px]">
                        {step.name || defaultStepName(step.stepPosition, draft.familySize)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center Sub-column: Composer */}
        <div className="flex-1 overflow-y-auto bg-white p-8">
          <div className="mx-auto max-w-2xl">
            <StepEditorPanel
              step={activeStep}
              onChange={updateActiveStep}
            />
          </div>
        </div>

        {/* Right Sub-column: Insights */}
        <div className="w-80 shrink-0 border-l border-slate-200 bg-slate-50 p-6 overflow-y-auto">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-6">
            AI Insights
          </h3>
          <div className="space-y-6">
            <SpamScorePanel subject={activeStep.subject} body={activeStep.body} />
            <SequenceFitPanel
              subject={activeStep.subject}
              body={activeStep.body}
              tone={activeStep.aiTone}
              stepPosition={activeStep.stepPosition}
              priorStep={priorStep ? { subject: priorStep.subject, body: priorStep.body } : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
