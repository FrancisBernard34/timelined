import { describe, expect, it } from "vitest";

import {
  createPeriodSchema,
  taskSchema,
  updateScheduleSchema,
} from "@/lib/validation";

describe("createPeriodSchema", () => {
  it("accepts a valid period", () => {
    const result = createPeriodSchema.safeParse({
      name: "Summer",
      month: 5,
      year: 2026,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a blank name", () => {
    const result = createPeriodSchema.safeParse({
      name: "   ",
      month: 5,
      year: 2026,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an out-of-range month", () => {
    expect(
      createPeriodSchema.safeParse({ name: "x", month: 12, year: 2026 }).success,
    ).toBe(false);
  });

  it("rejects a non-integer year", () => {
    expect(
      createPeriodSchema.safeParse({ name: "x", month: 0, year: 2026.5 })
        .success,
    ).toBe(false);
  });
});

describe("taskSchema", () => {
  it("accepts a valid task", () => {
    const result = taskSchema.safeParse({
      name: "Gym",
      dayOfWeek: 1,
      startTime: "07:00",
      endTime: "08:00",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid time formats", () => {
    expect(
      taskSchema.safeParse({
        name: "Gym",
        dayOfWeek: 1,
        startTime: "25:00",
        endTime: "08:00",
      }).success,
    ).toBe(false);
    expect(
      taskSchema.safeParse({
        name: "Gym",
        dayOfWeek: 1,
        startTime: "7:00",
        endTime: "08:00",
      }).success,
    ).toBe(false);
  });

  it("rejects dayOfWeek out of range", () => {
    expect(
      taskSchema.safeParse({
        name: "Gym",
        dayOfWeek: 7,
        startTime: "07:00",
        endTime: "08:00",
      }).success,
    ).toBe(false);
  });
});

describe("updateScheduleSchema", () => {
  it("accepts an empty task list", () => {
    expect(updateScheduleSchema.safeParse({ tasks: [] }).success).toBe(true);
  });

  it("accepts a list of tasks", () => {
    const result = updateScheduleSchema.safeParse({
      tasks: [{ name: "A", dayOfWeek: 0, startTime: "00:00", endTime: "01:00" }],
    });
    expect(result.success).toBe(true);
  });
});
