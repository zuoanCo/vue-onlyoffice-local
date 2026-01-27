import { ref, onMounted, onUnmounted, watch, inject } from 'vue';
import { loadScript } from '../utils/scriptLoader';
import { initX2T, convertDocument } from '../utils/x2t';
import type { VueOnlyOfficeLocalProps, OnlyOfficeConfig, VueOnlyOfficeLocalOptions } from '../types/index';

declare global {
  interface Window {
    DocsAPI: any;
    DocEditor: any;
  }
}

export function useOnlyOffice(props: VueOnlyOfficeLocalProps, emit: any) {
  const globalOptions = inject<VueOnlyOfficeLocalOptions>('vueOnlyOfficeLocalOptions', {});
  
  const containerRef = ref<HTMLElement | null>(null);
  const editorInstance = ref<any>(null);
  const isLoading = ref(true);
  const error = ref<Error | null>(null);

  const getSdkUrl = () => props.sdkUrl || globalOptions.defaultSdkUrl || 'libs/sdk.js';
  const getX2tUrl = () => props.x2tUrl || globalOptions.defaultX2tUrl || 'libs/x2t.js';

  const initEditor = async () => {
    if (!containerRef.value) return;
    
    isLoading.value = true;
    error.value = null;

    try {
      // 1. Load SDK
      const sdkUrl = getSdkUrl();
      if (!window.DocsAPI && sdkUrl) {
        await loadScript(sdkUrl, 'onlyoffice-sdk');
      }

      if (!window.DocsAPI) {
        throw new Error('OnlyOffice SDK not found. Please provide valid sdkUrl.');
      }

      // 2. Initialize X2T and convert document if it's a local file or a URL we want to convert
      let documentData: { bin: Uint8Array; media?: any } | null = null;
      let fileToConvert: File | null = null;
      
      if (props.file instanceof File) {
          fileToConvert = props.file;
      } else if (typeof props.file === 'string' && props.file.trim() !== '') {
          // Attempt to fetch if it looks like a URL
          try {
              console.log('Fetching document from URL:', props.file);
              const response = await fetch(props.file);
              if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
              
              const blob = await response.blob();
              const urlParts = props.file.split('/');
              const fileName = urlParts[urlParts.length - 1] || 'document.docx';
              
              fileToConvert = new File([blob], fileName, { type: blob.type });
          } catch (e) {
              console.warn('Failed to fetch/convert URL to local file. Falling back to default URL loading.', e);
              // If fetch fails (e.g. CORS), we leave fileToConvert as null.
              // The editor will try to load it via URL in config (standard behavior).
          }
      }

      if (fileToConvert) {
          const x2tUrl = getX2tUrl();
          await initX2T(x2tUrl);
          documentData = await convertDocument(fileToConvert);
      }

      // 3. Initialize Editor
      const id = containerRef.value.id || 'onlyoffice-editor-' + Math.random().toString(36).substr(2, 9);
      containerRef.value.id = id;

      let finalConfig = await prepareConfig();
      
      // Apply middleware hook if present
      if (props.configHook) {
        finalConfig = await props.configHook(finalConfig);
      }
      
      // If we have converted data, we don't set the URL in the config, 
      // but we need to ensure permissions allow editing if intended.
      // And we need to inject the events to open the document.
      
      const onAppReadyOriginal = finalConfig.events?.onAppReady;
      
      finalConfig.events = {
          ...finalConfig.events,
          onAppReady: (e: any) => {
              if (onAppReadyOriginal) {
                  onAppReadyOriginal(e);
              }
              
              if (documentData && editorInstance.value) {
                  // Set media URLs if any
                  if (documentData.media) {
                      editorInstance.value.sendCommand({
                          command: 'asc_setImageUrls',
                          data: { urls: documentData.media },
                      });
                  }
                  
                  // Open the document binary
                  editorInstance.value.sendCommand({
                      command: 'asc_openDocument',
                      data: { buf: documentData.bin },
                  });
              }
          }
      };

      editorInstance.value = new window.DocsAPI.DocEditor(id, finalConfig);

      emit('ready', editorInstance.value);
      isLoading.value = false;

    } catch (err: any) {
      error.value = err;
      emit('error', err);
      isLoading.value = false;
    }
  };

  const prepareConfig = async (): Promise<OnlyOfficeConfig> => {
    // Base config
    const config: OnlyOfficeConfig = {
      document: {
        fileType: props.fileType || (typeof props.file === 'string' ? props.file.split('.').pop() : (props.file instanceof File ? props.file.name.split('.').pop() : 'docx')),
        title: props.fileName || (props.file instanceof File ? props.file.name : 'Document'),
        permissions: {
          edit: true,
          download: true,
        },
        ...globalOptions.globalConfig?.document,
        ...props.config?.document,
      },
      editorConfig: {
        lang: 'en',
        mode: 'edit',
        customization: {
            features: {
                spellcheck: {
                    mode: false,
                }
            }
        },
        ...globalOptions.globalConfig?.editorConfig,
        ...props.config?.editorConfig,
      },
      ...globalOptions.globalConfig,
      ...props.config,
    };

    // If file is provided, we might need to process it.
    if (props.file) {
      if (typeof props.file === 'string') {
        config.document!.url = props.file;
      } 
      // Note: For Blob/File, we don't set url here anymore if we are doing local conversion.
      // We rely on asc_openDocument command.
      // However, OnlyOffice might complain if url is missing in some versions, 
      // so we might set a dummy one or the file name.
      else if (props.file instanceof File) {
          config.document!.url = props.file.name;
      }
    }

    return config;
  };

  const destroyEditor = () => {
    if (editorInstance.value && editorInstance.value.destroyEditor) {
      editorInstance.value.destroyEditor();
    }
    editorInstance.value = null;
  };

  onMounted(() => {
    initEditor();
  });

  onUnmounted(() => {
    destroyEditor();
  });

  watch(() => props.file, () => {
    // Reload editor if file changes
    destroyEditor();
    initEditor();
  });

  return {
    containerRef,
    isLoading,
    error,
    editorInstance,
  };
}
