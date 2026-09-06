"use client"

import { useState, type FormEvent, type KeyboardEvent } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { isValidPin, normalizePin } from "@/lib/pin"

interface PinSearchProps {
  initialPin?: string
  loading?: boolean
  onSearch: (pin: string) => void
}

export function PinSearch({ initialPin = "", loading = false, onSearch }: PinSearchProps) {
  const [value, setValue] = useState(initialPin)
  const [localError, setLocalError] = useState<string | null>(null)

  function submit() {
    const pin = normalizePin(value)
    if (!pin) {
      setLocalError("Enter your student PIN.")
      return
    }
    if (!isValidPin(pin)) {
      setLocalError("PIN should look like 24264-CS-077.")
      return
    }
    setLocalError(null)
    setValue(pin)
    onSearch(pin)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    submit()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && (e.nativeEvent.isComposing || e.keyCode === 229)) e.preventDefault()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2" noValidate>
      <label htmlFor="pin" className="sr-only">
        Student PIN
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id="pin"
            name="pin"
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="Enter student PIN, e.g. 24264-CS-077"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-invalid={localError ? true : undefined}
            aria-describedby={localError ? "pin-error" : undefined}
            className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-3 font-mono text-sm uppercase tracking-wide text-foreground placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <Button type="submit" size="lg" className="h-11 px-6" disabled={loading}>
          {loading ? "Fetching..." : "Check attendance"}
        </Button>
      </div>
      {localError ? (
        <p id="pin-error" role="alert" className="text-sm text-destructive">
          {localError}
        </p>
      ) : null}
    </form>
  )
}
