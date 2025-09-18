"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Timeline } from "@/components/timeline"
import { ScheduleModal } from "@/components/schedule-modal"

export interface TimelinePeriod {
  id: string
  name: string
  month: number
  year: number
  createdAt: Date
  schedule: ScheduleTask[]
}

export interface ScheduleTask {
  id: string
  name: string
  startTime: string
  endTime: string
  dayOfWeek: number // 0 = Sunday, 1 = Monday, etc.
}

export default function TimelinedApp() {
  const { theme, setTheme } = useTheme()
  const [periods, setPeriods] = useState<TimelinePeriod[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<TimelinePeriod | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newPeriodName, setNewPeriodName] = useState("")
  const [isCreatingPeriod, setIsCreatingPeriod] = useState(false)

  // Load data from localStorage on mount
  useEffect(() => {
    const savedPeriods = localStorage.getItem("timelined-periods")
    if (savedPeriods) {
      const parsed = JSON.parse(savedPeriods)
      setPeriods(
        parsed.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
        })),
      )
    }
  }, [])

  // Save to localStorage whenever periods change
  useEffect(() => {
    if (periods.length > 0) {
      localStorage.setItem("timelined-periods", JSON.stringify(periods))
    }
  }, [periods])

  const handleCreatePeriod = () => {
    if (!newPeriodName.trim()) return

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // Check if a period already exists for the current month and year
    const existingPeriod = periods.find(
      (period) => period.month === currentMonth && period.year === currentYear
    )

    if (existingPeriod) {
      alert(`A period "${existingPeriod.name}" already exists for this month. Only one period per month is allowed.`)
      return
    }

    const newPeriod: TimelinePeriod = {
      id: crypto.randomUUID(),
      name: newPeriodName.trim(),
      month: currentMonth,
      year: currentYear,
      createdAt: now,
      schedule: [],
    }

    setPeriods((prev) => [...prev, newPeriod])
    setNewPeriodName("")
    setIsCreatingPeriod(false)
  }

  const handlePeriodClick = (period: TimelinePeriod) => {
    setSelectedPeriod(period)
    setIsModalOpen(true)
  }

  const handleUpdateSchedule = (periodId: string, schedule: ScheduleTask[]) => {
    setPeriods((prev) => prev.map((p) => (p.id === periodId ? { ...p, schedule } : p)))
  }

  const handleDeletePeriod = (periodId: string) => {
    setPeriods((prev) => prev.filter((p) => p.id !== periodId))
    setIsModalOpen(false)
    setSelectedPeriod(null)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Timelined</h1>
            <p className="text-sm text-muted-foreground">Track your schedules across time</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Create Period Button */}
            {!isCreatingPeriod ? (
              <Button
                onClick={() => setIsCreatingPeriod(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Period
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Period name..."
                  value={newPeriodName}
                  onChange={(e) => setNewPeriodName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreatePeriod()
                    if (e.key === "Escape") {
                      setIsCreatingPeriod(false)
                      setNewPeriodName("")
                    }
                  }}
                  className="px-3 py-2 border border-border rounded-md bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
                <Button
                  onClick={handleCreatePeriod}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
                >
                  Create
                </Button>
                <Button
                  onClick={() => {
                    setIsCreatingPeriod(false)
                    setNewPeriodName("")
                  }}
                  className="cursor-pointer"
                  size="sm"
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            )}

            {/* Theme Toggle */}
            <Button className="cursor-pointer" variant="outline" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Timeline */}
      <main className="container mx-auto px-4 py-8">
        <Timeline periods={periods} onPeriodClick={handlePeriodClick} />
      </main>

      {/* Schedule Modal */}
      {selectedPeriod && (
        <ScheduleModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedPeriod(null)
          }}
          period={selectedPeriod}
          onUpdateSchedule={handleUpdateSchedule}
          onDeletePeriod={handleDeletePeriod}
        />
      )}
    </div>
  )
}
