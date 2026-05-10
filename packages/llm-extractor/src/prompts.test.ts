import { describe, expect, it } from "vitest";
import { buildExtractionPrompt } from "./prompts.js";

describe("buildExtractionPrompt", () => {
  it("includes the schema shape and JSON-only instruction", () => {
    const prompt = buildExtractionPrompt("input");

    expect(prompt).toContain('"nodes"');
    expect(prompt).toContain('"edges"');
    expect(prompt).toContain("Return valid JSON only");
  });

  it("includes node and edge types", () => {
    const prompt = buildExtractionPrompt("input");

    expect(prompt).toContain("idea | question | assumption | decision | risk | task | source | summary");
    expect(prompt).toContain("part_of | expands | supports | contradicts | depends_on | leads_to | answers");
  });
});
