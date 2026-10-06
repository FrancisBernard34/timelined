import { describe, expect, it } from "vitest";

import { normalizeTime } from "@/components/time-input";

describe("normalizeTime", () => {
  it("accepts and canonicalizes common 24-hour formats", () => {
    expect(normalizeTime("09:00")).toBe("09:00");
    expect(normalizeTime("9:00")).toBe("09:00");
    expect(normalizeTime("9:5")).toBe("09:05");
    expect(normalizeTime("0900")).toBe("09:00");
    expect(normalizeTime("930")).toBe("09:30");
    expect(normalizeTime("7h5")).toBe("07:05");
    expect(normalizeTime("23:59")).toBe("23:59");
    expect(normalizeTime("0:00")).toBe("00:00");
  });

  it("rejects out-of-range times", () => {
    expect(normalizeTime("24:00")).toBeNull();
    expect(normalizeTime("12:60")).toBeNull();
    expect(normalizeTime("99:99")).toBeNull();
  });

  it("rejects non-times", () => {
    expect(normalizeTime("")).toBeNull();
    expect(normalizeTime("   ")).toBeNull();
    expect(normalizeTime("abc")).toBeNull();
    expect(normalizeTime("12:")).toBeNull();
    expect(normalizeTime("1")).toBeNull();
  });
});
