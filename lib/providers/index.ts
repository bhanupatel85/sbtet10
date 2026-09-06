import { EasySbtetProvider } from "./easy-sbtet-provider"
import { MockStudentDataProvider } from "./mock-provider"
import type { StudentDataProvider } from "./student-data-provider"

let instance: StudentDataProvider | null = null

// DATA_PROVIDER=mock opts into fake data for development; anything else
// (including unset) uses the real Easy SBTET provider.
export function getStudentDataProvider(): StudentDataProvider {
  if (instance) return instance
  const selected = (process.env.DATA_PROVIDER || "easysbtet").toLowerCase()
  instance = selected === "mock" ? new MockStudentDataProvider() : new EasySbtetProvider()
  return instance
}

export { ProviderError } from "./student-data-provider"
export type { StudentDataProvider } from "./student-data-provider"
