import { Suspense } from "react"
import { StudentDashboard } from "@/components/student-dashboard"
import { DashboardSkeleton } from "@/components/dashboard-states"

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
          <DashboardSkeleton />
        </div>
      }
    >
      <StudentDashboard />
    </Suspense>
  )
}
