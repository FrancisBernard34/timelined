import { z } from "zod";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const createPeriodSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60, "Name is too long"),
  month: z.number().int().min(0).max(11),
  year: z.number().int().min(2000).max(2100),
});

export const taskSchema = z.object({
  name: z.string().trim().min(1, "Task name is required").max(80),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(timePattern, "startTime must be HH:mm"),
  endTime: z.string().regex(timePattern, "endTime must be HH:mm"),
});

export const updateScheduleSchema = z.object({
  tasks: z.array(taskSchema).max(200),
});

export type CreatePeriodInput = z.infer<typeof createPeriodSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
