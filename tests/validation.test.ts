import { describe, expect, it } from "vitest";

import {
  credentialsSchema,
  createPeriodSchema,
  signupSchema,
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

describe("credentialsSchema", () => {
  it("normalizes the email to lowercase", () => {
    const result = credentialsSchema.safeParse({
      email: "  User@Example.COM ",
      password: "password123",
    });
    expect(result.success).toBe(true);
    expect(result.success && result.data.email).toBe("user@example.com");
  });

  it("rejects a short password", () => {
    expect(
      credentialsSchema.safeParse({ email: "a@b.co", password: "short" }).success,
    ).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(
      credentialsSchema.safeParse({ email: "nope", password: "password123" })
        .success,
    ).toBe(false);
  });
});

describe("signupSchema", () => {
  it("accepts an optional name", () => {
    expect(
      signupSchema.safeParse({
        email: "a@b.co",
        password: "password123",
        name: "Francis",
      }).success,
    ).toBe(true);
    expect(
      signupSchema.safeParse({ email: "a@b.co", password: "password123" }).success,
    ).toBe(true);
  });
});
