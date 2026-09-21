// src/sdk/loadApi.ts
// Vendorized from upstream sweetwisdom/onlyoffice-web-local v2.0.0
// packages/oo-offline/src/loadApi.ts (commit 341f3f3, retrieved 2026-09-21).
// Source: https://github.com/sweetwisdom/onlyoffice-web-local/blob/main/packages/oo-offline/src/loadApi.ts
//
// Local modifications: none. Kept verbatim to match the upstream architecture.

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

  const promise = new Promise<void>((resolve, reject) => {
    const src = apiScriptUrl(base)
    const found = document.querySelector<HTMLScriptElement>('script[data-oo-api="' + src + '"]')
    if (found && window.DocsAPI) {
      resolve()
      return
    }
    const script = found || document.createElement('script')
    script.src = src
    script.async = true
    script.dataset.ooApi = src
    script.onload = () => {
      if (!window.DocsAPI) {
        reject(new Error('DocsAPI not mounted; check baseUrl and the build path'))
        return
      }
      resolve()
    }
    script.onerror = () => reject(new Error('Failed to load api.js: ' + src))
    if (!found) document.head.appendChild(script)
  })

  loadedByBase.set(base, promise)
  return promise
}

export { normalizeBaseUrl, apiScriptUrl }
