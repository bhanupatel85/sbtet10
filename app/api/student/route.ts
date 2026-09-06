import { NextResponse, type NextRequest } from "next/server"
import { isValidPin, normalizePin } from "@/lib/pin"
import { getStudentDataProvider, ProviderError } from "@/lib/providers"
import { cacheDelete, cacheGet, cacheSet } from "@/lib/server/cache"
import type { StudentApiError, StudentData } from "@/lib/types/student"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const CACHE_TTL_MS = 5 * 60 * 1000

function errorResponse(status: number, error: StudentApiError["error"], message: string) {
  return NextResponse.json<StudentApiError>({ error, message }, { status, headers: { "Cache-Control": "no-store" } })
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const pin = normalizePin(searchParams.get("pin"))
  const refresh = searchParams.get("refresh") === "true"

  if (!pin) {
    return errorResponse(400, "INVALID_PIN", "PIN is required.")
  }
  if (!isValidPin(pin)) {
    return errorResponse(400, "INVALID_PIN", "Invalid PIN format. Expected something like 24264-CS-077.")
  }

  console.log(`[SBTET CONNECT] PIN: ${pin}${refresh ? " (refresh)" : ""}`)

  const cacheKey = `student:${pin}`
  if (refresh) {
    cacheDelete(cacheKey)
  } else {
    const cached = cacheGet<StudentData>(cacheKey)
    if (cached) {
      return NextResponse.json(cached, { headers: { "Cache-Control": "no-store", "X-Cache": "HIT" } })
    }
  }

  try {
    const data = await getStudentDataProvider().getStudent(pin)
    cacheSet(cacheKey, data, CACHE_TTL_MS)
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store", "X-Cache": "MISS" } })
  } catch (error) {
    if (error instanceof ProviderError) {
      console.log(`[SBTET CONNECT] Provider error: ${error.kind} (${error.upstreamStatus ?? "n/a"})`)
      if (error.kind === "NOT_FOUND") {
        return errorResponse(404, "NOT_FOUND", "Student not found. Please check the PIN and try again.")
      }
      return errorResponse(
        502,
        "UPSTREAM_UNAVAILABLE",
        "Attendance service is temporarily unavailable. Please try again later.",
      )
    }
    console.error("[SBTET CONNECT] Unexpected error:", error instanceof Error ? error.message : "unknown")
    return errorResponse(500, "INTERNAL_ERROR", "Unable to retrieve attendance data right now.")
  }
}
