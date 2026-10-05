export interface ScheduleTask {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
}

export interface TimelinePeriod {
  id: string;
  name: string;
  month: number;
  year: number;
  createdAt: string;
  schedule: ScheduleTask[];
}
