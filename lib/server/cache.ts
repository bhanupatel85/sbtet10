interface CacheEntry<T> {
  value: T
  expiresAt: number
}

// Module-level in-memory cache. On Vercel this lives for the lifetime of a warm
// function instance, which is enough to absorb repeated lookups of the same PIN.
const store = new Map<string, CacheEntry<unknown>>()

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key)
  if (!entry) return undefined
  if (entry.expiresAt <= Date.now()) {
    store.delete(key)
    return undefined
  }
  return entry.value as T
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
}

export function cacheDelete(key: string): void {
  store.delete(key)
}
