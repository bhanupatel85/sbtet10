import type { StudentData } from "@/lib/types/student"

export interface StudentDataProvider {
  readonly name: string
  /** Receives an already-validated, uppercase PIN. */
  getStudent(pin: string): Promise<StudentData>
}

export type ProviderErrorKind = "NOT_FOUND" | "UPSTREAM_UNAVAILABLE" | "INVALID_RESPONSE"

export class ProviderError extends Error {
  readonly kind: ProviderErrorKind
  readonly upstreamStatus?: number

  constructor(kind: ProviderErrorKind, message: string, upstreamStatus?: number) {
    super(message)
    this.name = "ProviderError"
    this.kind = kind
    this.upstreamStatus = upstreamStatus
  }
}
