import type {
  AttendanceMonth,
  AttendanceRecord,
  AttendanceStatus,
  StudentData,
} from "@/lib/types/student"
import { ProviderError, type StudentDataProvider } from "./student-data-provider"

// Approved third-party provider. Only the server ever talks to it; the browser
// never receives this URL and cannot supply an alternative one.
const DEFAULT_EASYSBTET_API_URL = "https://easysbtet.vercel.app/api/attendance"
const REQUEST_TIMEOUT_MS = 15_000

interface EasySbtetTableRow {
  semid?: number
  Pin?: string
  TotalPercentage?: number
  TotalWorkingDays?: number
  ActualWorkingDays?: number
  Name?: string
  AttendeeId?: string
  CollegeCode?: string
  Scheme?: string
  Semester?: string
  BranchCode?: string
  IsTransfered?: boolean
  NumberOfDaysPresent?: number
  WorkingDays?: number
  Percentage?: number
  UpdatedDate?: string
  ExamsNDP?: number
  ExamsPer?: number
  ExamsWorkingDays?: number
}

interface EasySbtetTable1Row {
  Date?: string
  Status?: string
  AttendanceMonth?: string
  mnt?: number
  Day?: string | number
  nod?: number
  yr?: number
}

interface EasySbtetTable2Row {
  AttendanceMonth?: string
  nod?: number
}

interface EasySbtetResponse {
  Table?: EasySbtetTableRow[]
  Table1?: EasySbtetTable1Row[]
  Table2?: EasySbtetTable2Row[]
  error?: string
}

const VALID_STATUSES: ReadonlySet<string> = new Set(["P", "A", "W", "H", "E", "-"])

function toStatus(raw: unknown): AttendanceStatus {
  const s = typeof raw === "string" ? raw.trim().toUpperCase() : ""
  return (VALID_STATUSES.has(s) ? s : "-") as AttendanceStatus
}

function num(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback
}

function normalizeRecords(rows: EasySbtetTable1Row[]): AttendanceRecord[] {
  return rows
    .filter((row) => row && typeof row === "object")
    .map((row) => ({
      date: str(row.Date),
      status: toStatus(row.Status),
      month: str(row.AttendanceMonth),
      day: num(row.Day),
      monthNumber: num(row.mnt),
      year: num(row.yr),
    }))
    .filter((r) => r.date && r.monthNumber >= 1 && r.monthNumber <= 12)
    .sort((a, b) => a.date.localeCompare(b.date))
}

function normalizeMonths(rows: EasySbtetTable2Row[], records: AttendanceRecord[]): AttendanceMonth[] {
  // Table2 is the authority on which months exist; Table1 supplies month number
  // and year for each name so the calendar can lay out a real grid.
  const lookup = new Map<string, { monthNumber: number; year: number }>()
  for (const r of records) {
    if (!lookup.has(r.month)) lookup.set(r.month, { monthNumber: r.monthNumber, year: r.year })
  }

  return rows
    .map((row) => {
      const name = str(row.AttendanceMonth)
      const meta = lookup.get(name)
      if (!name || !meta) return null
      return {
        name,
        monthNumber: meta.monthNumber,
        year: meta.year,
        daysInMonth: num(row.nod, 30),
      }
    })
    .filter((m): m is AttendanceMonth => m !== null)
    .sort((a, b) => a.year - b.year || a.monthNumber - b.monthNumber)
}

export class EasySbtetProvider implements StudentDataProvider {
  readonly name = "easysbtet"
  private readonly baseUrl: string

  constructor(baseUrl: string = process.env.EASYSBTET_API_URL || DEFAULT_EASYSBTET_API_URL) {
    this.baseUrl = baseUrl
  }

  async getStudent(pin: string): Promise<StudentData> {
    const url = `${this.baseUrl}?pin=${encodeURIComponent(pin)}`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    let response: Response
    try {
      response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      })
    } catch (error) {
      const reason = error instanceof Error ? error.message : "unknown"
      throw new ProviderError("UPSTREAM_UNAVAILABLE", `Network error contacting Easy SBTET: ${reason}`)
    } finally {
      clearTimeout(timer)
    }

    console.log(`[SBTET CONNECT] Easy SBTET status: ${response.status}`)

    let payload: EasySbtetResponse
    try {
      payload = (await response.json()) as EasySbtetResponse
    } catch {
      throw new ProviderError("INVALID_RESPONSE", "Easy SBTET returned a non-JSON body", response.status)
    }

    // Easy SBTET answers 404 + {"error":"SBTET_RECORD_NOT_FOUND"} for unknown PINs.
    if (response.status === 404 || payload?.error === "SBTET_RECORD_NOT_FOUND") {
      throw new ProviderError("NOT_FOUND", "No student record for this PIN", response.status)
    }

    if (!response.ok) {
      throw new ProviderError("UPSTREAM_UNAVAILABLE", `Easy SBTET responded with ${response.status}`, response.status)
    }

    const table = Array.isArray(payload?.Table) ? payload.Table : []
    console.log(`[SBTET CONNECT] Table length: ${table.length}`)

    const row = table[0]
    if (!row || typeof row !== "object") {
      throw new ProviderError("NOT_FOUND", "Easy SBTET returned an empty Table", response.status)
    }

    const attendanceRecords = normalizeRecords(Array.isArray(payload.Table1) ? payload.Table1 : [])
    const months = normalizeMonths(Array.isArray(payload.Table2) ? payload.Table2 : [], attendanceRecords)

    return {
      student: {
        pin: str(row.Pin, pin).toUpperCase() || pin,
        name: str(row.Name, "Unknown"),
        collegeCode: str(row.CollegeCode),
        branchCode: str(row.BranchCode),
        scheme: str(row.Scheme),
        semester: str(row.Semester),
        attendeeId: str(row.AttendeeId),
      },
      attendance: {
        percentage: num(row.Percentage),
        totalPercentage: num(row.TotalPercentage),
        presentDays: num(row.NumberOfDaysPresent),
        workingDays: num(row.WorkingDays),
        totalWorkingDays: num(row.TotalWorkingDays),
        actualWorkingDays: num(row.ActualWorkingDays),
        examsPercentage: num(row.ExamsPer),
        examsPresentDays: num(row.ExamsNDP),
        examsWorkingDays: num(row.ExamsWorkingDays),
        updatedDate: str(row.UpdatedDate),
      },
      attendanceRecords,
      months,
      source: "easysbtet",
      fetchedAt: new Date().toISOString(),
    }
  }
}
