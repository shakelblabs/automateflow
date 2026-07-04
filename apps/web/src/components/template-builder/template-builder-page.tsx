"use client";

import { useCallback, useMemo, useState } from "react";
import { Mailbox } from "lucide-react";

import type { FamilyDraft } from "@/components/shell/template-library-provider";
import { useTemplateLibrary } from "@/components/shell/template-library-provider";
import { FamilyEditor } from "@/components/template-builder/family-editor";
import { FamilySetupForm } from "@/components/template-builder/family-setup-form";
import { TemplateBuilderHeader } from "@/components/template-builder/template-builder-header";
import { TemplateFamilyList } from "@/components/template-builder/template-family-list";
import { defaultStepName } from "@/lib/template-families";

function createEmptyDraft(
  familyName: string,
  familySize: 1 | 3 | 5,
): FamilyDraft {
  return {
    familyName,
    familySize,
    steps: Array.from({ length: familySize }, (_, index) => {
      const stepPosition = index + 1;
      return {
        stepPosition,
        name: defaultStepName(stepPosition, familySize),
        subject: "",
        body: "",
      };
    }),
  };
}

function familyToDraft(
  familyId: string,
  familyName: string,
  familySize: number,
  templates: ReturnType<typeof useTemplateLibrary>["templates"],
): FamilyDraft {
  const byStep = new Map<number, (typeof templates)[number]>();
  for (const template of templates.filter((item) => item.familyId === familyId)) {
    if (!byStep.has(template.stepPosition)) {
      byStep.set(template.stepPosition, template);
    }
  }

  const steps = Array.from({ length: familySize }, (_, index) => {
    const stepPosition = index + 1;
    const template = byStep.get(stepPosition);
    return {
      stepPosition,
      name: template?.name ?? defaultStepName(stepPosition, familySize),
      subject: template?.subject ?? "",
      body: template?.body ?? "",
    };
  });

  return {
    familyId,
    familyName,
    familySize: familySize as 1 | 3 | 5,
    steps,
  };
}

export function TemplateBuilderPage() {
  const { templates, getFamilies, saveFamily } = useTemplateLibrary();
  const [activeFamilyId, setActiveFamilyId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [setupName, setSetupName] = useState("");
  const [setupSize, setSetupSize] = useState<1 | 3 | 5>(3);
  const [draft, setDraft] = useState<FamilyDraft | null>(null);

  const families = useMemo(() => getFamilies(), [getFamilies]);

  const startCreate = useCallback(() => {
    setSetupName("");
    setSetupSize(3);
    setDraft(null);
    setActiveFamilyId(null);
    setIsCreating(true);
  }, []);

  const startEdit = useCallback(
    (familyId: string) => {
      const family = families.find((item) => item.familyId === familyId);
      if (!family) return;
      setDraft(
        familyToDraft(
          family.familyId,
          family.familyName,
          family.familySize,
          templates,
        ),
      );
      setActiveFamilyId(familyId);
      setIsCreating(false);
    },
    [families, templates],
  );

  const handleSetupContinue = () => {
    setDraft(createEmptyDraft(setupName.trim(), setupSize));
    setIsCreating(false);
  };

  const handleSave = () => {
    if (!draft) return;
    saveFamily(draft);
    // After saving, if it was new, set it as active
    if (!draft.familyId) {
      // In a real app we'd get the new ID, but here we just clear the draft and active state
      // Actually, since saveFamily doesn't return the ID, we can just reset to empty state,
      // or we can try to guess the ID. For now, let's just reset the view.
      setActiveFamilyId(null);
    }
    setDraft(null);
  };

  const cancelSetup = () => {
    setIsCreating(false);
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <TemplateBuilderHeader />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left Pane: Sequence Library */}
        <TemplateFamilyList 
          families={families}
          activeFamilyId={isCreating ? null : activeFamilyId}
          onSelectFamily={startEdit}
          onCreateFamily={startCreate}
        />

        {/* Right Pane: Workspace Canvas */}
        <div className="flex-1 bg-slate-50/30">
          {isCreating ? (
            <div className="flex h-full items-center justify-center p-6">
              <FamilySetupForm
                familyName={setupName}
                familySize={setupSize}
                onFamilyNameChange={setSetupName}
                onFamilySizeChange={setSetupSize}
                onContinue={handleSetupContinue}
                onCancel={cancelSetup}
              />
            </div>
          ) : draft ? (
            <div className="h-full">
              <FamilyEditor
                draft={draft}
                onDraftChange={setDraft}
                onSave={handleSave}
              />
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Mailbox className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                Sequence Builder
              </h3>
              <p className="mt-2 max-w-sm text-sm text-slate-500">
                Select a sequence from the sidebar to start editing, or create a new one to begin building your multi-step campaign.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
