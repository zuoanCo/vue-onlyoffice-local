import type { OfficeEditor, SaveResult } from '../sdk';

export type { OfficeEditor, SaveResult } from '../sdk';

/**
 * Public SDK surface (re-exported from src/sdk).
 *  - createEditor: imperative mount
 *  - bufferToBlobUrl: ArrayBuffer / Blob / File -> blob URL
 *  - loadApi: idempotent DocsAPI loader
 *  - normalizeExtension: lowercase the file extension, drop leading dot
 *  - detectDocumentType: 'word' | 'cell' | 'slide' | 'pdf'
 *  - normalizeBaseUrl, apiScriptUrl: same-origin vendor asset helpers
 */
export {
  createEditor,
  bufferToBlobUrl,
  loadApi,
  normalizeExtension,
  detectDocumentType,
  normalizeBaseUrl,
  apiScriptUrl,
} from '../sdk';

export type OfficeDocumentInput =
  import('../sdk').OfficeDocumentInput;

export type CreateEditorOptions =
  import('../sdk').CreateEditorOptions;

export type DocumentType =
  import('../sdk').DocumentType;

/** Backward-compatible Vue config shape (kept for the configHook payload). */
export interface OnlyOfficeConfig {
  document?: {
    fileType?: string;
    key?: string;
    title?: string;
    url?: string;
    permissions?: {
      edit?: boolean;
      download?: boolean;
      print?: boolean;
      review?: boolean;
    };
    isForm?: boolean;
    [key: string]: any;
  };
  editorConfig?: {
    lang?: string;
    mode?: 'edit' | 'view';
    user?: {
      id?: string;
      name?: string;
    };
    customization?: {
      autosave?: boolean;
      forcesave?: boolean;
      [key: string]: any;
    };
    [key: string]: any;
  };
  width?: string | number;
  height?: string | number;
  token?: string;
  [key: string]: any;
}

export interface VueOnlyOfficeLocalProps {
  /**
   * Origin of the OnlyOffice 9.x offline vendor build. The SDK loads
   * \`<baseUrl>/vendor/web-apps/apps/api/documents/api.js\` from here.
   * Defaults to '/'.
   */
  baseUrl?: string;

  /**
   * @deprecated since 2.0.0. Kept for backward compatibility with v1.0.x -
   * the new SDK derives the api.js path from \`baseUrl\`. Use \`baseUrl\`
   * (and host the vendor build at \`<baseUrl>/vendor/...\`) instead.
   */
  sdkUrl?: string;

  /**
   * @deprecated since 2.0.0. X2T WASM is no longer required -
   * conversion is handled inside the offline editor build
   * (Offline.js + browser-resident x2t).
   */
  x2tUrl?: string;

  /**
   * The file to open. Can be an http(s) URL, a Blob, or a File.
   * Strings that are not http(s)/blob:/data: are passed through as
   * \`document.url\` directly.
   */
  file?: string | Blob | File;

  /**
   * File name (required if file is Blob without \`.name\`).
   */
  fileName?: string;

  /**
   * File type (extension, e.g., 'docx'). Inferred from \`fileName\` if omitted.
   */
  fileType?: string;

  /**
   * Editor mode. Defaults to 'edit'.
   */
  mode?: 'edit' | 'view';

  /** Container CSS width (defaults to '100%'). */
  width?: string;

  /** Container CSS height (defaults to '100%'). */
  height?: string;

  /**
   * Additional OnlyOffice configuration.
   */
  config?: OnlyOfficeConfig;

  /**
   * Theme ('light' or 'dark').
   */
  theme?: 'light' | 'dark';

  /**
   * Hook to modify the OnlyOffice config before initialization.
   * Can be used to inject tokens, change modes, or swap document metadata.
   */
  configHook?: (
    config: OnlyOfficeConfig,
  ) => Promise<OnlyOfficeConfig> | OnlyOfficeConfig;
}

export interface VueOnlyOfficeLocalOptions {
  globalConfig?: OnlyOfficeConfig;
  defaultBaseUrl?: string;
  /** @deprecated use defaultBaseUrl + self-hosted vendor build. */
  defaultSdkUrl?: string;
  /** @deprecated not used since 2.0.0. */
  defaultX2tUrl?: string;
}

/**
 * Imperative save() handle exposed via defineExpose(). Returns the same
 * shape as \`editor.save()\` in the upstream oo-offline SDK.
 */
export interface VueOnlyOfficeLocalExpose {
  editorInstance: OfficeEditor | null;
  /**
   * Trigger an imperative save. If \`format\` is provided, asks the editor
   * to downloadAs(<format>) (for example, 'pdf'); otherwise uses the
   * editor's default target format.
   */
  save: (format?: string) => Promise<SaveResult | null>;
}

/**
 * v2.0.0 emit surface - extends the legacy 4 events with state / close / meta.
 */
export interface VueOnlyOfficeLocalEmits {
  (e: 'ready', editor: OfficeEditor): void;
  (e: 'document-ready'): void;
  (e: 'state-change', modified: boolean): void;
  (e: 'request-close'): void;
  (e: 'meta-change', title: string): void;
  (e: 'save', buffer: ArrayBuffer, fileName: string, fileType: string): void;
  (e: 'error', error: Error): void;
}
