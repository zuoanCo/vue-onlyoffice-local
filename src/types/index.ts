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
  [key: string]: any;
}

export interface VueOnlyOfficeLocalProps {
  /**
   * Path to the OnlyOffice Web SDK (api.js/sdk.js).
   * Default: 'libs/sdk.js'
   */
  sdkUrl?: string;

  /**
   * Path to the x2t WASM loader script.
   * Default: 'libs/x2t.js'
   */
  x2tUrl?: string;

  /**
   * The file to open. Can be a URL or a Blob/File object.
   */
  file?: string | Blob | File;

  /**
   * File name (required if file is Blob).
   */
  fileName?: string;

  /**
   * File type (extension, e.g., 'docx').
   * If not provided, inferred from fileName.
   */
  fileType?: string;

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
   * Can be used to inject tokens, change modes, or handle local file conversion logic.
   */
  configHook?: (config: OnlyOfficeConfig) => Promise<OnlyOfficeConfig> | OnlyOfficeConfig;
}

export interface VueOnlyOfficeLocalOptions {
  globalConfig?: OnlyOfficeConfig;
  defaultSdkUrl?: string;
  defaultX2tUrl?: string;
}

export interface VueOnlyOfficeLocalEmits {
  (e: 'ready', editor: any): void;
  (e: 'document-ready'): void;
  (e: 'save', blob: Blob, fileName: string): void;
  (e: 'error', error: Error): void;
}
