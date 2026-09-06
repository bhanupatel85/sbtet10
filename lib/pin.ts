// SBTET PINs look like 24264-CS-077: 5 digits, 2-3 letter branch code, 3 digit roll.
// A slightly looser pattern is accepted so lateral-entry / older formats still pass.
const PIN_PATTERN = /^\d{5}-[A-Z]{2,4}-\d{3}$/

export function normalizePin(input: string | null | undefined): string {
  return (input ?? "").trim().toUpperCase()
}

export function isValidPin(pin: string): boolean {
  return PIN_PATTERN.test(pin)
}
