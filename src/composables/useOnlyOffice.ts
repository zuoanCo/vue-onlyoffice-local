import { ref, onMounted, onUnmounted, watch, inject } from 'vue';
import {
  createEditor,
  bufferToBlobUrl,
  normalizeExtension,
  type OfficeEditor,
  type SaveResult,
} from '../sdk';
import type {
  VueOnlyOfficeLocalProps,
  OnlyOfficeConfig,
  VueOnlyOfficeLocalOptions,
} from '../types/index';

/**
 * Vue 3 composable that wraps the upstream createEditor() imperative API
 * (vendored under src/sdk/) so existing plugin props keep working while the
 * underlying editor follows the v2.0.0 oo-offline architecture:
 *  - DocsAPI (api.js) loaded from <baseUrl>/vendor/web-apps/apps/api/documents/api.js
 *  - local File / Blob opened as a blob URL via bufferToBlobUrl() (no X2T WASM)
 *  - imperative editor.save() returns a SaveResult via postMessage file-stream hook
 *  - state / request-close / meta events are surfaced as Vue emits
 */
export function useOnlyOffice(
  props: VueOnlyOfficeLocalProps,
  emit: (event: string, ...args: unknown[]) => void,
) {
  const globalOptions = inject<VueOnlyOfficeLocalOptions>(
    'vueOnlyOfficeLocalOptions',
    {},
  );

  const containerRef = ref<HTMLElement | null>(null);
  const editorInstance = ref<OfficeEditor | null>(null);
  const ownedBlobUrl = ref<string | null>(null);
  const isLoading = ref(true);
  const error = ref<Error | null>(null);

  const resolveBaseUrl = (): string =>
    props.baseUrl ?? globalOptions.defaultBaseUrl ?? '/';

  /** @deprecated kept for backward compatibility with v1.0.x; not used by the new SDK. */
  const getSdkUrl = (): string =>
    props.sdkUrl ?? globalOptions.defaultSdkUrl ?? 'libs/sdk.js';

  /** @deprecated kept for backward compatibility with v1.0.x; x2t WASM is no longer required. */
  const getX2tUrl = (): string =>
    props.x2tUrl ?? globalOptions.defaultX2tUrl ?? 'libs/x2t.js';

  const detectFileType = (): string => {
    if (props.fileType) return normalizeExtension(props.fileType);
    if (typeof props.file === 'string') {
      return normalizeExtension(props.file.split('.').pop() || '');
    }
    if (props.file instanceof File || props.file instanceof Blob) {
      const name = (props.file as File).name || '';
      return normalizeExtension(name.split('.').pop() || '');
    }
    return 'docx';
  };

  const resolveTitle = (): string => {
    if (props.fileName) return props.fileName;
    if (typeof props.file === 'string') {
      const segs = props.file.split('?')[0].split('/');
      return segs[segs.length - 1] || 'Document';
    }
    if (props.file instanceof File) return props.file.name || 'Document';
    return 'Document';
  };

  const resolveUser = (): { id?: string; name?: string } => {
    const fromGlobal =
      (globalOptions.globalConfig?.editorConfig?.user as
        | { id?: string; name?: string }
        | undefined) || {};
    const fromProps =
      (props.config?.editorConfig?.user as
        | { id?: string; name?: string }
        | undefined) || {};
    return { ...fromGlobal, ...fromProps };
  };

  const buildBaseConfig = (): OnlyOfficeConfig => ({
    document: {
      fileType: detectFileType(),
      title: resolveTitle(),
      permissions: {
        edit: props.mode !== 'view',
        download: true,
        print: true,
      },
      ...globalOptions.globalConfig?.document,
      ...props.config?.document,
    },
    editorConfig: {
      lang: 'zh-CN',
      mode: props.mode === 'view' ? 'view' : 'edit',
      user: resolveUser(),
      ...globalOptions.globalConfig?.editorConfig,
      ...props.config?.editorConfig,
    },
    width: props.width ?? '100%',
    height: props.height ?? '100%',
    ...globalOptions.globalConfig,
    ...props.config,
  });

  const resolveDocumentForSdk = async (): Promise<{
    url?: string;
    fileType: string;
    title: string;
  }> => {
    const base = buildBaseConfig();
    const baseDoc = base.document || {};
    const fileType = baseDoc.fileType || detectFileType();
    const title = baseDoc.title || resolveTitle();

    if (typeof props.file === 'string') {
      const raw = props.file.trim();
      if (/^https?:\/\//i.test(raw) || raw.startsWith('blob:') || raw.startsWith('data:')) {
        try {
          const res = await fetch(raw);
          if (res.ok) {
            const blob = await res.blob();
            const url = bufferToBlobUrl(
              blob,
              normalizeExtension(fileType || blob.type || ''),
            );
            ownedBlobUrl.value = url;
            return { url, fileType, title };
          }
        } catch (err) {
          console.warn(
            '[vue-onlyoffice-local] fetch+blobUrl failed, falling back to URL:',
            err,
          );
        }
      }
      return { url: raw, fileType, title };
    }

    if (props.file instanceof Blob) {
      const url = bufferToBlobUrl(
        props.file,
        normalizeExtension(fileType || props.file.type || ''),
      );
      ownedBlobUrl.value = url;
      return { url, fileType, title };
    }

    return { fileType, title };
  };

  const initEditor = async () => {
    if (!containerRef.value) return;
    isLoading.value = true;
    error.value = null;

    try {
      const baseUrl = resolveBaseUrl();

      let documentPayload = await resolveDocumentForSdk();

      if (props.configHook && documentPayload) {
        const cfgBase = buildBaseConfig();
        const mutated = await props.configHook(cfgBase);
        if (mutated && mutated.document) {
          documentPayload = {
            url: mutated.document.url ?? documentPayload.url,
            fileType: normalizeExtension(
              mutated.document.fileType || documentPayload.fileType,
            ),
            title: mutated.document.title || documentPayload.title,
          };
        }
      }

      const id =
        containerRef.value.id ||
        'onlyoffice-editor-' + Math.random().toString(36).slice(2, 11);
      containerRef.value.id = id;

      const editor = await createEditor({
        container: containerRef.value,
        baseUrl,
        document: documentPayload,
        lang:
          props.config?.editorConfig?.lang ??
          globalOptions.globalConfig?.editorConfig?.lang ??
          'zh-CN',
        mode: props.mode,
        user: resolveUser(),
        width: props.width,
        height: props.height,
        onReady: () => {
          emit('ready', editor);
        },
        onDocumentReady: () => {
          isLoading.value = false;
          emit('document-ready');
        },
        onError: (err: Error) => {
          error.value = err;
          isLoading.value = false;
          emit('error', err);
        },
        onStateChange: (modified: boolean) => {
          emit('state-change', modified);
        },
        onRequestClose: () => {
          emit('request-close');
        },
        onMetaChange: (newTitle: string) => {
          emit('meta-change', newTitle);
        },
      });

      editorInstance.value = editor;
      emit('ready', editor);
      isLoading.value = false;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      error.value = e;
      emit('error', e);
      isLoading.value = false;
    }
  };

  const saveEditor = async (format?: string): Promise<SaveResult | null> => {
    if (!editorInstance.value) return null;
    return editorInstance.value.save(format);
  };

  const destroyEditor = () => {
    try {
      editorInstance.value?.destroy();
    } catch {
      /* ignore */
    }
    editorInstance.value = null;
    if (ownedBlobUrl.value) {
      try {
        URL.revokeObjectURL(ownedBlobUrl.value);
      } catch {
        /* ignore */
      }
      ownedBlobUrl.value = null;
    }
  };

  onMounted(() => {
    void initEditor();
  });

  onUnmounted(() => {
    destroyEditor();
  });

  watch(
    () => [
      props.file,
      props.fileName,
      props.fileType,
      props.config,
      props.mode,
      props.baseUrl,
    ],
    () => {
      destroyEditor();
      void initEditor();
    },
    { deep: true },
  );

  return {
    containerRef,
    isLoading,
    error,
    editorInstance,
    saveEditor,
  };
}
