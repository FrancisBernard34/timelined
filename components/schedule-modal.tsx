"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Trash2, Clock } from "lucide-react";
import type { TimelinePeriod, ScheduleTask } from "@/app/page";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  period: TimelinePeriod;
  onUpdateSchedule: (periodId: string, schedule: ScheduleTask[]) => void;
  onDeletePeriod: (periodId: string) => void;
}

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function ScheduleModal({
  isOpen,
  onClose,
  period,
  onUpdateSchedule,
  onDeletePeriod,
}: ScheduleModalProps) {
  const [tasks, setTasks] = useState<ScheduleTask[]>(period.schedule || []);
  const [currentDayTasks, setCurrentDayTasks] = useState<ScheduleTask[]>([]);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState(
    new Date().getDay()
  );
  const [newTask, setNewTask] = useState({
    name: "",
    startTime: "",
    endTime: "",
    dayOfWeek: selectedDayOfWeek,
  });
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const handleAddTask = () => {
    if (!newTask.name.trim() || !newTask.startTime || !newTask.endTime) return;

    const task: ScheduleTask = {
      id: crypto.randomUUID(),
      name: newTask.name.trim(),
      startTime: newTask.startTime,
      endTime: newTask.endTime,
      dayOfWeek: newTask.dayOfWeek,
    };

    const updatedTasks = [...tasks, task];
    setTasks(updatedTasks);
    onUpdateSchedule(period.id, updatedTasks);

    setNewTask({
      name: "",
      startTime: "",
      endTime: "",
      dayOfWeek: selectedDayOfWeek,
    });
    setIsAddingTask(false);
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter((task) => task.id !== taskId);
    setTasks(updatedTasks);
    onUpdateSchedule(period.id, updatedTasks);
  };

  const handleDeletePeriod = () => {
    onDeletePeriod(period.id);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = Number.parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Group tasks by day of week
  const tasksByDay = tasks.reduce((acc, task) => {
    if (!acc[task.dayOfWeek]) acc[task.dayOfWeek] = [];
    acc[task.dayOfWeek].push(task);
    return acc;
  }, {} as Record<number, ScheduleTask[]>);

  // Sort tasks by start time within each day
  Object.keys(tasksByDay).forEach((day) => {
    tasksByDay[Number.parseInt(day)].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );
  });

  useEffect(() => {
    setCurrentDayTasks(tasksByDay[selectedDayOfWeek] || []);
  }, [selectedDayOfWeek, tasks]);

  useEffect(() => {
    setNewTask((prev) => ({ ...prev, dayOfWeek: selectedDayOfWeek }));
  }, [selectedDayOfWeek]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between mt-4">
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">
                {period.name} Schedule
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Created in{" "}
                {new Date(period.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirmation(true)}
              className="ml-4 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Period
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Select Day of the Week */}
          <div className="w-48">
            <Select
              value={String(selectedDayOfWeek)}
              onValueChange={(value) => {
                const day = Number.parseInt(value);
                setSelectedDayOfWeek(day);
              }}
            >
              <SelectTrigger className="w-full border-orange-500">
                <SelectValue placeholder="Select Day of the Week" />
              </SelectTrigger>
              <SelectContent>
                {daysOfWeek.map((dayName, index) => (
                  <SelectItem key={index} value={String(index)}>
                    {dayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Schedule Display */}
          {currentDayTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No tasks scheduled yet</p>
              <p className="text-sm">Add your first task to get started</p>
            </div>
          ) : (
            <TooltipProvider>
              <div className="space-y-1 bg-card p-2 border border-border rounded-lg">
                {currentDayTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-2 bg-transparent"
                  >
                    <div className="w-[15%] h-[2rem]  border border-orange-500 rounded-lg p-2 select-none">
                      <p className="text-sm text-muted-foreground leading-none">
                        {task.startTime}
                      </p>
                    </div>
                    <div className="w-[15%] h-[2rem] border border-orange-500 rounded-lg p-2 select-none">
                      <p className="text-sm text-muted-foreground leading-none">
                        {task.endTime}
                      </p>
                    </div>
                    <div className="w-[60%] max-w-[260px] h-[2rem] border border-orange-500 rounded-lg p-2 flex items-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="font-medium text-foreground leading-none truncate cursor-default">
                            {task.name}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs break-words">{task.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Button
                      variant="default"
                      size="sm"
                      className="w-[10%] h-[2rem] cursor-pointer bg-red-500"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </TooltipProvider>
          )}
          {/* Add Task Section */}
          <div className="border border-border rounded-lg p-4 bg-card">
            {!isAddingTask ? (
              <Button
                onClick={() => setIsAddingTask(true)}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Task
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-row gap-2">
                    <Input
                      type="time"
                      className=" border-orange-500 text-center"
                      placeholder="Start time"
                      value={newTask.startTime}
                      onChange={(e) =>
                        setNewTask((prev) => ({
                          ...prev,
                          startTime: e.target.value,
                        }))
                      }
                    />

                    <Input
                      type="time"
                      className=" border-orange-500 text-center"
                      placeholder="End time"
                      value={newTask.endTime}
                      onChange={(e) =>
                        setNewTask((prev) => ({
                          ...prev,
                          endTime: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <Input
                    placeholder="Task name"
                    className="border-orange-500"
                    value={newTask.name}
                    onChange={(e) =>
                      setNewTask((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleAddTask}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
                  >
                    Add Task
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddingTask(false);
                      setNewTask({
                        name: "",
                        startTime: "",
                        endTime: "",
                        dayOfWeek: 1,
                      });
                    }}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirmation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Delete Period
              </h3>
              <p className="text-muted-foreground mb-4">
                Are you sure you want to delete "{period.name}"? This action
                cannot be undone and will remove all tasks in this period.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirmation(false)}
                >
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeletePeriod}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
