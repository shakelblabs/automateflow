/**
 * MOCK — existing email templates referenced by Send Email (v2 §3).
 * Shape is swap-compatible with future Template Library data.
 * familyId groups templates; familySize is the step-count of the family (v2 §3.2).
 */
export interface EmailTemplate {
  id: string;
  name: string;
  familyId: string;
  familySize: number;
  stepPosition: number;
  previewText: string;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  // 1-step family (single-touch campaigns)
  {
    id: "single-touch-v1",
    name: "Single Touch v1",
    familyId: "single-1",
    familySize: 1,
    stepPosition: 1,
    previewText:
      "Subject: Quick idea for {{company}}\n\nHi {{first_name}},\n\nWorth a quick chat about {{company}}?",
  },
  // 3-step family
  {
    id: "cold-open-3-v1",
    name: "Cold Open v1",
    familyId: "cold-3",
    familySize: 3,
    stepPosition: 1,
    previewText:
      "Subject: Quick idea for {{company}}\n\nHi {{first_name}},\n\nI noticed {{company}} is scaling outbound — worth a quick chat?",
  },
  {
    id: "cold-open-3-v2",
    name: "Cold Open v2",
    familyId: "cold-3",
    familySize: 3,
    stepPosition: 1,
    previewText:
      "Subject: Another angle for {{company}}\n\nHi {{first_name}},\n\nDifferent hook — same goal: a quick conversation.",
  },
  {
    id: "follow-up-3-v1",
    name: "Follow-up v1",
    familyId: "cold-3",
    familySize: 3,
    stepPosition: 2,
    previewText:
      "Subject: Following up\n\nHi {{first_name}},\n\nJust bumping this in case it got buried. Still open to a quick call?",
  },
  {
    id: "breakup-3-v1",
    name: "Breakup v1",
    familyId: "cold-3",
    familySize: 3,
    stepPosition: 3,
    previewText:
      "Subject: Should I close the loop?\n\nHi {{first_name}},\n\nI'll assume the timing isn't right — happy to reconnect later.",
  },
  // 5-step family
  {
    id: "cold-open-5-v1",
    name: "Cold Open v1",
    familyId: "cold-5",
    familySize: 5,
    stepPosition: 1,
    previewText:
      "Subject: Idea for {{company}}\n\nHi {{first_name}},\n\nWe help teams like {{company}} automate outbound follow-up.",
  },
  {
    id: "value-prop-5-v1",
    name: "Value Prop v1",
    familyId: "cold-5",
    familySize: 5,
    stepPosition: 2,
    previewText:
      "Subject: How {{company}} could save 10 hrs/week\n\nHi {{first_name}},\n\nTeams using our platform cut manual follow-up by 60%.",
  },
  {
    id: "case-study-5-v1",
    name: "Case Study v1",
    familyId: "cold-5",
    familySize: 5,
    stepPosition: 3,
    previewText:
      "Subject: How Acme scaled to 500 leads/mo\n\nHi {{first_name}},\n\nAcme went from 50 to 500 leads per month in 90 days.",
  },
  {
    id: "follow-up-5-v1",
    name: "Follow-up v1",
    familyId: "cold-5",
    familySize: 5,
    stepPosition: 4,
    previewText:
      "Subject: Still relevant?\n\nHi {{first_name}},\n\nWanted to check if this is still on your radar.",
  },
  {
    id: "breakup-5-v1",
    name: "Breakup v1",
    familyId: "cold-5",
    familySize: 5,
    stepPosition: 5,
    previewText:
      "Subject: Closing the loop\n\nHi {{first_name}},\n\nI'll step back for now — reach out anytime if priorities shift.",
  },
];

export function getTemplateById(id: string | undefined): EmailTemplate | undefined {
  if (!id) return undefined;
  return EMAIL_TEMPLATES.find((template) => template.id === id);
}

export function filterTemplates(
  stepPosition: number | undefined,
  familySize: number | undefined,
): EmailTemplate[] {
  if (stepPosition == null || familySize == null || familySize < 1) return [];
  return EMAIL_TEMPLATES.filter(
    (template) =>
      template.stepPosition === stepPosition &&
      template.familySize === familySize,
  );
}
