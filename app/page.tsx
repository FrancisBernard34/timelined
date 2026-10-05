"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Moon, Sun, LogOut } from "lucide-react"
import { useTheme } from "next-themes"
import { Timeline } from "@/components/timeline"
import { ScheduleModal } from "@/components/schedule-modal"
import { AuthForm, type AuthUser } from "@/components/auth-form"

export interface TimelinePeriod {
  id: string
  name: string
  month: number
  year: number
  createdAt: string
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
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [periods, setPeriods] = useState<TimelinePeriod[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<TimelinePeriod | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newPeriodName, setNewPeriodName] = useState("")
  const [isCreatingPeriod, setIsCreatingPeriod] = useState(false)

  const loadPeriods = useCallback(async () => {
    const response = await fetch("/api/periods", { cache: "no-store" })
    if (response.status === 401) {
      setUser(null)
      return
    }
    if (response.ok) {
      setPeriods(await response.json())
    }
  }, [])

  useEffect(() => {
    let active = true
    const checkSession = async () => {
      const response = await fetch("/api/auth/me", { cache: "no-store" })
      if (!active) return
      if (response.ok) {
        setUser(await response.json())
      } else {
        setUser(null)
      }
      setIsCheckingAuth(false)
    }
    checkSession()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (user) loadPeriods()
  }, [user, loadPeriods])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
    setPeriods([])
    setSelectedPeriod(null)
    setIsModalOpen(false)
  }

  const handleCreatePeriod = async () => {
    if (!newPeriodName.trim()) return

    const now = new Date()
    const response = await fetch("/api/periods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newPeriodName.trim(),
        month: now.getMonth(),
        year: now.getFullYear(),
      }),
    })

    if (response.status === 409) {
      alert("A period already exists for this month. Only one period per month is allowed.")
      return
    }
    if (!response.ok) {
      alert("Could not create the period. Please try again.")
      return
    }

    const created: TimelinePeriod = await response.json()
    setPeriods((prev) => [...prev, created])
    setNewPeriodName("")
    setIsCreatingPeriod(false)
  }

  const handlePeriodClick = (period: TimelinePeriod) => {
    setSelectedPeriod(period)
    setIsModalOpen(true)
  }

  const handleUpdateSchedule = async (periodId: string, schedule: ScheduleTask[]) => {
    setPeriods((prev) => prev.map((p) => (p.id === periodId ? { ...p, schedule } : p)))
    setSelectedPeriod((prev) => (prev && prev.id === periodId ? { ...prev, schedule } : prev))

    await fetch(`/api/periods/${periodId}/schedule`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tasks: schedule }),
    })
  }

  const handleDeletePeriod = async (periodId: string) => {
    setPeriods((prev) => prev.filter((p) => p.id !== periodId))
    setIsModalOpen(false)
    setSelectedPeriod(null)

    await fetch(`/api/periods/${periodId}`, { method: "DELETE" })
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (!user) {
    return <AuthForm onAuthenticated={setUser} />
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

            {/* Account */}
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <span className="hidden sm:inline text-sm text-muted-foreground max-w-[180px] truncate">
                {user.name ?? user.email}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={handleLogout}
                className="cursor-pointer"
                aria-label="Log out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
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
