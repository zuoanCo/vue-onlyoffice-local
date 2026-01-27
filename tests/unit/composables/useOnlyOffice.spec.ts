import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useOnlyOffice } from '../../../src/composables/useOnlyOffice';
import { ref, nextTick } from 'vue';
import * as scriptLoader from '../../../src/utils/scriptLoader';

// Mock scriptLoader
vi.mock('../../../src/utils/scriptLoader', () => ({
  loadScript: vi.fn().mockResolvedValue(undefined),
}));

describe('useOnlyOffice', () => {
  let mockDocsAPI: any;
  let mockDocEditor: any;

  beforeEach(() => {
    // Reset DOM and Window mocks
    vi.clearAllMocks();
    
    mockDocEditor = {
      destroyEditor: vi.fn(),
    };

    mockDocsAPI = {
      DocEditor: vi.fn().mockImplementation(() => mockDocEditor),
    };

    // Default: DocsAPI exists (simulating already loaded or mocked)
    // For tests that check loading logic, we will explicitly unset it.
    window.DocsAPI = mockDocsAPI;
  });

  it('should initialize editor when mounted', async () => {
    // Simulate SDK not loaded yet
    // @ts-ignore
    delete window.DocsAPI;

    // Mock loadScript to set window.DocsAPI when called
    (scriptLoader.loadScript as any).mockImplementation(async () => {
       window.DocsAPI = mockDocsAPI;
    });

    const props: any = {
      sdkUrl: 'sdk.js',
      file: 'test.docx',
      fileName: 'test.docx',
    };
    
    // Mock container
    const container = document.createElement('div');
    container.id = 'test-container';

    // We need to simulate the component lifecycle manually or mock ref
    // Since useOnlyOffice uses onMounted, we can't easily trigger it without mounting a component.
    // However, we can call initEditor if we expose it or just test the side effects if we could run setup.
    // But testing composables that rely on lifecycle hooks is best done within a test component or using a helper.
    // Here we will mock the lifecycle hooks or just test the returned logic if exposed.
    // Wait, useOnlyOffice does not expose initEditor. It runs it onMounted.
    
    // Strategy: Use a dummy component to test the composable integration
    const { mount } = await import('@vue/test-utils');
    const TestComponent = {
      template: '<div ref="containerRef"></div>',
      setup() {
        const { containerRef, editorInstance, isLoading, error } = useOnlyOffice(props, (name: string, payload: any) => {});
        return { containerRef, editorInstance, isLoading, error };
      }
    };

    const wrapper = mount(TestComponent);
    
    // Wait for async init
    await new Promise(r => setTimeout(r, 0));
    await nextTick();

    expect(scriptLoader.loadScript).toHaveBeenCalledWith('sdk.js', 'onlyoffice-sdk');
    expect(window.DocsAPI.DocEditor).toHaveBeenCalled();
    expect(wrapper.vm.isLoading).toBe(false);
    expect(wrapper.vm.editorInstance).toBeDefined();
  });

  it('should handle initialization errors', async () => {
    // Mock script load failure
    (scriptLoader.loadScript as any).mockRejectedValueOnce(new Error('Network Error'));
    window.DocsAPI = undefined; // Ensure check fails if script doesn't load

    const props: any = { sdkUrl: 'bad-url.js' };
    
    const { mount } = await import('@vue/test-utils');
    const TestComponent = {
      template: '<div ref="containerRef"></div>',
      setup() {
        const emit = vi.fn();
        const result = useOnlyOffice(props, emit);
        return { ...result, emit };
      }
    };

    const wrapper = mount(TestComponent);

    await new Promise(r => setTimeout(r, 0));
    await nextTick();

    expect(wrapper.vm.isLoading).toBe(false);
    expect(wrapper.vm.error).toBeTruthy();
    expect(wrapper.vm.error?.message).toContain('Network Error');
    expect(wrapper.vm.emit).toHaveBeenCalledWith('error', expect.any(Error));
  });

  it('should construct correct config', async () => {
    const props: any = {
      sdkUrl: 'sdk.js',
      file: 'my-file.xlsx',
      fileName: 'test.xlsx',
      fileType: 'xlsx',
      config: {
        editorConfig: {
          lang: 'de',
        }
      }
    };

    const { mount } = await import('@vue/test-utils');
    const TestComponent = {
      template: '<div ref="containerRef"></div>',
      setup() {
        return useOnlyOffice(props, () => {});
      }
    };

    mount(TestComponent);
    await new Promise(r => setTimeout(r, 0));
    await nextTick();

    const callArgs = (window.DocsAPI.DocEditor as any).mock.calls[0];
    const config = callArgs[1];

    expect(config.document.fileType).toBe('xlsx');
    expect(config.document.title).toBe('test.xlsx');
    expect(config.document.url).toBe('my-file.xlsx');
    expect(config.editorConfig.lang).toBe('de');
  });

  it('should apply configHook middleware', async () => {
    const props: any = {
      sdkUrl: 'sdk.js',
      file: 'doc.docx',
      configHook: async (cfg: any) => {
        return {
          ...cfg,
          editorConfig: {
            ...cfg.editorConfig,
            mode: 'view',
          },
          token: 'modified-token'
        };
      }
    };

    const { mount } = await import('@vue/test-utils');
    const TestComponent = {
      template: '<div ref="containerRef"></div>',
      setup() {
        return useOnlyOffice(props, () => {});
      }
    };

    mount(TestComponent);
    await new Promise(r => setTimeout(r, 0));
    await nextTick();

    const callArgs = (window.DocsAPI.DocEditor as any).mock.calls[0];
    const config = callArgs[1];

    expect(config.editorConfig.mode).toBe('view');
    expect(config.token).toBe('modified-token');
  });
});
