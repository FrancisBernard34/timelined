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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Trash2, Clock, Pencil, Check, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { TimelinePeriod, ScheduleTask } from "@/lib/types";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  period: TimelinePeriod;
  onUpdateSchedule: (periodId: string, schedule: ScheduleTask[]) => void;
  onDeletePeriod: (periodId: string) => void;
}

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export function ScheduleModal({
  isOpen,
  onClose,
  period,
  onUpdateSchedule,
  onDeletePeriod,
}: ScheduleModalProps) {
  const t = useTranslations("Schedule");
  const tDays = useTranslations("Days");
  const locale = useLocale();
  const daysOfWeek = DAY_KEYS.map((day) => tDays(`long.${day}`));
  const daysShort = DAY_KEYS.map((day) => tDays(`short.${day}`));
  // Force a 24-hour clock in the native time inputs (Chromium honors the element's lang).
  const timeLang = locale === "en" ? "en-GB" : locale;

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
  const [isCloning, setIsCloning] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({
    name: "",
    startTime: "",
    endTime: "",
  });
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);

  const startEdit = (task: ScheduleTask) => {
    setEditingTaskId(task.id);
    setEditDraft({
      name: task.name,
      startTime: task.startTime,
      endTime: task.endTime,
    });
  };

  const saveEdit = () => {
    if (
      !editingTaskId ||
      !editDraft.name.trim() ||
      !editDraft.startTime ||
      !editDraft.endTime
    ) {
      return;
    }

    const updatedTasks = tasks.map((task) =>
      task.id === editingTaskId
        ? {
            ...task,
            name: editDraft.name.trim(),
            startTime: editDraft.startTime,
            endTime: editDraft.endTime,
          }
        : task,
    );

    setTasks(updatedTasks);
    onUpdateSchedule(period.id, updatedTasks);
    setEditingTaskId(null);
  };

  const cancelEdit = () => setEditingTaskId(null);

  const moveTaskToDay = (taskId: string, day: number) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, dayOfWeek: day } : task,
    );
    setTasks(updatedTasks);
    onUpdateSchedule(period.id, updatedTasks);
    setSelectedDayOfWeek(day);
  };

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

  const handleCloneTasks = (fromDay: number) => {
    const tasksToClone = tasks.filter((task) => task.dayOfWeek === fromDay);
    if (tasksToClone.length === 0) return;
    
    const clonedTasks = tasksToClone.map((task) => ({
      ...task,
      id: crypto.randomUUID(),
      dayOfWeek: selectedDayOfWeek,
    }));

    const updatedTasks = [...tasks, ...clonedTasks];
    setTasks(updatedTasks);
    onUpdateSchedule(period.id, updatedTasks);
    setIsCloning(false);
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
                {t("title", { name: period.name })}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {t("createdIn", {
                  date: new Date(period.createdAt).toLocaleDateString(locale, {
                    month: "long",
                    year: "numeric",
                  }),
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
              {t("deletePeriod")}
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Day tabs: click to view a day, drop a task on one to move it there.
              ponytail: native HTML5 drag-and-drop is desktop-only; add dnd-kit/pointer events for touch. */}
          <div className="flex flex-wrap gap-2">
            {daysOfWeek.map((dayName, index) => {
              const count = tasksByDay[index]?.length ?? 0;
              const isSelected = selectedDayOfWeek === index;
              const isDragOver = dragOverDay === index;
              return (
                <button
                  key={dayName}
                  type="button"
                  data-testid={`day-${index}`}
                  aria-label={dayName}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedDayOfWeek(index)}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOverDay(index);
                  }}
                  onDragLeave={() =>
                    setDragOverDay((prev) => (prev === index ? null : prev))
                  }
                  onDrop={(event) => {
                    event.preventDefault();
                    const taskId =
                      event.dataTransfer.getData("text/plain") || draggingTaskId;
                    if (taskId) moveTaskToDay(taskId, index);
                    setDragOverDay(null);
                    setDraggingTaskId(null);
                  }}
                  className={`px-3 py-2 rounded-md text-sm border cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : isDragOver
                        ? "border-orange-500 bg-secondary"
                        : "border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {daysShort[index]}
                  {count > 0 && (
                    <span className="ml-1 text-xs opacity-70">{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Schedule Display */}
          {currentDayTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t("noTasks")}</p>
              <p className="text-sm">
                {t.rich("emptyHint", {
                  clone: (chunks) => (
                    <span
                      onClick={() => setIsCloning(true)}
                      className="text-orange-500 font-bold hover:underline cursor-pointer"
                    >
                      {chunks}
                    </span>
                  ),
                })}
              </p>
              <p className="text-xs mt-2">{t("dragTip")}</p>
              {isCloning && (
                <div className="mt-4 p-4 border border-border rounded-lg bg-secondary">
                  <p className="mb-2 font-medium">{t("cloneFrom")}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {daysOfWeek.map((dayName, index) => {
                      if (index === selectedDayOfWeek) return null;
                      return (
                        <Button
                          key={index}
                          variant="outline"
                          className="w-full justify-start cursor-pointer"
                          onClick={() => handleCloneTasks(index)}
                        >
                          {dayName}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <TooltipProvider>
              <div className="space-y-1 bg-card p-2 border border-border rounded-lg">
                {currentDayTasks.map((task) => (
                  <div
                    key={task.id}
                    data-testid="task-card"
                    draggable={editingTaskId !== task.id}
                    onDragStart={(event) => {
                      setDraggingTaskId(task.id);
                      event.dataTransfer.setData("text/plain", task.id);
                      event.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnd={() => {
                      setDraggingTaskId(null);
                      setDragOverDay(null);
                    }}
                    className={`flex items-center justify-between gap-2 bg-transparent rounded-md transition-opacity ${
                      editingTaskId !== task.id ? "cursor-grab active:cursor-grabbing" : ""
                    } ${draggingTaskId === task.id ? "opacity-50" : ""}`}
                  >
                    {editingTaskId === task.id ? (
                      <>
                        <Input
                          type="time"
                          lang={timeLang}
                          aria-label={t("startTime")}
                          className="w-[15%] h-[2rem] border-orange-500 text-center"
                          value={editDraft.startTime}
                          onChange={(e) =>
                            setEditDraft((prev) => ({
                              ...prev,
                              startTime: e.target.value,
                            }))
                          }
                        />
                        <Input
                          type="time"
                          lang={timeLang}
                          aria-label={t("endTime")}
                          className="w-[15%] h-[2rem] border-orange-500 text-center"
                          value={editDraft.endTime}
                          onChange={(e) =>
                            setEditDraft((prev) => ({
                              ...prev,
                              endTime: e.target.value,
                            }))
                          }
                        />
                        <Input
                          aria-label={t("taskName")}
                          className="flex-1 h-[2rem] border-orange-500"
                          value={editDraft.name}
                          onChange={(e) =>
                            setEditDraft((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                        />
                        <Button
                          size="sm"
                          aria-label={t("saveTask")}
                          className="h-[2rem] cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground"
                          onClick={saveEdit}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          aria-label={t("cancelEdit")}
                          className="h-[2rem] cursor-pointer"
                          onClick={cancelEdit}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="w-[15%] h-[2rem] border border-orange-500 rounded-lg p-2 select-none">
                          <p className="text-sm text-muted-foreground leading-none">
                            {task.startTime}
                          </p>
                        </div>
                        <div className="w-[15%] h-[2rem] border border-orange-500 rounded-lg p-2 select-none">
                          <p className="text-sm text-muted-foreground leading-none">
                            {task.endTime}
                          </p>
                        </div>
                        <div className="flex-1 max-w-[260px] h-[2rem] border border-orange-500 rounded-lg p-2 flex items-center">
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
                          variant="outline"
                          size="sm"
                          aria-label={t("editTask")}
                          className="h-[2rem] cursor-pointer"
                          onClick={() => startEdit(task)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          aria-label={t("deleteTask")}
                          className="h-[2rem] cursor-pointer bg-red-500"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
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
                {t("addNewTask")}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-row gap-2">
                    <Input
                      type="time"
                      lang={timeLang}
                      className=" border-orange-500 text-center"
                      placeholder={t("startTime")}
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
                      lang={timeLang}
                      className=" border-orange-500 text-center"
                      placeholder={t("endTime")}
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
                    placeholder={t("taskName")}
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
                    {t("addTask")}
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
                    {t("cancel")}
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
                {t("deleteConfirmTitle")}
              </h3>
              <p className="text-muted-foreground mb-4">
                {t("deleteConfirmBody", { name: period.name })}
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirmation(false)}
                >
                  {t("cancel")}
                </Button>
                <Button variant="destructive" onClick={handleDeletePeriod}>
                  {t("delete")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
