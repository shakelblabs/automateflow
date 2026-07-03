"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  buildPreviewText,
  EMAIL_TEMPLATES,
  generateFamilyId,
  generateTemplateId,
  getTemplateById as lookupTemplate,
  type EmailTemplate,
} from "@/lib/email-templates";
import {
  groupTemplatesByFamily,
  type TemplateFamilySummary,
} from "@/lib/template-families";

export interface FamilyStepDraft {
  stepPosition: number;
  name: string;
  subject: string;
  body: string;
}

export interface FamilyDraft {
  familyId?: string;
  familyName: string;
  familySize: 1 | 3 | 5;
  steps: FamilyStepDraft[];
}

interface TemplateLibraryContextValue {
  templates: EmailTemplate[];
  getTemplateById: (id: string | undefined) => EmailTemplate | undefined;
  getFamilies: () => TemplateFamilySummary[];
  saveFamily: (draft: FamilyDraft) => void;
  deleteFamily: (familyId: string) => void;
}

const TemplateLibraryContext =
  createContext<TemplateLibraryContextValue | null>(null);

function draftToTemplates(
  draft: FamilyDraft,
  existingTemplates: EmailTemplate[],
): EmailTemplate[] {
  const familyId = draft.familyId ?? generateFamilyId(draft.familyName);
  const existingIdsByStep = new Map<number, string>();
  for (const template of existingTemplates) {
    if (
      template.familyId === familyId &&
      !existingIdsByStep.has(template.stepPosition)
    ) {
      existingIdsByStep.set(template.stepPosition, template.id);
    }
  }

  return draft.steps.map((step) => {
    const subject = step.subject.trim();
    const body = step.body.trim();
    const name = step.name.trim() || `Step ${step.stepPosition}`;
    const id =
      existingIdsByStep.get(step.stepPosition) ??
      generateTemplateId(familyId, step.stepPosition);

    return {
      id,
      name,
      familyId,
      familyName: draft.familyName.trim(),
      familySize: draft.familySize,
      stepPosition: step.stepPosition,
      subject,
      body,
      previewText: buildPreviewText(subject, body),
    };
  });
}

export function TemplateLibraryProvider({ children }: { children: ReactNode }) {
  const [templates, setTemplates] = useState<EmailTemplate[]>(EMAIL_TEMPLATES);

  const getTemplateById = useCallback(
    (id: string | undefined) => lookupTemplate(id, templates),
    [templates],
  );

  const getFamilies = useCallback(
    () => groupTemplatesByFamily(templates),
    [templates],
  );

  const saveFamily = useCallback((draft: FamilyDraft) => {
    setTemplates((current) => {
      const familyId = draft.familyId ?? generateFamilyId(draft.familyName);
      const nextRecords = draftToTemplates({ ...draft, familyId }, current);
      const withoutFamily = current.filter(
        (template) => template.familyId !== familyId,
      );
      return [...withoutFamily, ...nextRecords];
    });
  }, []);

  const deleteFamily = useCallback((familyId: string) => {
    setTemplates((current) =>
      current.filter((template) => template.familyId !== familyId),
    );
  }, []);

  const resetTemplates = useCallback(() => {
    setTemplates([]);
  }, []);

  // Test fixtures — `?templates=empty` on first load, or window hook for mid-session reset.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("templates") === "empty") {
      setTemplates([]);
    }

    if (process.env.NODE_ENV === "production") return;

    type TemplateLibraryTestWindow = Window & {
      __templateLibraryTest?: { resetTemplates: () => void };
    };

    (window as TemplateLibraryTestWindow).__templateLibraryTest = {
      resetTemplates,
    };

    return () => {
      delete (window as TemplateLibraryTestWindow).__templateLibraryTest;
    };
  }, [resetTemplates]);

  const value = useMemo(
    () => ({
      templates,
      getTemplateById,
      getFamilies,
      saveFamily,
      deleteFamily,
    }),
    [templates, getTemplateById, getFamilies, saveFamily, deleteFamily],
  );

  return (
    <TemplateLibraryContext.Provider value={value}>
      {children}
    </TemplateLibraryContext.Provider>
  );
}

export function useTemplateLibrary() {
  const context = useContext(TemplateLibraryContext);
  if (!context) {
    throw new Error(
      "useTemplateLibrary must be used within TemplateLibraryProvider",
    );
  }
  return context;
}
