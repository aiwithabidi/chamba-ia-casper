// Deterministic quality gates: no AI call and no payout for junk answers.
import { overall, type RubricItem } from "./rubric";

/** Fewest words an interview answer may have. */
export const MIN_WORDS = 8;
/** Lowest overall score that earns the interview reward. */
export const PAYOUT_MIN_SCORE = 40;

const NUMBER_WORDS: Record<string, number> = {
  una: 1,
  un: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
};
const SENTENCE_RULE = /(\p{L}*)\s+(\d+|una?|dos|tres|cuatro|cinco)\s+(?:frases|oraciones)/iu;
const UPPER_LIMIT = /^(máximo|maximo|hasta|menos)$/i;

const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
const sentenceCount = (text: string) =>
  text.split(/[.!?…]+/).filter((s) => /\p{L}/u.test(s)).length;

/** Sentences the question asks for ("en exactamente 2 frases"), or null when it states none. */
function requiredSentences(question: string): number | null {
  const m = question.match(SENTENCE_RULE);
  if (!m || UPPER_LIMIT.test(m[1])) return null;
  const raw = m[2].toLowerCase();
  return NUMBER_WORDS[raw] ?? Number(raw);
}

/** Null when the answer is substantial enough to grade; otherwise the inline message to show. */
export function answerGate(answer: string, question: string): string | null {
  const sentences = requiredSentences(question);
  const tooFewWords = wordCount(answer) < MIN_WORDS;
  const tooFewSentences = sentences !== null && sentenceCount(answer) < sentences;
  return tooFewWords || tooFewSentences
    ? `Respuesta muy corta: escribe al menos ${sentences ?? 2} frases`
    : null;
}

/** The reward is paid only when both the overall score and the written answers alone reach PAYOUT_MIN_SCORE,
 * so a perfect multiple-choice result (45% of the weight) cannot buy the bonus with filler text. */
export function earnsPayout(rubric: RubricItem[]): boolean {
  const written = rubric.filter((r) => r.key !== "conocimiento");
  return (
    written.length > 0 &&
    overall(rubric) >= PAYOUT_MIN_SCORE &&
    overall(written) >= PAYOUT_MIN_SCORE
  );
}
