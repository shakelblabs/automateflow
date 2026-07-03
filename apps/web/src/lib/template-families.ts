import type { EmailTemplate } from "@/lib/email-templates";

export interface TemplateFamilySummary {
  familyId: string;
  familyName: string;
  familySize: number;
  templates: EmailTemplate[];
  filledCount: number;
}

export function isStepFilled(template: EmailTemplate): boolean {
  return Boolean(template.subject.trim() || template.body.trim());
}

export function groupTemplatesByFamily(
  templates: EmailTemplate[],
): TemplateFamilySummary[] {
  const byFamily = new Map<string, EmailTemplate[]>();

  for (const template of templates) {
    const existing = byFamily.get(template.familyId) ?? [];
    existing.push(template);
    byFamily.set(template.familyId, existing);
  }

  return Array.from(byFamily.entries())
    .map(([familyId, familyTemplates]) => {
      const sorted = [...familyTemplates].sort(
        (a, b) => a.stepPosition - b.stepPosition,
      );
      const first = sorted[0];
      return {
        familyId,
        familyName: first.familyName,
        familySize: first.familySize,
        templates: sorted,
        filledCount: sorted.filter(isStepFilled).length,
      };
    })
    .sort((a, b) => a.familyName.localeCompare(b.familyName));
}

export function defaultStepName(stepPosition: number, familySize: number): string {
  if (familySize === 1) return "Single Touch";
  if (stepPosition === 1) return "Cold Open";
  if (stepPosition === familySize) return "Breakup";
  if (stepPosition === 2) return "Follow-up";
  return `Step ${stepPosition}`;
}
