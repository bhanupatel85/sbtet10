export type AttendanceStatus = "P" | "A" | "W" | "H" | "E" | "-"

export interface StudentInfo {
  pin: string
  name: string
  collegeCode: string
  branchCode: string
  scheme: string
  semester: string
  attendeeId: string
}

export interface AttendanceSummary {
  percentage: number
  totalPercentage: number
  presentDays: number
  workingDays: number
  totalWorkingDays: number
  actualWorkingDays: number
  examsPercentage: number
  examsPresentDays: number
  examsWorkingDays: number
  updatedDate: string
}

export interface AttendanceRecord {
  date: string
  status: AttendanceStatus
  month: string
  day: number
  monthNumber: number
  year: number
}

export interface AttendanceMonth {
  name: string
  monthNumber: number
  year: number
  daysInMonth: number
}

export interface StudentData {
  student: StudentInfo
  attendance: AttendanceSummary
  attendanceRecords: AttendanceRecord[]
  months: AttendanceMonth[]
  source: "easysbtet" | "mock"
  fetchedAt: string
}

export type StudentApiErrorCode = "INVALID_PIN" | "NOT_FOUND" | "UPSTREAM_UNAVAILABLE" | "INTERNAL_ERROR"

export interface StudentApiError {
  error: StudentApiErrorCode
  message: string
}

export const STATUS_LABELS: Record<AttendanceStatus, string> = {
  P: "Present",
  A: "Absent",
  W: "Working",
  H: "Holiday",
  E: "Exam",
  "-": "No record",
}
