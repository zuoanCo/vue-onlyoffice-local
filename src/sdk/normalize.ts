// src/sdk/normalize.ts
// Vendorized from upstream sweetwisdom/onlyoffice-web-local v2.0.0
// packages/oo-offline/src/normalize.ts (commit 341f3f3, retrieved 2026-09-21).
// Source: https://github.com/sweetwisdom/onlyoffice-web-local/blob/main/packages/oo-offline/src/normalize.ts
//
// Local modifications: bilingual header comment block (no behavioral changes).

import type { DocumentType, OfficeDocumentInput } from './types'

const CELL = new Set(['xls', 'xlsx', 'xlsm', 'xlt', 'xltx', 'xltm', 'ods', 'fods', 'csv'])
const SLIDE = new Set(['ppt', 'pptx', 'pptm', 'pot', 'potx', 'potm', 'odp', 'fodp', 'pps', 'ppsx'])
const PDF = new Set(['pdf', 'oxps', 'xps', 'djvu'])

export function normalizeExtension(ext: string): string {
  return String(ext || '').toLowerCase().replace(/^\./, '')
}

export function detectDocumentType(fileType: string): DocumentType {
  const ext = normalizeExtension(fileType)
  if (CELL.has(ext)) return 'cell'
  if (SLIDE.has(ext)) return 'slide'
  if (PDF.has(ext)) return 'pdf'
  return 'word'
}

function hashCode(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return hash
}

export interface NormalizedDocsConfig {
  documentType: DocumentType
  document: {
    url?: string
    title: string
    fileType: string
    key: string
    isForm?: boolean
    permissions: { edit: boolean; download: boolean; print: boolean }
  }
  editorConfig: {
    mode: string
    lang: string
    user: { id: string; name: string }
  }
  width: string
  height: string
  events: Record<string, unknown>
}

export function buildDocsConfig(input: {
  document: OfficeDocumentInput
  lang?: string
  mode?: string
  user?: { id?: string; name?: string }
  width?: string
  height?: string
  events?: Record<string, unknown>
}): NormalizedDocsConfig {
  const fileType = normalizeExtension(input.document.fileType)
  const documentType = detectDocumentType(fileType)
  const title = input.document.title || 'doc.' + (fileType || 'docx')
  const key =
    input.document.key ||
    'doc-' + Math.abs(hashCode((input.document.url || '') + '|' + title + '|' + Date.now()))

  // url can be omitted; the api.js (offline patch) no longer requires it.
  // Real opening requires blob:/http(s):/data: URLs - never pass a bare file name as placeholder.
  const document: NormalizedDocsConfig['document'] = {
    url: input.document.url || undefined,
    title,
    fileType: fileType || 'docx',
    key,
    permissions: { edit: true, download: true, print: true }
  }

  if (documentType === 'pdf' && input.document.isForm === undefined) {
    document.isForm = false
  } else if (input.document.isForm !== undefined) {
    document.isForm = input.document.isForm
  }

  return {
    documentType,
    document,
    editorConfig: {
      mode: input.mode || 'edit',
      lang: input.lang || 'zh-CN',
      user: {
        id: (input.user && input.user.id) || 'local-user',
        name: (input.user && input.user.name) || 'Local User'
      }
    },
    width: input.width || '100%',
    height: input.height || '100%',
    events: input.events || {}
  }
}

/** ArrayBuffer / Blob / File -> temporary blob URL (caller is responsible for revoking). */
export function bufferToBlobUrl(
  data: ArrayBuffer | Blob | File,
  fileType?: string
): string {
  const blob =
    data instanceof Blob
      ? data
      : new Blob([data], { type: mimeOf(fileType) })
  return URL.createObjectURL(blob)
}

function mimeOf(fileType?: string): string {
  const ext = normalizeExtension(fileType || '')
  const map: Record<string, string> = {
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    pdf: 'application/pdf'
  }
  return map[ext] || 'application/octet-stream'
}
