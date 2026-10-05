import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import {
  createPeriod,
  deletePeriod,
  listPeriods,
  replaceTasks,
} from "@/lib/periods";

beforeEach(async () => {
  await prisma.period.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("periods data layer", () => {
  it("creates and lists periods ordered by date", async () => {
    await createPeriod({ name: "Jan", month: 0, year: 2026 });
    await createPeriod({ name: "Feb", month: 1, year: 2026 });

    const periods = await listPeriods();

    expect(periods.map((p) => p.name)).toEqual(["Jan", "Feb"]);
    expect(periods[0].schedule).toEqual([]);
  });

  it("replaces all tasks for a period", async () => {
    const period = await createPeriod({ name: "Mar", month: 2, year: 2026 });

    const updated = await replaceTasks(period.id, [
      { name: "Standup", dayOfWeek: 1, startTime: "09:00", endTime: "09:15" },
      { name: "Gym", dayOfWeek: 3, startTime: "18:00", endTime: "19:00" },
    ]);
    expect(updated?.schedule).toHaveLength(2);

    const replaced = await replaceTasks(period.id, [
      { name: "Focus", dayOfWeek: 2, startTime: "10:00", endTime: "12:00" },
    ]);
    expect(replaced?.schedule.map((t) => t.name)).toEqual(["Focus"]);
  });

  it("returns null when replacing tasks on a missing period", async () => {
    expect(await replaceTasks("missing-id", [])).toBeNull();
  });

  it("deletes a period and its tasks", async () => {
    const period = await createPeriod({ name: "Apr", month: 3, year: 2026 });
    await replaceTasks(period.id, [
      { name: "Task", dayOfWeek: 0, startTime: "08:00", endTime: "09:00" },
    ]);

    expect(await deletePeriod(period.id)).toBe(true);
    expect(await prisma.task.count({ where: { periodId: period.id } })).toBe(0);
    expect(await deletePeriod(period.id)).toBe(false);
  });
});
