"use client"

import useSWR from "swr"
import type { StudentApiError, StudentData } from "@/lib/types/student"

export class StudentFetchError extends Error {
  readonly code: StudentApiError["error"] | "NETWORK"
  readonly status: number

  constructor(code: StudentFetchError["code"], message: string, status: number) {
    super(message)
    this.name = "StudentFetchError"
    this.code = code
    this.status = status
  }
}

async function fetchStudent(url: string): Promise<StudentData> {
  let response: Response
  try {
    response = await fetch(url, { headers: { Accept: "application/json" } })
  } catch {
    throw new StudentFetchError("NETWORK", "Unable to retrieve attendance data right now.", 0)
  }

  if (!response.ok) {
    let body: Partial<StudentApiError> = {}
    try {
      body = (await response.json()) as StudentApiError
    } catch {
      // fall through with generic message
    }
    throw new StudentFetchError(
      body.error ?? "INTERNAL_ERROR",
      body.message ?? "Unable to retrieve attendance data right now.",
      response.status,
    )
  }

  return (await response.json()) as StudentData
}

export function useStudent(pin: string | null) {
  const key = pin ? `/api/student?pin=${encodeURIComponent(pin)}` : null

  const { data, error, isLoading, isValidating, mutate } = useSWR<StudentData, StudentFetchError>(key, fetchStudent, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
    dedupingInterval: 60_000,
  })

  async function refresh() {
    if (!pin) return
    const fresh = await fetchStudent(`/api/student?pin=${encodeURIComponent(pin)}&refresh=true`)
    await mutate(fresh, { revalidate: false })
  }

  return { data, error, isLoading, isValidating, retry: () => mutate(), refresh }
}
