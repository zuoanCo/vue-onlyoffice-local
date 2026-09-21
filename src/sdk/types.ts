// src/sdk/types.ts
// Vendorized from upstream sweetwisdom/onlyoffice-web-local v2.0.0
// packages/oo-offline/src/types.ts (commit 341f3f3, retrieved 2026-09-21).
// Source: https://github.com/sweetwisdom/onlyoffice-web-local/blob/main/packages/oo-offline/src/types.ts
//
// Local modifications: none. Kept verbatim to match the upstream architecture.

export type DocumentType = 'word' | 'cell' | 'slide' | 'pdf'

/** Single-document input: url / buffer / fileType must be present */
export interface OfficeDocumentInput {
  url?: string
  buffer?: ArrayBuffer | Blob | File
  title: string
  fileType: string
  key?: string
  isForm?: boolean
}

export interface CreateEditorOptions {
  container: HTMLElement | string
  /** Same-origin as the page; must point at the vendor build root. */
  baseUrl: string
  document: OfficeDocumentInput
  lang?: string
  mode?: 'edit' | 'view'
  user?: { id?: string; name?: string }
  width?: string
  height?: string
  onReady?: () => void
  onDocumentReady?: () => void
  onError?: (error: Error) => void
  onStateChange?: (modified: boolean) => void
  onRequestClose?: () => void
  onMetaChange?: (title: string) => void
}

export interface SaveResult {
  buffer: ArrayBuffer
  fileName: string
  fileType: string
}

export interface OfficeEditor {
  save(format?: string): Promise<SaveResult>
  destroy(): void
  getDocEditor(): unknown
}

declare global {
  interface Window {
    DocsAPI?: {
      DocEditor: new (id: string, config: Record<string, unknown>) => {
        destroyEditor: () => void
        downloadAs: (format?: string) => void
        setMetaData?: (meta: { title: string }) => void
      }
    }
    OO_FILE_STREAM_ONLY?: boolean
  }
}

export {}
