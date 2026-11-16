import { describe, expect, test } from "bun:test";
import { answerGate, earnsPayout, MIN_WORDS, PAYOUT_MIN_SCORE } from "../convex/lib/effort";

const words = (n: number) => Array.from({ length: n }, (_, i) => `palabra${i}`).join(" ") + ".";

describe("answerGate", () => {
  test("one-word answers are blocked with an inline Spanish message", () => {
    expect(answerGate("Ai", "¿Qué experiencia tienes?")).toBe(
      "Respuesta muy corta: escribe al menos 2 frases",
    );
    expect(answerGate("Si", "¿Qué experiencia tienes?")).not.toBeNull();
  });

  test("the word minimum is inclusive", () => {
    expect(answerGate(words(MIN_WORDS), "¿Qué experiencia tienes?")).toBeNull();
    expect(answerGate(words(MIN_WORDS - 1), "¿Qué experiencia tienes?")).not.toBeNull();
  });

  test("a short phrase is still blocked; eight words pass", () => {
    expect(
      answerGate("Sí, tengo experiencia grabando.", "¿Qué experiencia tienes?"),
    ).not.toBeNull();
    expect(
      answerGate("Grabo locuciones desde casa con un micrófono USB.", "¿Qué experiencia tienes?"),
    ).toBeNull();
  });

  test("a stated sentence count must be met", () => {
    const q = "En exactamente 3 frases: ¿qué herramientas usas?";
    expect(answerGate("Uso Express Scribe para transcribir todos los días con pedal.", q)).toBe(
      "Respuesta muy corta: escribe al menos 3 frases",
    );
    expect(
      answerGate("Uso Express Scribe. También uso un pedal. Reviso todo dos veces.", q),
    ).toBeNull();
  });

  test("sentence counts written as words are understood", () => {
    const q = "En dos frases, explica tu experiencia.";
    expect(
      answerGate("Trabajé tres años transcribiendo entrevistas para un periódico local.", q),
    ).not.toBeNull();
    expect(
      answerGate("Trabajé tres años transcribiendo entrevistas. Ahora transcribo pódcast.", q),
    ).toBeNull();
  });
});

describe("answerGate limits", () => {
  test("an upper limit (máximo / hasta) is not a minimum", () => {
    const one = "Grabo locuciones desde casa con un micrófono USB.";
    expect(answerGate(one, "Responde en máximo 2 frases: ¿cómo grabas?")).toBeNull();
    expect(answerGate(one, "En hasta 3 frases, ¿cómo grabas?")).toBeNull();
  });
});

describe("earnsPayout", () => {
  const item = (key: string, score: number) => ({ key, score, evidence: "" });
  const written = (score: number) => [item("instrucciones", score), item("espanol", score)];

  test("pays at or above the minimum score, not below", () => {
    expect(earnsPayout(written(PAYOUT_MIN_SCORE))).toBe(true);
    expect(earnsPayout(written(PAYOUT_MIN_SCORE - 1))).toBe(false);
    expect(earnsPayout(written(16))).toBe(false);
  });

  test("the bar is 40", () => {
    expect(earnsPayout(written(39))).toBe(false);
    expect(earnsPayout(written(40))).toBe(true);
  });

  test("a perfect multiple-choice result cannot carry filler written answers", () => {
    // Overall is 45 here (above the bar), but the written answers alone score 0.
    expect(earnsPayout([...written(0), item("conocimiento", 100)])).toBe(false);
    expect(earnsPayout([...written(30), item("conocimiento", 100)])).toBe(false);
    expect(earnsPayout([...written(50), item("conocimiento", 100)])).toBe(true);
  });

  test("weak knowledge still drags the overall below the bar", () => {
    expect(earnsPayout([...written(45), item("conocimiento", 0)])).toBe(false);
  });

  test("no written answers never pays", () => {
    expect(earnsPayout([item("conocimiento", 100)])).toBe(false);
    expect(earnsPayout([])).toBe(false);
  });
});
