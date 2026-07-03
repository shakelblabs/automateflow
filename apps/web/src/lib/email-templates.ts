/**
 * MOCK — email templates referenced by Send Email (v2 §3) and Template Builder.
 * Seed data initializes TemplateLibraryProvider; shape is swap-compatible with real data.
 */
export interface EmailTemplate {
  id: string;
  name: string;
  familyId: string;
  familyName: string;
  familySize: number;
  stepPosition: number;
  subject: string;
  body: string;
  previewText: string;
}

export function buildPreviewText(subject: string, body: string): string {
  return `Subject: ${subject}\n\n${body}`;
}

function seedTemplate(
  template: Omit<EmailTemplate, "subject" | "body" | "previewText"> & {
    previewText: string;
  },
): EmailTemplate {
  const match = template.previewText.match(/^Subject: (.+)\n\n([\s\S]*)$/);
  const subject = match?.[1] ?? "";
  const body = match?.[2] ?? template.previewText;
  return {
    ...template,
    subject,
    body,
    previewText: buildPreviewText(subject, body),
  };
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  seedTemplate({
    id: "single-touch-v1",
    name: "Single Touch v1",
    familyId: "single-1",
    familyName: "Single Touch",
    familySize: 1,
    stepPosition: 1,
    previewText:
      "Subject: Quick idea for {{company}}\n\nHi {{first_name}},\n\nWorth a quick chat about {{company}}?",
  }),
  seedTemplate({
    id: "cold-open-3-v1",
    name: "Cold Open v1",
    familyId: "cold-3",
    familyName: "3-Step Cold Outreach",
    familySize: 3,
    stepPosition: 1,
    previewText:
      "Subject: Quick idea for {{company}}\n\nHi {{first_name}},\n\nI noticed {{company}} is scaling outbound — worth a quick chat?",
  }),
  seedTemplate({
    id: "cold-open-3-v2",
    name: "Cold Open v2",
    familyId: "cold-3",
    familyName: "3-Step Cold Outreach",
    familySize: 3,
    stepPosition: 1,
    previewText:
      "Subject: Another angle for {{company}}\n\nHi {{first_name}},\n\nDifferent hook — same goal: a quick conversation.",
  }),
  seedTemplate({
    id: "follow-up-3-v1",
    name: "Follow-up v1",
    familyId: "cold-3",
    familyName: "3-Step Cold Outreach",
    familySize: 3,
    stepPosition: 2,
    previewText:
      "Subject: Following up\n\nHi {{first_name}},\n\nJust bumping this in case it got buried. Still open to a quick call?",
  }),
  seedTemplate({
    id: "breakup-3-v1",
    name: "Breakup v1",
    familyId: "cold-3",
    familyName: "3-Step Cold Outreach",
    familySize: 3,
    stepPosition: 3,
    previewText:
      "Subject: Should I close the loop?\n\nHi {{first_name}},\n\nI'll assume the timing isn't right — happy to reconnect later.",
  }),
  seedTemplate({
    id: "cold-open-5-v1",
    name: "Cold Open v1",
    familyId: "cold-5",
    familyName: "5-Step Cold Outreach",
    familySize: 5,
    stepPosition: 1,
    previewText:
      "Subject: Idea for {{company}}\n\nHi {{first_name}},\n\nWe help teams like {{company}} automate outbound follow-up.",
  }),
  seedTemplate({
    id: "value-prop-5-v1",
    name: "Value Prop v1",
    familyId: "cold-5",
    familyName: "5-Step Cold Outreach",
    familySize: 5,
    stepPosition: 2,
    previewText:
      "Subject: How {{company}} could save 10 hrs/week\n\nHi {{first_name}},\n\nTeams using our platform cut manual follow-up by 60%.",
  }),
  seedTemplate({
    id: "case-study-5-v1",
    name: "Case Study v1",
    familyId: "cold-5",
    familyName: "5-Step Cold Outreach",
    familySize: 5,
    stepPosition: 3,
    previewText:
      "Subject: How Acme scaled to 500 leads/mo\n\nHi {{first_name}},\n\nAcme went from 50 to 500 leads per month in 90 days.",
  }),
  seedTemplate({
    id: "follow-up-5-v1",
    name: "Follow-up v1",
    familyId: "cold-5",
    familyName: "5-Step Cold Outreach",
    familySize: 5,
    stepPosition: 4,
    previewText:
      "Subject: Still relevant?\n\nHi {{first_name}},\n\nWanted to check if this is still on your radar.",
  }),
  seedTemplate({
    id: "breakup-5-v1",
    name: "Breakup v1",
    familyId: "cold-5",
    familyName: "5-Step Cold Outreach",
    familySize: 5,
    stepPosition: 5,
    previewText:
      "Subject: Closing the loop\n\nHi {{first_name}},\n\nI'll step back for now — reach out anytime if priorities shift.",
  }),
];

export function getTemplateById(
  id: string | undefined,
  templates: EmailTemplate[] = EMAIL_TEMPLATES,
): EmailTemplate | undefined {
  if (!id) return undefined;
  return templates.find((template) => template.id === id);
}

export function filterTemplates(
  stepPosition: number | undefined,
  familySize: number | undefined,
  templates: EmailTemplate[] = EMAIL_TEMPLATES,
): EmailTemplate[] {
  if (stepPosition == null || familySize == null || familySize < 1) return [];
  return templates.filter(
    (template) =>
      template.stepPosition === stepPosition &&
      template.familySize === familySize,
  );
}

export function generateTemplateId(familyId: string, stepPosition: number): string {
  return `custom-${familyId}-step-${stepPosition}`;
}

export function generateFamilyId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
  return slug || `family-${Date.now()}`;
}
