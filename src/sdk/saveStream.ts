// src/sdk/saveStream.ts
// Vendorized from upstream sweetwisdom/onlyoffice-web-local v2.0.0
// packages/oo-offline/src/saveStream.ts (commit 341f3f3, retrieved 2026-09-21).
// Source: https://github.com/sweetwisdom/onlyoffice-web-local/blob/main/packages/oo-offline/src/saveStream.ts
//
// Local modifications: bilingual header comment block (no behavioral changes).

import type { SaveResult } from './types'

const STREAM_TYPE = 'onlyoffice-file-stream'
const SAVE_TIMEOUT_MS = 60000

type DownloadFn = (data: ArrayBuffer | Uint8Array, fileName: string, mime?: string) => void

function findEditorIframe(container: HTMLElement): HTMLIFrameElement | null {
  return container.querySelector('iframe')
}

function setStreamFlagOnFrame(frame: HTMLIFrameElement | null, value: boolean): void {
  if (value) window.OO_FILE_STREAM_ONLY = true
  else delete window.OO_FILE_STREAM_ONLY
  if (!frame || !frame.contentWindow) return
  try {
    if (value) frame.contentWindow.OO_FILE_STREAM_ONLY = true
    else delete frame.contentWindow.OO_FILE_STREAM_ONLY
  } catch {
    /* ignore cross-origin */
  }
}

/**
 * The offline build's _downloadAsFromLocal uses DownloadFileFromBytes directly
 * and does not emit a file-stream. We hook inside the editor iframe: always
 * postMessage; only when OO_FILE_STREAM_ONLY is set do we skip the browser
 * download (used by host imperative save()). Normally we do NOT set the flag,
 * so file-menu 'Download as' falls through to the browser download.
 */
function hookDownloadInFrame(frame: HTMLIFrameElement): boolean {
  try {
    const win = frame.contentWindow as Window & {
      AscCommon?: { DownloadFileFromBytes?: DownloadFn }
    }
    if (!win || !win.AscCommon || typeof win.AscCommon.DownloadFileFromBytes !== 'function') {
      return false
    }
    const original = win.AscCommon.DownloadFileFromBytes
    if ((original as DownloadFn & { __ooHooked?: boolean }).__ooHooked) return true

    const hooked: DownloadFn & { __ooHooked?: boolean } = function (data, fileName, mime) {
      let buffer: ArrayBuffer
      if (data instanceof ArrayBuffer) {
        buffer = data.slice(0)
      } else {
        const copy = new Uint8Array(data.byteLength)
        copy.set(data)
        buffer = copy.buffer
      }
      const ext = String(fileName || '').split('.').pop() || ''
      const payload = {
        type: STREAM_TYPE,
        fileName,
        fileType: ext.toLowerCase(),
        buffer
      }
      try {
        win.parent.postMessage(payload, '*', [buffer])
      } catch {
        win.parent.postMessage({ ...payload, buffer: buffer.slice(0) }, '*')
      }
      // Only swallow browser download during host save(); file menu downloads
      // still go through the original.
      if (win.OO_FILE_STREAM_ONLY === true || window.OO_FILE_STREAM_ONLY === true) {
        return
      }
      original.call(win.AscCommon, data, fileName, mime)
    }
    hooked.__ooHooked = true
    win.AscCommon.DownloadFileFromBytes = hooked
    return true
  } catch {
    return false
  }
}

/** Periodically retry hooking after mount; never permanently opens OO_FILE_STREAM_ONLY. */
export function prepareSaveStream(container: HTMLElement): () => void {
  let attempts = 0
  const timer = window.setInterval(() => {
    attempts += 1
    const frame = findEditorIframe(container)
    if (frame) hookDownloadInFrame(frame)
    if (attempts > 50) window.clearInterval(timer)
  }, 200)

  return () => window.clearInterval(timer)
}

/** Open stream mode before host imperative save(); caller must close when done. */
export function beginFileStreamCapture(container: HTMLElement): () => void {
  const frame = findEditorIframe(container)
  if (frame) hookDownloadInFrame(frame)
  setStreamFlagOnFrame(frame, true)
  return () => setStreamFlagOnFrame(findEditorIframe(container), false)
}

export function waitForFileStream(requestId: string, timeoutMs = SAVE_TIMEOUT_MS): Promise<SaveResult> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      window.removeEventListener('message', onMessage)
      reject(new Error('Save timeout (' + timeoutMs + 'ms), no ' + STREAM_TYPE + ' received'))
    }, timeoutMs)

    function onMessage(event: MessageEvent) {
      const data = event.data
      if (!data || data.type !== STREAM_TYPE) return
      if (!data.buffer) {
        window.clearTimeout(timer)
        window.removeEventListener('message', onMessage)
        reject(new Error('No file stream received'))
        return
      }
      window.clearTimeout(timer)
      window.removeEventListener('message', onMessage)
      resolve({
        buffer: data.buffer as ArrayBuffer,
        fileName: String(data.fileName || ''),
        fileType: String(data.fileType || '')
      })
    }

    window.addEventListener('message', onMessage)
  })
}
