"use client";

import { useCallback, useMemo, useState } from "react";

import type { FamilyDraft } from "@/components/shell/template-library-provider";
import { useTemplateLibrary } from "@/components/shell/template-library-provider";
import { FamilyEditor } from "@/components/template-builder/family-editor";
import { FamilySetupForm } from "@/components/template-builder/family-setup-form";
import { TemplateBuilderHeader } from "@/components/template-builder/template-builder-header";
import { TemplateFamilyList } from "@/components/template-builder/template-family-list";
import { defaultStepName } from "@/lib/template-families";

type View = "list" | "setup" | "editor";

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
  const [view, setView] = useState<View>("list");
  const [setupName, setSetupName] = useState("");
  const [setupSize, setSetupSize] = useState<1 | 3 | 5>(3);
  const [draft, setDraft] = useState<FamilyDraft | null>(null);

  const families = useMemo(() => getFamilies(), [getFamilies, templates]);

  const startCreate = useCallback(() => {
    setSetupName("");
    setSetupSize(3);
    setDraft(null);
    setView("setup");
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
      setView("editor");
    },
    [families, templates],
  );

  const handleSetupContinue = () => {
    setDraft(createEmptyDraft(setupName.trim(), setupSize));
    setView("editor");
  };

  const handleSave = () => {
    if (!draft) return;
    saveFamily(draft);
    setDraft(null);
    setView("list");
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <TemplateBuilderHeader
        onCreateFamily={startCreate}
        showCreate={view === "list"}
      />

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {view === "list" ? (
          <TemplateFamilyList families={families} onSelectFamily={startEdit} />
        ) : null}

        {view === "setup" ? (
          <FamilySetupForm
            familyName={setupName}
            familySize={setupSize}
            onFamilyNameChange={setSetupName}
            onFamilySizeChange={setSetupSize}
            onContinue={handleSetupContinue}
            onCancel={() => setView("list")}
          />
        ) : null}

        {view === "editor" && draft ? (
          <FamilyEditor
            draft={draft}
            onDraftChange={setDraft}
            onSave={handleSave}
            onCancel={() => setView("list")}
            isEditing={Boolean(draft.familyId)}
          />
        ) : null}
      </div>
    </div>
  );
}
