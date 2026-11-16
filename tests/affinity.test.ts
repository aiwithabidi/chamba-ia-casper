import { describe, expect, test } from "bun:test";
import { affinity, demotion, HIDE_AFTER_NET_PASSES } from "../convex/lib/affinity";

const sw = (category: string, liked: boolean) => ({ category, liked });

describe("affinity", () => {
  test("no swipes: every category is normal with no boost", () => {
    const a = affinity([]);
    expect(a.tecnico).toEqual({ likes: 0, passes: 0, boost: 0, status: "normal" });
  });

  test("repeated passes on a category hide it", () => {
    const a = affinity(Array.from({ length: HIDE_AFTER_NET_PASSES }, () => sw("tecnico", false)));
    expect(a.tecnico.status).toBe("oculto");
    expect(a.voz.status).toBe("normal");
  });

  test("one pass shows the category less, not hidden", () => {
    const a = affinity([sw("tecnico", false)]);
    expect(a.tecnico.status).toBe("menos");
    expect(a.tecnico.boost).toBeLessThan(0);
  });

  test("likes push a category up", () => {
    const a = affinity([sw("voz", true), sw("voz", true)]);
    expect(a.voz.status).toBe("mas");
    expect(a.voz.boost).toBeGreaterThan(0);
  });

  test("likes offset passes, so a liked category is not hidden", () => {
    const a = affinity([
      sw("tecnico", false),
      sw("tecnico", false),
      sw("tecnico", false),
      sw("tecnico", true),
    ]);
    expect(a.tecnico.status).not.toBe("oculto");
  });
});

describe("demotion", () => {
  const passes = (n: number) => Array.from({ length: n }, () => sw("tecnico", false));

  test("first load is not a demotion", () => {
    expect(demotion(undefined, affinity(passes(1)))).toBeNull();
  });

  test("a pass that drops a category to menos reports it", () => {
    expect(demotion(affinity([]), affinity(passes(1)))).toEqual({
      category: "tecnico",
      status: "menos",
    });
  });

  test("the pass that hides a category reports oculto", () => {
    expect(
      demotion(
        affinity(passes(HIDE_AFTER_NET_PASSES - 1)),
        affinity(passes(HIDE_AFTER_NET_PASSES)),
      ),
    ).toEqual({ category: "tecnico", status: "oculto" });
  });

  test("staying at menos is not reported again", () => {
    expect(demotion(affinity(passes(1)), affinity(passes(2)))).toBeNull();
  });

  test("an undo that lifts oculto back to menos is not a demotion", () => {
    expect(
      demotion(
        affinity(passes(HIDE_AFTER_NET_PASSES)),
        affinity(passes(HIDE_AFTER_NET_PASSES - 1)),
      ),
    ).toBeNull();
  });

  test("mas falling to normal is not reported", () => {
    const before = [
      ...Array.from({ length: 4 }, () => sw("voz", true)),
      sw("voz", false),
      sw("voz", false),
    ];
    const after = [...before, sw("voz", false)];
    expect(affinity(before).voz.status).toBe("mas");
    expect(affinity(after).voz.status).toBe("normal");
    expect(demotion(affinity(before), affinity(after))).toBeNull();
  });
});
