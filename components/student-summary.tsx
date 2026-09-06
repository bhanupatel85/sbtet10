import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { StudentData } from "@/lib/types/student"
import { cn } from "@/lib/utils"

interface StudentSummaryProps {
  data: StudentData
  refreshing?: boolean
  onRefresh: () => void
}

function formatUpdated(iso: string): string {
  if (!iso) return "Unknown"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function percentTone(pct: number) {
  if (pct >= 75) return "text-present"
  if (pct >= 65) return "text-holiday"
  return "text-absent"
}

export function StudentSummary({ data, refreshing = false, onRefresh }: StudentSummaryProps) {
  const { student, attendance } = data
  const pct = attendance.percentage
  const ringStyle = { "--pct": `${Math.max(0, Math.min(100, pct))}%` } as React.CSSProperties

  const details: Array<[string, string]> = [
    ["PIN", student.pin],
    ["Branch", student.branchCode || "—"],
    ["Scheme", student.scheme || "—"],
    ["Semester", student.semester || "—"],
    ["College", student.collegeCode || "—"],
  ]

  const stats: Array<[string, string, string]> = [
    ["Present days", String(attendance.presentDays), "days marked present"],
    ["Working days", String(attendance.workingDays), "days counted so far"],
    ["Total working days", String(attendance.totalWorkingDays), "planned for the semester"],
    ["Overall", `${attendance.totalPercentage.toFixed(2)}%`, `of ${attendance.totalWorkingDays} total days`],
  ]

  return (
    <section aria-labelledby="student-heading" className="flex flex-col gap-4">
      <div className="rounded-xl border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Student</p>
              <h2 id="student-heading" className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
                {student.name}
              </h2>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
              {details.map(([label, value]) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="font-mono text-sm font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex items-center gap-5 md:flex-col md:items-end md:gap-2">
            <div
              role="img"
              aria-label={`Attendance ${pct.toFixed(2)} percent`}
              style={ringStyle}
              className="relative grid size-28 shrink-0 place-items-center rounded-full bg-[conic-gradient(currentColor_var(--pct),var(--color-muted)_0)] text-present"
            >
              <span className={cn("sr-only")}>{pct}</span>
              <div className="grid size-22 place-items-center rounded-full bg-card">
                <span className={cn("font-mono text-2xl font-semibold tabular-nums", percentTone(pct))}>
                  {pct.toFixed(1)}
                  <span className="text-base">%</span>
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-0.5 md:text-right">
              <p className="text-sm font-medium">Attendance percentage</p>
              <p className="text-xs text-muted-foreground">
                {attendance.presentDays} of {attendance.workingDays} working days
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([label, value, hint]) => (
          <div key={label} className="flex flex-col gap-1 rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-mono text-2xl font-semibold tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          Last updated {formatUpdated(attendance.updatedDate)}
          {attendance.examsWorkingDays > 0 ? (
            <>
              {" · "}
              Exam eligibility {attendance.examsPercentage.toFixed(2)}% ({attendance.examsPresentDays}/
              {attendance.examsWorkingDays})
            </>
          ) : null}
        </p>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={refreshing} className="w-fit">
          <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} aria-hidden="true" />
          {refreshing ? "Refreshing" : "Refresh data"}
        </Button>
      </div>
    </section>
  )
}
