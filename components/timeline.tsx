"use client"

import type React from "react"
import { useCallback, useRef, useState } from "react"
import { useTranslations } from "next-intl"

import { clampVelocity, decayVelocity, MIN_VELOCITY } from "@/lib/momentum"
import type { TimelinePeriod } from "@/lib/types"

interface TimelineProps {
  periods: TimelinePeriod[]
  onPeriodClick: (period: TimelinePeriod) => void
}

export function Timeline({ periods, onPeriodClick }: TimelineProps) {
  const t = useTranslations("Timeline")
  const tMonths = useTranslations("Months")
  const timelineRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const drag = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    lastX: 0,
    lastTime: 0,
    velocity: 0, // px per ms
    moved: false,
  })
  const animationRef = useRef<number | null>(null)
  const suppressClick = useRef(false)

  const currentYear = new Date().getFullYear()
  const years = [currentYear - 1, currentYear, currentYear + 1]
  const months = [
    "jan", "feb", "mar", "apr", "may", "jun",
    "jul", "aug", "sep", "oct", "nov", "dec",
  ].map((month) => tMonths(month))

  const stopInertia = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }, [])

  // After release, keep scrolling with a decaying velocity so a hard flick
  // glides further and eases to a stop.
  const startInertia = useCallback(() => {
    const element = timelineRef.current
    if (!element) return

    let velocity = clampVelocity(drag.current.velocity)
    if (Math.abs(velocity) < MIN_VELOCITY) return

    let last = performance.now()
    const step = (now: number) => {
      const dt = Math.min(now - last, 50)
      last = now

      if (Math.abs(velocity) < MIN_VELOCITY) {
        animationRef.current = null
        return
      }

      element.scrollLeft -= velocity * dt
      velocity = decayVelocity(velocity, dt)
      animationRef.current = requestAnimationFrame(step)
    }

    animationRef.current = requestAnimationFrame(step)
  }, [])

  const handleWindowPointerMove = useCallback((event: PointerEvent) => {
    const state = drag.current
    const element = timelineRef.current
    if (!state.active || !element || event.pointerId !== state.pointerId) return

    const now = performance.now()
    const dx = event.clientX - state.lastX
    const dt = now - state.lastTime || 16

    element.scrollLeft -= dx

    // Smooth the instantaneous velocity so a single jittery frame doesn't
    // dominate the flick strength.
    const instantaneous = dx / dt
    state.velocity = state.velocity * 0.4 + instantaneous * 0.6

    state.lastX = event.clientX
    state.lastTime = now

    if (Math.abs(event.clientX - state.startX) > 6) state.moved = true
  }, [])

  const handleWindowPointerUp = useCallback(
    (event: PointerEvent) => {
      const state = drag.current
      if (!state.active || event.pointerId !== state.pointerId) return

      state.active = false
      setIsDragging(false)

      window.removeEventListener("pointermove", handleWindowPointerMove)
      window.removeEventListener("pointerup", handleWindowPointerUp)
      window.removeEventListener("pointercancel", handleWindowPointerUp)

      if (state.moved) {
        suppressClick.current = true
        startInertia()
      } else {
        state.velocity = 0
      }
    },
    [handleWindowPointerMove, startInertia],
  )

  const handlePointerDown = (event: React.PointerEvent) => {
    if (event.pointerType === "mouse" && event.button !== 0) return

    stopInertia()
    drag.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      lastX: event.clientX,
      lastTime: performance.now(),
      velocity: 0,
      moved: false,
    }
    setIsDragging(true)

    // Listen on the window so the drag keeps tracking even outside the timeline.
    window.addEventListener("pointermove", handleWindowPointerMove)
    window.addEventListener("pointerup", handleWindowPointerUp)
    window.addEventListener("pointercancel", handleWindowPointerUp)
  }

  // Swallow the click that follows a drag so it doesn't open a period.
  const handleClickCapture = (event: React.MouseEvent) => {
    if (suppressClick.current) {
      event.preventDefault()
      event.stopPropagation()
      suppressClick.current = false
    }
  }

  const getPeriodPosition = (period: TimelinePeriod) => {
    const yearIndex = years.indexOf(period.year)
    if (yearIndex === -1) return null

    const monthPosition = yearIndex * 12 + period.month
    return monthPosition * 128 + 64 // 128px per month (w-32) + 64px offset (half width)
  }

  return (
    <div className="w-full">
      <div
        ref={timelineRef}
        data-testid="timeline-scroll"
        className={`relative overflow-x-auto scrollbar-hide select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          touchAction: "pan-y",
        }}
        onPointerDown={handlePointerDown}
        onClickCapture={handleClickCapture}
      >
        <div className="relative h-56 min-w-max pt-8">
          {/* Timeline line */}
          <div className="absolute top-32 left-0 right-0 h-0.5 bg-border"></div>

          {/* Years and months */}
          <div className="flex">
            {years.map((year) => (
              <div key={year} className="flex">
                {months.map((month, monthIndex) => (
                  <div key={`${year}-${month}`} className="relative w-32 flex flex-col items-center">
                    {/* Year label (only on January) */}
                    {monthIndex === 0 && (
                      <div className="absolute top-0 text-lg font-bold text-foreground whitespace-nowrap select-none">{year}</div>
                    )}

                    {/* Month label */}
                    <div className="absolute top-12 text-sm text-muted-foreground font-medium select-none">{month}</div>

                    {/* Timeline marker */}
                    <div className="absolute top-32 w-2 h-2 bg-border rounded-full transform -translate-x-1"></div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Period markers */}
          {periods.map((period) => {
            const position = getPeriodPosition(period)
            if (position === null) return null

            return (
              <div
                key={period.id}
                className="absolute top-20 transform -translate-x-1/2 cursor-pointer"
                style={{ left: `${position}px` }}
                onClick={() => onPeriodClick(period)}
              >
                {/* Connecting line */}
                <div className="w-0.5 h-12 bg-primary mx-auto"></div>

                {/* Period bubble */}
                <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg hover:bg-primary/90 transition-colors border-2 border-primary-foreground/20">
                  <div className="text-sm font-semibold text-center whitespace-nowrap select-none">{period.name}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 text-center text-muted-foreground text-sm">
        <p>{t("hint")}</p>
      </div>
    </div>
  )
}
