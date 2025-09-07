"use client"

import type React from "react"

import { useRef, useState } from "react"
import type { TimelinePeriod } from "@/app/page"

interface TimelineProps {
  periods: TimelinePeriod[]
  onPeriodClick: (period: TimelinePeriod) => void
}

export function Timeline({ periods, onPeriodClick }: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 })

  const currentYear = new Date().getFullYear()
  const years = [currentYear - 1, currentYear, currentYear + 1]
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  // Handle mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!timelineRef.current) return
    setIsDragging(true)
    setDragStart({
      x: e.pageX - timelineRef.current.offsetLeft,
      scrollLeft: timelineRef.current.scrollLeft,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !timelineRef.current) return
    e.preventDefault()
    const x = e.pageX - timelineRef.current.offsetLeft
    const walk = (x - dragStart.x) * 2
    timelineRef.current.scrollLeft = dragStart.scrollLeft - walk
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Handle touch drag
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!timelineRef.current) return
    setIsDragging(true)
    setDragStart({
      x: e.touches[0].pageX - timelineRef.current.offsetLeft,
      scrollLeft: timelineRef.current.scrollLeft,
    })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !timelineRef.current) return
    const x = e.touches[0].pageX - timelineRef.current.offsetLeft
    const walk = (x - dragStart.x) * 2
    timelineRef.current.scrollLeft = dragStart.scrollLeft - walk
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  // Get period position on timeline
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
        className={`relative overflow-x-auto scrollbar-hide ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="relative h-56 min-w-max pt-8">
          {/* Timeline line */}
          <div className="absolute top-32 left-0 right-0 h-0.5 bg-border"></div>

          {/* Years and months */}
          <div className="flex">
            {years.map((year, yearIndex) => (
              <div key={year} className="flex">
                {months.map((month, monthIndex) => (
                  <div key={`${year}-${month}`} className="relative w-32 flex flex-col items-center">
                    {/* Year label (only on January) */}
                    {monthIndex === 0 && (
                      <div className="absolute top-0 text-lg font-bold text-foreground whitespace-nowrap">{year}</div>
                    )}

                    {/* Month label */}
                    <div className="absolute top-12 text-sm text-muted-foreground font-medium">{month}</div>

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
                  <div className="text-sm font-semibold text-center whitespace-nowrap">{period.name}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 text-center text-muted-foreground text-sm">
        <p>Drag to navigate the timeline • Click on periods to view schedules</p>
      </div>
    </div>
  )
}
