import { describe, expect, test } from "bun:test";
import { neighbor, stepOffset, TOTAL_STEPS, WALKTHROUGH } from "../src/lib/tour-steps";

const paths = WALKTHROUGH.map((p) => p.path);

describe("walkthrough chaining", () => {
  test("next and previous follow the page order and stop at the ends", () => {
    for (let i = 0; i < paths.length; i++) {
      expect(neighbor(paths[i], 1)).toBe(paths[i + 1] ?? null);
      expect(neighbor(paths[i], -1)).toBe(paths[i - 1] ?? null);
    }
  });

  test("a skipped page is jumped over in both directions", () => {
    const [a, b, c] = paths;
    const skipB = (p: string) => p === b;
    expect(neighbor(a, 1, skipB)).toBe(c);
    expect(neighbor(c, -1, skipB)).toBe(a);
  });

  test("the last page has no next once the install page is skipped (installed app)", () => {
    const last = paths.at(-1) as string;
    expect(neighbor(paths.at(-2) as string, 1, (p) => p === last)).toBeNull();
  });

  test("an unknown page has no neighbors", () => {
    expect(neighbor("/nope", 1)).toBeNull();
    expect(neighbor("/nope", -1)).toBeNull();
  });
});

describe("progress across pages", () => {
  test("each page's offset counts every step on the pages before it", () => {
    let seen = 0;
    for (const page of WALKTHROUGH) {
      expect(stepOffset(page.path)).toBe(seen);
      seen += page.steps.length;
    }
    expect(TOTAL_STEPS).toBe(seen);
  });

  test("every page has at least one step and every step has copy", () => {
    for (const page of WALKTHROUGH) {
      expect(page.steps.length).toBeGreaterThan(0);
      for (const s of page.steps) {
        expect(s.element.trim()).not.toBe("");
        expect(s.title.trim()).not.toBe("");
        expect(s.text.trim()).not.toBe("");
      }
    }
  });
});
