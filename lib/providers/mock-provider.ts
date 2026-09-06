import type { AttendanceRecord, AttendanceStatus, StudentData } from "@/lib/types/student"
import { ProviderError, type StudentDataProvider } from "./student-data-provider"

const MONTHS = [
  { name: "June", monthNumber: 6, year: 2026, daysInMonth: 30 },
  { name: "July", monthNumber: 7, year: 2026, daysInMonth: 31 },
]

// Deterministic fake data for local development when DATA_PROVIDER=mock.
export class MockStudentDataProvider implements StudentDataProvider {
  readonly name = "mock"

  async getStudent(pin: string): Promise<StudentData> {
    if (pin.endsWith("-000")) {
      throw new ProviderError("NOT_FOUND", "Mock: no record")
    }

    const records: AttendanceRecord[] = []
    let present = 0
    let working = 0

    for (const m of MONTHS) {
      for (let d = 1; d <= m.daysInMonth; d++) {
        const date = new Date(Date.UTC(m.year, m.monthNumber - 1, d))
        const weekday = date.getUTCDay()
        let status: AttendanceStatus
        if (weekday === 0) status = "W"
        else if (d === 15) status = "H"
        else if (d === 28) status = "E"
        else {
          status = (d * 7 + m.monthNumber) % 5 === 0 ? "A" : "P"
          working++
          if (status === "P") present++
        }
        records.push({
          date: date.toISOString().slice(0, 19),
          status,
          month: m.name,
          day: d,
          monthNumber: m.monthNumber,
          year: m.year,
        })
      }
    }

    const percentage = working ? Math.round((present / working) * 10000) / 100 : 0

    return {
      student: {
        pin,
        name: "MOCK STUDENT",
        collegeCode: pin.slice(2, 5),
        branchCode: pin.split("-")[1] ?? "CS",
        scheme: "C24",
        semester: "5SEM",
        attendeeId: "00000-00000",
      },
      attendance: {
        percentage,
        totalPercentage: percentage,
        presentDays: present,
        workingDays: working,
        totalWorkingDays: working,
        actualWorkingDays: working,
        examsPercentage: percentage,
        examsPresentDays: present,
        examsWorkingDays: working,
        updatedDate: new Date().toISOString(),
      },
      attendanceRecords: records,
      months: MONTHS,
      source: "mock",
      fetchedAt: new Date().toISOString(),
    }
  }
}
