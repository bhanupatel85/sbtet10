"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { STATUS_LABELS, type AttendanceMonth, type AttendanceRecord, type AttendanceStatus } from "@/lib/types/student"
import { cn } from "@/lib/utils"

interface AttendanceCalendarProps {
  months: AttendanceMonth[]
  records: AttendanceRecord[]
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const STATUS_CLASSES: Record<AttendanceStatus, string> = {
  P: "bg-present text-present-foreground",
  A: "bg-absent text-absent-foreground",
  W: "bg-secondary text-secondary-foreground",
  H: "bg-holiday text-holiday-foreground",
  E: "bg-primary text-primary-foreground",
  "-": "bg-transparent text-muted-foreground border border-dashed",
}

const LEGEND: AttendanceStatus[] = ["P", "A", "W", "H", "E", "-"]

function pickDefaultMonth(months: AttendanceMonth[], records: AttendanceRecord[]): number {
  // Prefer the latest month that actually has a marked (non "-") day.
  for (let i = months.length - 1; i >= 0; i--) {
    const m = months[i]
    if (records.some((r) => r.monthNumber === m.monthNumber && r.year === m.year && r.status !== "-")) return i
  }
  return Math.max(0, months.length - 1)
}

export function AttendanceCalendar({ months, records }: AttendanceCalendarProps) {
  const [index, setIndex] = useState(() => pickDefaultMonth(months, records))
  const month = months[index]

  const { cells, counts } = useMemo(() => {
    if (!month) return { cells: [], counts: {} as Record<AttendanceStatus, number> }

    const byDay = new Map<number, AttendanceRecord>()
    const counts: Record<AttendanceStatus, number> = { P: 0, A: 0, W: 0, H: 0, E: 0, "-": 0 }
    for (const r of records) {
      if (r.monthNumber === month.monthNumber && r.year === month.year) {
        byDay.set(r.day, r)
        counts[r.status]++
      }
    }

    const firstWeekday = (new Date(Date.UTC(month.year, month.monthNumber - 1, 1)).getUTCDay() + 6) % 7
    const cells: Array<{ day: number; record?: AttendanceRecord } | null> = []
    for (let i = 0; i < firstWeekday; i++) cells.push(null)
    for (let d = 1; d <= month.daysInMonth; d++) cells.push({ day: d, record: byDay.get(d) })

    return { cells, counts }
  }, [month, records])

  if (!month) {
    return (
      <section className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        No attendance months have been published for this student yet.
      </section>
    )
  }

  return (
    <section aria-labelledby="calendar-heading" className="flex flex-col gap-4 rounded-xl border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-0.5">
          <h3 id="calendar-heading" className="text-lg font-semibold tracking-tight">
            Attendance calendar
          </h3>
          <p className="text-xs text-muted-foreground">
            {counts.P} present · {counts.A} absent · {counts.H} holiday · {counts.E} exam
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous month"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <div className="flex flex-wrap justify-center gap-1">
            {months.map((m, i) => (
              <button
                key={`${m.year}-${m.monthNumber}`}
                type="button"
                aria-pressed={i === index}
                onClick={() => setIndex(i)}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  i === index ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
                )}
              >
                {m.name.slice(0, 3)}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next month"
            disabled={index === months.length - 1}
            onClick={() => setIndex((i) => Math.min(months.length - 1, i + 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <p className="text-sm font-medium">
        {month.name} {month.year}
      </p>

      <div role="grid" aria-label={`${month.name} ${month.year} attendance`} className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((d) => (
          <div key={d} role="columnheader" className="pb-1 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <div key={`empty-${i}`} aria-hidden="true" />
          const status = cell.record?.status ?? "-"
          const label = cell.record ? STATUS_LABELS[status] : "Not published"
          return (
            <div
              key={cell.day}
              role="gridcell"
              aria-label={`${month.name} ${cell.day}: ${label}`}
              title={label}
              className={cn(
                "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md font-mono text-sm tabular-nums",
                cell.record ? STATUS_CLASSES[status] : "text-muted-foreground/50",
              )}
            >
              <span>{cell.day}</span>
              {cell.record && status !== "-" ? (
                <span className="hidden text-[10px] font-sans font-medium leading-none opacity-80 sm:block">
                  {STATUS_LABELS[status]}
                </span>
              ) : null}
            </div>
          )
        })}
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground" aria-label="Legend">
        {LEGEND.map((s) => (
          <li key={s} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={cn("size-3 rounded-sm", STATUS_CLASSES[s])} />
            {STATUS_LABELS[s]}
          </li>
        ))}
      </ul>
    </section>
  )
}
