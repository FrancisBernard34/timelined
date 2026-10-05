import { prisma } from "@/lib/db";
import type { CreatePeriodInput, TaskInput } from "@/lib/validation";

export type TaskDTO = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
};

export type PeriodDTO = {
  id: string;
  name: string;
  month: number;
  year: number;
  createdAt: string;
  schedule: TaskDTO[];
};

type PeriodWithTasks = {
  id: string;
  name: string;
  month: number;
  year: number;
  createdAt: Date;
  tasks: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    dayOfWeek: number;
  }[];
};

const include = { tasks: { orderBy: { startTime: "asc" as const } } };

function toDTO(period: PeriodWithTasks): PeriodDTO {
  return {
    id: period.id,
    name: period.name,
    month: period.month,
    year: period.year,
    createdAt: period.createdAt.toISOString(),
    schedule: period.tasks.map((task) => ({
      id: task.id,
      name: task.name,
      startTime: task.startTime,
      endTime: task.endTime,
      dayOfWeek: task.dayOfWeek,
    })),
  };
}

export async function listPeriods(): Promise<PeriodDTO[]> {
  const periods = await prisma.period.findMany({
    include,
    orderBy: [{ year: "asc" }, { month: "asc" }],
  });
  return periods.map(toDTO);
}

export async function createPeriod(input: CreatePeriodInput): Promise<PeriodDTO> {
  const period = await prisma.period.create({
    data: { name: input.name, month: input.month, year: input.year },
    include,
  });
  return toDTO(period);
}

export async function deletePeriod(id: string): Promise<boolean> {
  const result = await prisma.period.deleteMany({ where: { id } });
  return result.count > 0;
}

export async function replaceTasks(
  periodId: string,
  tasks: TaskInput[],
): Promise<PeriodDTO | null> {
  const exists = await prisma.period.findUnique({
    where: { id: periodId },
    select: { id: true },
  });
  if (!exists) return null;

  await prisma.$transaction(async (tx) => {
    await tx.task.deleteMany({ where: { periodId } });
    if (tasks.length > 0) {
      await tx.task.createMany({
        data: tasks.map((task) => ({
          periodId,
          name: task.name,
          dayOfWeek: task.dayOfWeek,
          startTime: task.startTime,
          endTime: task.endTime,
        })),
      });
    }
  });

  const period = await prisma.period.findUniqueOrThrow({
    where: { id: periodId },
    include,
  });
  return toDTO(period);
}
