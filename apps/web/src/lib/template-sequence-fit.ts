/**
 * MOCK — deterministic tone & sequence-fit guidance for Template Builder (v1 §5.2).
 * Replace with real evaluation once a writing API exists.
 */

import type { AiTone } from "@/lib/template-ai-generate";

export interface SequenceFitResult {
  toneMessages: string[];
  stepGuidance: string;
  repetitionMessages: string[];
}

const CASUAL_PHRASES = ["hey", "awesome", "cool", "btw", "gonna", "yeah"];

const STEP_GUIDANCE: Record<number, string> = {
  1: "This should introduce yourself and the offer clearly.",
  2: "Reference the previous email briefly, don't repeat the pitch — add new value.",
};

function defaultStepGuidance(stepPosition: number): string {
  if (stepPosition <= 2) {
    return STEP_GUIDANCE[stepPosition] ?? STEP_GUIDANCE[2];
  }
  return "Consider social proof or a new angle, not just 'following up.'";
}

function averageSentenceLength(text: string): number {
  const sentences = text
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (sentences.length === 0) return 0;
  const totalWords = sentences.reduce(
    (sum, sentence) => sum + sentence.split(/\s+/).length,
    0,
  );
  return totalWords / sentences.length;
}

function checkTone(
  subject: string,
  body: string,
  tone: AiTone,
): string[] {
  const combined = `${subject} ${body}`.toLowerCase();
  const messages: string[] = [];
  const exclamations = (combined.match(/!/g) ?? []).length;
  const avgLength = averageSentenceLength(`${subject}. ${body}`);
  const casualHits = CASUAL_PHRASES.filter((phrase) =>
    combined.includes(phrase),
  );

  if (tone === "professional") {
    if (exclamations >= 2) {
      messages.push(
        "This reads more enthusiastic than your selected 'Professional' tone — consider fewer exclamation marks.",
      );
    }
    if (avgLength < 6) {
      messages.push(
        "Very short sentences can read more casual than your selected 'Professional' tone.",
      );
    }
    if (casualHits.length > 0) {
      messages.push(
        `This reads more casual than your selected 'Professional' tone (found: ${casualHits.join(", ")}).`,
      );
    }
  }

  if (tone === "casual" && exclamations === 0 && avgLength > 18) {
    messages.push(
      "This reads more formal than your selected 'Casual' tone — try shorter sentences or a friendly opener.",
    );
  }

  if (tone === "friendly" && exclamations === 0 && casualHits.length === 0) {
    messages.push(
      "This reads more reserved than your selected 'Friendly' tone — a warmer opener may help.",
    );
  }

  return messages;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function findRepeatedPhrases(current: string, prior: string): string[] {
  const currentTokens = tokenize(current);
  const priorTokens = tokenize(prior);
  const repeated: string[] = [];

  for (let size = 5; size >= 3; size -= 1) {
    for (let i = 0; i <= currentTokens.length - size; i += 1) {
      const phrase = currentTokens.slice(i, i + size).join(" ");
      const priorPhrase = priorTokens.slice(i, i + size).join(" ");
      if (phrase.length >= 12 && priorTokens.join(" ").includes(phrase)) {
        if (!repeated.includes(phrase)) repeated.push(phrase);
      }
      if (priorPhrase && priorTokens.join(" ").includes(phrase)) {
        if (!repeated.includes(phrase)) repeated.push(phrase);
      }
    }
  }

  // Naive sliding window on prior text
  const priorText = priorTokens.join(" ");
  for (let size = 5; size >= 3; size -= 1) {
    for (let i = 0; i <= currentTokens.length - size; i += 1) {
      const phrase = currentTokens.slice(i, i + size).join(" ");
      if (phrase.length >= 12 && priorText.includes(phrase) && !repeated.includes(phrase)) {
        repeated.push(phrase);
      }
    }
  }

  return repeated.slice(0, 3);
}

export function checkSequenceFit(input: {
  subject: string;
  body: string;
  tone: AiTone;
  stepPosition: number;
  priorStep?: { subject: string; body: string };
}): SequenceFitResult {
  const toneMessages = checkTone(input.subject, input.body, input.tone);
  const stepGuidance = defaultStepGuidance(input.stepPosition);

  const repetitionMessages: string[] = [];
  if (input.priorStep && input.stepPosition > 1) {
    const priorCombined = `${input.priorStep.subject} ${input.priorStep.body}`;
    const currentCombined = `${input.subject} ${input.body}`;
    const phrases = findRepeatedPhrases(currentCombined, priorCombined);
    for (const phrase of phrases) {
      repetitionMessages.push(
        `Likely duplication with the previous step: "${phrase}"`,
      );
    }
  }

  return { toneMessages, stepGuidance, repetitionMessages };
}
