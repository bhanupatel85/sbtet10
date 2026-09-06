import { AlertTriangle, RotateCcw, SearchX, ServerCrash } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { StudentFetchError } from "@/hooks/use-student"

function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />
}

export function DashboardSkeleton() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">Fetching attendance...</p>
      <div className="rounded-xl border bg-card p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
          <Skeleton className="size-28 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl border bg-card p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-14" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-card p-6">
        <Skeleton className="mb-4 h-5 w-40" />
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      </div>
    </div>
  )
}

interface ErrorStateProps {
  error: StudentFetchError
  onRetry: () => void
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const notFound = error.code === "NOT_FOUND"
  const unavailable = error.code === "UPSTREAM_UNAVAILABLE"

  const Icon = notFound ? SearchX : unavailable ? ServerCrash : AlertTriangle
  const title = notFound ? "Student not found" : unavailable ? "Service unavailable" : "Something went wrong"
  const message = notFound
    ? "Student not found. Please check the PIN and try again."
    : unavailable
      ? "Attendance service is temporarily unavailable. Please try again later."
      : error.code === "INVALID_PIN"
        ? error.message
        : "Unable to retrieve attendance data right now."

  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 rounded-xl border bg-card px-6 py-12 text-center"
    >
      <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="max-w-md text-pretty text-sm text-muted-foreground">{message}</p>
      </div>
      {!notFound && error.code !== "INVALID_PIN" ? (
        <Button variant="outline" onClick={onRetry}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Retry
        </Button>
      ) : null}
    </div>
  )
}

export function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
      <p className="text-sm font-medium">Search for a student PIN to view attendance</p>
      <p className="max-w-sm text-pretty text-xs text-muted-foreground">
        Attendance is fetched live from Easy SBTET, a third-party data provider, through the SBTET CONNECT server.
        No password is required.
      </p>
    </div>
  )
}
