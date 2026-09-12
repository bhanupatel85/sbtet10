"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { GraduationCap } from "lucide-react"
import { AttendanceCalendar } from "@/components/attendance-calendar"
import { DashboardSkeleton, EmptyState, ErrorState } from "@/components/dashboard-states"
import { PinSearch } from "@/components/pin-search"
import { StudentSummary } from "@/components/student-summary"
import { useStudent } from "@/hooks/use-student"
import { isValidPin, normalizePin } from "@/lib/pin"

export function StudentDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlPin = normalizePin(searchParams.get("pin"))
  const [pin, setPin] = useState<string | null>(isValidPin(urlPin) ? urlPin : null)
  const [refreshing, startRefresh] = useTransition()

  const { data, error, isLoading, retry, refresh } = useStudent(pin)

  function handleSearch(nextPin: string) {
    setPin(nextPin)
    router.replace(`/?pin=${encodeURIComponent(nextPin)}`, { scroll: false })
  }

  function handleRefresh() {
    startRefresh(async () => {
      try {
        await refresh()
      } catch {
        // SWR keeps the last good data; the error surfaces on the next search.
      }
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 lg:py-12">
      <header className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold tracking-tight">SBTET CONNECT</h1>
            <p className="text-xs text-muted-foreground">Enter any Telangana Diploma PIN to load the full live record</p>
          </div>
        </div>
        <PinSearch initialPin={pin ?? ""} loading={isLoading} onSearch={handleSearch} />
      </header>

      <main className="flex flex-col gap-4">
        {!pin ? (
          <EmptyState />
        ) : isLoading ? (
          <DashboardSkeleton />
        ) : error ? (
          <ErrorState error={error} onRetry={() => void retry()} />
        ) : data ? (
          <>
            <StudentSummary data={data} refreshing={refreshing} onRefresh={handleRefresh} />
            <AttendanceCalendar key={data.student.pin} months={data.months} records={data.attendanceRecords} />
          </>
        ) : null}
      </main>

      <footer className="text-xs text-muted-foreground">
        Data is provided by Easy SBTET, an independent third-party service, and may lag behind official SBTET records.
      </footer>
    </div>
  )
}
