// src/sdk/loadApi.ts
// Vendorized from upstream sweetwisdom/onlyoffice-web-local v2.0.0
// packages/oo-offline/src/loadApi.ts (commit 341f3f3, retrieved 2026-09-21).
// Source: https://github.com/sweetwisdom/onlyoffice-web-local/blob/main/packages/oo-offline/src/loadApi.ts
//
// Local modifications: a failed load is fully unwound so a later mount retries.
// The vendor build is ~700 MB and is often still being copied when the first
// attempt runs, and browsers do not re-fetch an <script> whose load already
// failed, so both the cached rejection and the dead <script> are dropped.

const loadedByBase = new Map<string, Promise<void>>()

function normalizeBaseUrl(baseUrl: string): string {
  if (!baseUrl) return '/'
  return baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'
}

function apiScriptUrl(baseUrl: string): string {
  return normalizeBaseUrl(baseUrl) + 'vendor/web-apps/apps/api/documents/api.js'
}

/** Inject DocsAPI (api.js) idempotently per baseUrl. */
export function loadApi(baseUrl: string): Promise<void> {
  const base = normalizeBaseUrl(baseUrl)
  if (typeof window !== 'undefined' && window.DocsAPI) {
    return Promise.resolve()
  }
  const existing = loadedByBase.get(base)
  if (existing) return existing

  const pending = new Promise<void>((resolve, reject) => {
    const src = apiScriptUrl(base)
    const found = document.querySelector<HTMLScriptElement>('script[data-oo-api="' + src + '"]')
    if (found && window.DocsAPI) {
      resolve()
      return
    }
    const script = found || document.createElement('script')

    // A <script> that already ran or already failed cannot be restarted by
    // re-assigning .src, so take it out of the document on every failure.
    // Otherwise the next attempt would wait forever on a dead element.
    const dropScript = () => {
      if (script.parentNode) script.parentNode.removeChild(script)
    }

    script.src = src
    script.async = true
    script.dataset.ooApi = src
    script.onload = () => {
      if (!window.DocsAPI) {
        dropScript()
        reject(new Error('DocsAPI not mounted; check baseUrl and the build path'))
        return
      }
      resolve()
    }
    script.onerror = () => {
      dropScript()
      reject(new Error('Failed to load api.js: ' + src))
    }
    if (!script.isConnected) document.head.appendChild(script)
  })

  // Cache only in-flight / successful loads. Rejections are evicted so that a
  // retry after the assets become reachable issues a fresh request instead of
  // replaying this failure forever.
  const promise = pending.catch((err: unknown) => {
    loadedByBase.delete(base)
    throw err instanceof Error ? err : new Error(String(err))
  })

  loadedByBase.set(base, promise)
  return promise
}

export { normalizeBaseUrl, apiScriptUrl }
