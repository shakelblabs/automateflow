/**
 * MOCK — deterministic AI-Assist placeholder copy for Template Builder.
 * Replace with real LLM once a writing API exists.
 */

export type AiTone = "professional" | "casual" | "friendly";

const TONE_OPENERS: Record<AiTone, string> = {
  professional: "I hope this message finds you well.",
  casual: "Hope you're having a great week!",
  friendly: "Hope all is well on your end!",
};

const TONE_CLOSERS: Record<AiTone, string> = {
  professional: "Would you be open to a brief conversation?",
  casual: "Worth a quick chat?",
  friendly: "I'd love to hear your thoughts when you have a moment.",
};

function truncateSubject(prompt: string): string {
  const words = prompt.trim().split(/\s+/).slice(0, 8);
  if (words.length === 0) return "Quick idea for your team";
  const line = words.join(" ");
  return line.charAt(0).toUpperCase() + line.slice(1);
}

export function generateTemplateCopy(
  prompt: string,
  tone: AiTone = "professional",
): { subject: string; body: string } {
  const trimmed = prompt.trim();
  const subject = trimmed
    ? truncateSubject(trimmed)
    : "Introduction from AutomateFlow";
  const opener = TONE_OPENERS[tone];
  const closer = TONE_CLOSERS[tone];
  const intent = trimmed || "exploring how we might help your team";

  const body = [
    "Hi {first_name},",
    "",
    opener,
    "",
    `I'm reaching out because ${intent}.`,
    "",
    closer,
  ].join("\n");

  return { subject, body };
}
