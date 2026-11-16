import { describe, expect, test } from "bun:test";
import { postedEs } from "../src/lib/posted";

const NOW = new Date("2026-11-15T12:00:00Z");

describe("postedEs", () => {
  test.each([
    ["2026-11-15", "hoy"],
    ["2026-11-14", "hace 1 día"],
    ["2026-11-13", "hace 2 días"],
    ["2026-11-01", "hace 2 semanas"],
    ["2026-09-16", "hace 2 meses"],
    ["2026-08-14", "hace 3 meses"],
    ["2025-06-14", "hace 1 año"],
    ["2023-02-21", "hace 3 años"],
  ])("ISO %s -> %s", (iso, label) => {
    expect(postedEs(iso, NOW)).toBe(label);
  });

  test.each([
    ["1d ago", "hace 1 día"],
    ["3w ago", "hace 3 semanas"],
    ["1mo ago", "hace 1 mes"],
    ["6mo ago", "hace 6 meses"],
    ["1y+ ago", "hace más de 1 año"],
  ])("curated %s -> %s", (raw, label) => {
    expect(postedEs(raw, NOW)).toBe(label);
  });

  test("no usable date gives null so the card omits the line", () => {
    expect(postedEs("sin fecha", NOW)).toBeNull();
    expect(postedEs("", NOW)).toBeNull();
  });

  test("a future date reads as today, never negative", () => {
    expect(postedEs("2026-12-01", NOW)).toBe("hoy");
  });
});
