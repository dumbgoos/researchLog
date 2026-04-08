import { describe, expect, test } from "bun:test";
import { formatMetadataLines, parseMetadataLines } from "./form-utils";

describe("form metadata helpers", () => {
  test("parses key-value metadata lines", () => {
    expect(parseMetadataLines("host=gpu-01\nqueue=research\n\ninvalid\n empty = ")).toEqual({
      host: "gpu-01",
      queue: "research"
    });
  });

  test("formats metadata records back into lines", () => {
    expect(formatMetadataLines({ host: "gpu-01", queue: "research" })).toBe("host=gpu-01\nqueue=research");
  });
});
