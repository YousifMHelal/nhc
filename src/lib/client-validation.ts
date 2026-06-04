/**
 * Client-safe validation helpers (no server-only imports).
 *
 * Mirrors the rules enforced server-side in `validation.ts` so forms can give
 * instant inline feedback, while the API remains the authoritative check. Also
 * exposes `readApiError` to surface the server's Arabic validation messages when
 * a request is rejected.
 */

export const SAUDI_MOBILE_RE = /^(?:\+?9665\d{8}|05\d{8})$/

/** Strip spaces/dashes so "050 123 4567" validates the same as "0501234567". */
export function normalizePhone(value: string): string {
  return value.replace(/[\s-]/g, '').trim()
}

export function isValidSaudiPhone(value: string): boolean {
  return SAUDI_MOBILE_RE.test(normalizePhone(value))
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/**
 * Extract a human-readable Arabic message from a failed API response. Prefers a
 * field-level validation message, then the top-level `error`, then `fallback`.
 */
export async function readApiError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json()
    if (data && typeof data === 'object') {
      const fieldErrors = (data as { fieldErrors?: Record<string, string[]> }).fieldErrors
      if (fieldErrors) {
        const first = Object.values(fieldErrors).flat().find((m) => typeof m === 'string')
        if (first) return first
      }
      const error = (data as { error?: unknown }).error
      if (typeof error === 'string') return error
    }
  } catch {
    /* response had no JSON body — fall through */
  }
  return fallback
}
