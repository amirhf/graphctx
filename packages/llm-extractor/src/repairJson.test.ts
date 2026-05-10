import { describe, expect, it } from "vitest";
import { parseJsonObject } from "./repairJson.js";

describe("parseJsonObject", () => {
  it("parses plain JSON", () => {
    expect(parseJsonObject('{"ok":true}')).toEqual({ ok: true });
  });

  it("parses fenced JSON", () => {
    expect(parseJsonObject('```json\n{"ok":true}\n```')).toEqual({ ok: true });
  });

  it("parses a JSON object embedded in text", () => {
    expect(parseJsonObject('Here is JSON: {"ok":true,"nested":{"value":1}} done.')).toEqual({
      ok: true,
      nested: { value: 1 },
    });
  });
});
