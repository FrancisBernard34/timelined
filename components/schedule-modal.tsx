"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Clock } from "lucide-react"
import type { TimelinePeriod, ScheduleTask } from "@/app/page"

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  period: TimelinePeriod
  onUpdateSchedule: (periodId: string, schedule: ScheduleTask[]) => void
}

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export function ScheduleModal({ isOpen, onClose, period, onUpdateSchedule }: ScheduleModalProps) {
  const [tasks, setTasks] = useState<ScheduleTask[]>(period.schedule)
  const [newTask, setNewTask] = useState({
    name: "",
    startTime: "",
    endTime: "",
    dayOfWeek: 1, // Default to Monday
  })
  const [isAddingTask, setIsAddingTask] = useState(false)

  const handleAddTask = () => {
    if (!newTask.name.trim() || !newTask.startTime || !newTask.endTime) return

    const task: ScheduleTask = {
      id: crypto.randomUUID(),
      name: newTask.name.trim(),
      startTime: newTask.startTime,
      endTime: newTask.endTime,
      dayOfWeek: newTask.dayOfWeek,
    }

    const updatedTasks = [...tasks, task]
    setTasks(updatedTasks)
    onUpdateSchedule(period.id, updatedTasks)

    setNewTask({ name: "", startTime: "", endTime: "", dayOfWeek: 1 })
    setIsAddingTask(false)
  }

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter((task) => task.id !== taskId)
    setTasks(updatedTasks)
    onUpdateSchedule(period.id, updatedTasks)
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  // Group tasks by day of week
  const tasksByDay = tasks.reduce(
    (acc, task) => {
      if (!acc[task.dayOfWeek]) acc[task.dayOfWeek] = []
      acc[task.dayOfWeek].push(task)
      return acc
    },
    {} as Record<number, ScheduleTask[]>,
  )

  // Sort tasks by start time within each day
  Object.keys(tasksByDay).forEach((day) => {
    tasksByDay[Number.parseInt(day)].sort((a, b) => a.startTime.localeCompare(b.startTime))
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">{period.name} Schedule</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Created in{" "}
            {new Date(period.createdAt).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add Task Section */}
          <div className="border border-border rounded-lg p-4 bg-card">
            {!isAddingTask ? (
              <Button
                onClick={() => setIsAddingTask(true)}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Task
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Input
                    placeholder="Task name"
                    value={newTask.name}
                    onChange={(e) => setNewTask((prev) => ({ ...prev, name: e.target.value }))}
                  />

                  <Select
                    value={newTask.dayOfWeek.toString()}
                    onValueChange={(value) => setNewTask((prev) => ({ ...prev, dayOfWeek: Number.parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {daysOfWeek.map((day, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="time"
                    placeholder="Start time"
                    value={newTask.startTime}
                    onChange={(e) => setNewTask((prev) => ({ ...prev, startTime: e.target.value }))}
                  />

                  <Input
                    type="time"
                    placeholder="End time"
                    value={newTask.endTime}
                    onChange={(e) => setNewTask((prev) => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleAddTask} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Add Task
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddingTask(false)
                      setNewTask({ name: "", startTime: "", endTime: "", dayOfWeek: 1 })
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Schedule Display */}
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No tasks scheduled yet</p>
              <p className="text-sm">Add your first task to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {daysOfWeek.map((dayName, dayIndex) => {
                const dayTasks = tasksByDay[dayIndex] || []
                if (dayTasks.length === 0) return null

                return (
                  <div key={dayIndex} className="border border-border rounded-lg p-4 bg-card">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center">
                      <div className="w-3 h-3 bg-primary rounded-full mr-2"></div>
                      {dayName}
                    </h3>

                    <div className="space-y-3">
                      {dayTasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-foreground">{task.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatTime(task.startTime)} - {formatTime(task.endTime)}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
