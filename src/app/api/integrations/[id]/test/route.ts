import { NextResponse } from 'next/server'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { getIntegrationById, appendAuditEntry } from '@/lib/queries'
import { validateId } from '@/lib/validation'
import type { AuditLogEntry } from '@/lib/types'

// ── SSRF protection ───────────────────────────────────────────────────────────
// The endpoint is operator-supplied, so a naive fetch would let it target the
// internal network or the cloud metadata service. Allow only http(s) URLs whose
// resolved address is publicly routable.

function isPrivateAddress(ip: string): boolean {
  const v = isIP(ip)
  if (v === 4) {
    const [a, b] = ip.split('.').map(Number)
    if (a === 10) return true                       // 10.0.0.0/8
    if (a === 127) return true                      // loopback
    if (a === 172 && b >= 16 && b <= 31) return true // 172.16.0.0/12
    if (a === 192 && b === 168) return true          // 192.168.0.0/16
    if (a === 169 && b === 254) return true          // link-local + metadata
    if (a === 100 && b >= 64 && b <= 127) return true // CGNAT 100.64.0.0/10
    if (a === 0) return true
    return false
  }
  if (v === 6) {
    const lower = ip.toLowerCase()
    if (lower === '::1' || lower === '::') return true       // loopback / unspecified
    if (lower.startsWith('fe80')) return true                // link-local
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true // unique-local
    // IPv4-mapped (::ffff:a.b.c.d)
    const mapped = lower.match(/::ffff:(\d+\.\d+\.\d+\.\d+)/)
    if (mapped) return isPrivateAddress(mapped[1])
    return false
  }
  return true // not a recognisable IP — treat as unsafe
}

async function assertSafeEndpoint(endpoint: string): Promise<string | null> {
  let url: URL
  try {
    url = new URL(endpoint)
  } catch {
    return 'Invalid endpoint URL'
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return 'Only http(s) endpoints can be tested'
  }
  try {
    // Resolve every address the host maps to; reject if any is private/internal.
    const addresses = await lookup(url.hostname, { all: true })
    if (addresses.length === 0) return 'Endpoint host could not be resolved'
    if (addresses.some((a) => isPrivateAddress(a.address))) {
      return 'Endpoint resolves to a private or internal address'
    }
  } catch {
    return 'Endpoint host could not be resolved'
  }
  return null
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const valid = validateId(id)
    if (!valid.ok) return valid.response
    const integration = await getIntegrationById(valid.data)

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }
    if (!integration.endpoint) {
      return NextResponse.json({ error: 'No endpoint configured for this integration' }, { status: 400 })
    }

    const unsafe = await assertSafeEndpoint(integration.endpoint)
    if (unsafe) {
      return NextResponse.json({ error: unsafe }, { status: 400 })
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const start = Date.now()

    let statusCode: number
    let errorMessage: string | undefined

    try {
      const res = await fetch(integration.endpoint, {
        method: 'GET',
        signal: controller.signal,
        headers: { Accept: 'application/json, text/plain, */*' },
        // Don't follow too many redirects — a redirect chain is itself a signal
        redirect: 'follow',
      })
      clearTimeout(timeout)
      statusCode = res.status
      // Treat 4xx/5xx as errors but still log the real code
      if (statusCode >= 500) errorMessage = `Server error ${statusCode}`
      else if (statusCode === 401 || statusCode === 403) errorMessage = `Auth required (${statusCode}) — endpoint reachable`
    } catch (err: unknown) {
      clearTimeout(timeout)
      const name = (err as Error).name
      const message = (err as Error).message ?? String(err)
      if (name === 'AbortError') {
        statusCode = 408
        errorMessage = 'Connection timed out after 8s'
      } else if (message.includes('ECONNREFUSED')) {
        statusCode = 503
        errorMessage = 'Connection refused — service unreachable'
      } else if (message.includes('ENOTFOUND') || message.includes('getaddrinfo')) {
        statusCode = 503
        errorMessage = 'DNS resolution failed — host not found'
      } else {
        statusCode = 503
        errorMessage = message
      }
    }

    const duration = Date.now() - start
    const entry: AuditLogEntry = {
      id: `${id}-test-${Date.now()}`,
      timestamp: new Date().toISOString(),
      method: 'GET',
      endpoint: integration.endpoint,
      statusCode,
      duration,
      records: statusCode < 400 ? 1 : 0,
      errorMessage,
    }

    const updated = await appendAuditEntry(id, entry)
    return NextResponse.json({ entry, integration: updated })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
