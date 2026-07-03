/**
 * MOCK — deterministic spam-score check for Template Builder (v1 §5.1).
 * Replace with real deliverability API once available.
 */

export type SpamRisk = "Low" | "Medium" | "High";

export interface SpamFlag {
  phrase: string;
  suggestion: string;
  start: number;
  end: number;
}

export interface SpamScoreResult {
  score: number;
  risk: SpamRisk;
  flags: SpamFlag[];
}

const TRIGGER_PHRASES: Array<{ phrase: string; suggestion: string }> = [
  { phrase: "free", suggestion: "Consider removing urgency around 'free' offers." },
  { phrase: "buy now", suggestion: "Consider a softer alternative to 'Buy now'." },
  { phrase: "act now", suggestion: "Consider a softer alternative to 'Act now'." },
  { phrase: "guarantee", suggestion: "Soften absolute claims like 'guarantee'." },
  { phrase: "risk-free", suggestion: "Replace 'risk-free' with a specific benefit." },
  { phrase: "click here", suggestion: "Use descriptive link text instead of 'click here'." },
];

function riskFromScore(score: number): SpamRisk {
  if (score >= 60) return "High";
  if (score >= 30) return "Medium";
  return "Low";
}

function findPhraseFlags(text: string, offset: number): SpamFlag[] {
  const flags: SpamFlag[] = [];
  const lower = text.toLowerCase();

  for (const { phrase, suggestion } of TRIGGER_PHRASES) {
    let searchFrom = 0;
    while (searchFrom < lower.length) {
      const index = lower.indexOf(phrase, searchFrom);
      if (index === -1) break;
      flags.push({
        phrase,
        suggestion,
        start: offset + index,
        end: offset + index + phrase.length,
      });
      searchFrom = index + phrase.length;
    }
  }

  return flags;
}

export function checkSpamScore(subject: string, body: string): SpamScoreResult {
  const combined = `${subject}\n\n${body}`;
  const flags: SpamFlag[] = [
    ...findPhraseFlags(subject, 0),
    ...findPhraseFlags(body, subject.length + 2),
  ];

  let score = flags.length * 12;

  const exclamationCount = (combined.match(/!/g) ?? []).length;
  if (exclamationCount > 2) {
    score += (exclamationCount - 2) * 8;
    flags.push({
      phrase: "!!!",
      suggestion: "Reduce exclamation marks — more than two can trigger filters.",
      start: combined.indexOf("!"),
      end: combined.indexOf("!") + 1,
    });
  }

  const capsRuns = combined.match(/\b[A-Z]{4,}\b/g) ?? [];
  score += capsRuns.length * 10;
  for (const run of capsRuns) {
    const start = combined.indexOf(run);
    flags.push({
      phrase: run,
      suggestion: "Avoid ALL-CAPS words — they read as shouting.",
      start,
      end: start + run.length,
    });
  }

  score = Math.min(100, score);
  return { score, risk: riskFromScore(score), flags };
}

export function highlightSpamText(
  text: string,
  flags: SpamFlag[],
  fieldOffset: number,
): Array<{ text: string; flagged: boolean }> {
  const fieldFlags = flags
    .filter((flag) => flag.start >= fieldOffset && flag.end <= fieldOffset + text.length)
    .map((flag) => ({
      start: flag.start - fieldOffset,
      end: flag.end - fieldOffset,
    }))
    .sort((a, b) => a.start - b.start);

  if (fieldFlags.length === 0) return [{ text, flagged: false }];

  const segments: Array<{ text: string; flagged: boolean }> = [];
  let cursor = 0;

  for (const flag of fieldFlags) {
    if (flag.start > cursor) {
      segments.push({ text: text.slice(cursor, flag.start), flagged: false });
    }
    segments.push({
      text: text.slice(flag.start, flag.end),
      flagged: true,
    });
    cursor = flag.end;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), flagged: false });
  }

  return segments;
}
