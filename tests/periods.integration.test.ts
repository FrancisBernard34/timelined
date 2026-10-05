import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import {
  createPeriod,
  deletePeriod,
  listPeriods,
  replaceTasks,
} from "@/lib/periods";

let userId: string;
let otherUserId: string;

beforeEach(async () => {
  await prisma.period.deleteMany();
  await prisma.user.deleteMany();

  const owner = await prisma.user.create({
    data: { email: "owner@test.dev", password: "x" },
  });
  const other = await prisma.user.create({
    data: { email: "other@test.dev", password: "x" },
  });
  userId = owner.id;
  otherUserId = other.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("periods data layer", () => {
  it("creates and lists periods ordered by date", async () => {
    await createPeriod(userId, { name: "Jan", month: 0, year: 2026 });
    await createPeriod(userId, { name: "Feb", month: 1, year: 2026 });

    const periods = await listPeriods(userId);

    expect(periods.map((p) => p.name)).toEqual(["Jan", "Feb"]);
    expect(periods[0].schedule).toEqual([]);
  });

  it("replaces all tasks for a period", async () => {
    const period = await createPeriod(userId, { name: "Mar", month: 2, year: 2026 });

    const updated = await replaceTasks(userId, period.id, [
      { name: "Standup", dayOfWeek: 1, startTime: "09:00", endTime: "09:15" },
      { name: "Gym", dayOfWeek: 3, startTime: "18:00", endTime: "19:00" },
    ]);
    expect(updated?.schedule).toHaveLength(2);

    const replaced = await replaceTasks(userId, period.id, [
      { name: "Focus", dayOfWeek: 2, startTime: "10:00", endTime: "12:00" },
    ]);
    expect(replaced?.schedule.map((t) => t.name)).toEqual(["Focus"]);
  });

  it("returns null when replacing tasks on a missing period", async () => {
    expect(await replaceTasks(userId, "missing-id", [])).toBeNull();
  });

  it("deletes a period and its tasks", async () => {
    const period = await createPeriod(userId, { name: "Apr", month: 3, year: 2026 });
    await replaceTasks(userId, period.id, [
      { name: "Task", dayOfWeek: 0, startTime: "08:00", endTime: "09:00" },
    ]);

    expect(await deletePeriod(userId, period.id)).toBe(true);
    expect(await prisma.task.count({ where: { periodId: period.id } })).toBe(0);
    expect(await deletePeriod(userId, period.id)).toBe(false);
  });

  it("isolates periods per user, allowing the same month", async () => {
    await createPeriod(userId, { name: "Mine", month: 4, year: 2026 });
    await createPeriod(otherUserId, { name: "Theirs", month: 4, year: 2026 });

    expect((await listPeriods(userId)).map((p) => p.name)).toEqual(["Mine"]);
    expect((await listPeriods(otherUserId)).map((p) => p.name)).toEqual(["Theirs"]);
  });

  it("does not let a user delete or modify another user's period", async () => {
    const period = await createPeriod(otherUserId, {
      name: "Theirs",
      month: 5,
      year: 2026,
    });

    expect(await deletePeriod(userId, period.id)).toBe(false);
    expect(await replaceTasks(userId, period.id, [])).toBeNull();
    expect(await listPeriods(otherUserId)).toHaveLength(1);
  });
});
