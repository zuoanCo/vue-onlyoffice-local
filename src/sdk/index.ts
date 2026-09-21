// src/sdk/index.ts
// Vendorized from upstream sweetwisdom/onlyoffice-web-local v2.0.0
// packages/oo-offline/src/index.ts (commit 341f3f3, retrieved 2026-09-21).
// Source: https://github.com/sweetwisdom/onlyoffice-web-local/blob/main/packages/oo-offline/src/index.ts
//
// Local modifications: bilingual header comment block (no behavioral changes).

export { loadApi, normalizeBaseUrl, apiScriptUrl } from './loadApi'
export {
  buildDocsConfig,
  bufferToBlobUrl,
  detectDocumentType,
  normalizeExtension
} from './normalize'
export { createEditor } from './createEditor'
export { prepareSaveStream, beginFileStreamCapture, waitForFileStream } from './saveStream'
export type {
  CreateEditorOptions,
  DocumentType,
  OfficeDocumentInput,
  OfficeEditor,
  SaveResult
} from './types'
