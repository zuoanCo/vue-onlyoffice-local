import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useOnlyOffice } from '../../../src/composables/useOnlyOffice';
import { ref, nextTick, defineComponent, h } from 'vue';
import type { OfficeEditor } from '../../../src/sdk';

import * as sdkModule from '../../../src/sdk';

// Mock the SDK so the createEditor() entry point can be observed without
// touching the real Editor's iframe / docsapi.js loading chain.
vi.mock('../../../src/sdk', async () => {
  const actual = await vi.importActual<typeof import('../../../src/sdk')>(
    '../../../src/sdk',
  );
  return {
    ...actual,
    createEditor: vi.fn(),
    loadApi: vi.fn().mockResolvedValue(undefined),
    bufferToBlobUrl: vi.fn().mockReturnValue('blob:mock-url'),
  };
});

const createEditorMock = sdkModule.createEditor as unknown as ReturnType<typeof vi.fn>;

function buildTestHarness(props: Record<string, unknown>, emit?: (name: string, ...args: unknown[]) => void) {
  return defineComponent({
    template: '<div ref="containerRef"></div>',
    setup() {
      return useOnlyOffice(
        props as never,
        (emit ?? (() => {})) as never,
      );
    },
  });
}

describe('useOnlyOffice (v2.0.0 / oo-offline SDK)', () => {
  let mockEditor: OfficeEditor;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEditor = {
      save: vi.fn().mockResolvedValue({
        buffer: new ArrayBuffer(8),
        fileName: 'mock.docx',
        fileType: 'docx',
      }),
      destroy: vi.fn(),
      getDocEditor: vi.fn(),
    };
    createEditorMock.mockResolvedValue(mockEditor);
    // jsdom lacks .querySelector('iframe') etc.; nothing to reset.
  });

  it('mounts the editor via createEditor() and exposes the imperative handle', async () => {
    const props = {
      baseUrl: '/',
      fileName: 'hello.docx',
      fileType: 'docx',
    };

    const { mount } = await import('@vue/test-utils');
    const wrapper = mount(buildTestHarness(props));
    await new Promise((r) => setTimeout(r, 0));
    await nextTick();

    expect(createEditorMock).toHaveBeenCalledTimes(1);
    const opts = createEditorMock.mock.calls[0][0];
    expect(opts.baseUrl).toBe('/');
    expect(opts.document.fileType).toBe('docx');
    expect(opts.document.title).toBe('hello.docx');
    expect(typeof opts.onReady).toBe('function');
    expect(typeof opts.onDocumentReady).toBe('function');
    expect(typeof opts.onError).toBe('function');
    expect(typeof opts.onStateChange).toBe('function');
    expect(typeof opts.onRequestClose).toBe('function');
    expect(typeof opts.onMetaChange).toBe('function');

    const inst = (wrapper.vm as unknown as { editorInstance: { save: unknown; destroy: unknown } }).editorInstance;
    expect(typeof inst.save).toBe('function');
    expect(typeof inst.destroy).toBe('function');

    wrapper.unmount();
    expect(mockEditor.destroy).toHaveBeenCalled();
  });

  it('turns a Blob / File into a blob URL through bufferToBlobUrl()', async () => {
    const file = new File(['hello world'], 'note.txt', { type: 'text/plain' });
    const props = {
      baseUrl: '/',
      file,
    };

    const { mount } = await import('@vue/test-utils');
    mount(buildTestHarness(props));
    await new Promise((r) => setTimeout(r, 0));
    await nextTick();

    expect(sdkModule.bufferToBlobUrl).toHaveBeenCalled();
    const opts = createEditorMock.mock.calls[0][0];
    expect(opts.document.url).toBe('blob:mock-url');
    expect(opts.document.fileType).toBe('txt');
    expect(opts.document.title).toBe('note.txt');
  });

  it('handles createEditor() rejection and surfaces it via the emit', async () => {
    createEditorMock.mockRejectedValueOnce(new Error('Network Error'));
    const emit = vi.fn();

    const { mount } = await import('@vue/test-utils');
    const wrapper = mount(buildTestHarness({}, emit));
    await new Promise((r) => setTimeout(r, 0));
    await nextTick();

    expect((wrapper.vm as unknown as { isLoading: boolean }).isLoading).toBe(false);
    const err = (wrapper.vm as unknown as { error: Error | null }).error;
    expect(err).toBeTruthy();
    expect(err?.message).toBe('Network Error');
    expect(emit).toHaveBeenCalledWith('error', expect.any(Error));
  });

  it('lets configHook mutate the resolved document fields', async () => {
    const props = {
      baseUrl: '/',
      fileName: 'a.docx',
      fileType: 'docx',
      configHook: async (cfg: { document?: Record<string, unknown> }) => ({
        ...cfg,
        document: {
          ...(cfg.document || {}),
          title: 'overridden.docx',
          url: 'https://example.com/overridden.docx',
        },
      }),
    };

    const { mount } = await import('@vue/test-utils');
    mount(buildTestHarness(props));
    await new Promise((r) => setTimeout(r, 0));
    await nextTick();

    const opts = createEditorMock.mock.calls[0][0];
    expect(opts.document.title).toBe('overridden.docx');
    expect(opts.document.url).toBe('https://example.com/overridden.docx');
  });

  it('passes mode=view through to createEditor()', async () => {
    const props = {
      baseUrl: '/',
      fileName: 'a.docx',
      mode: 'view' as const,
    };

    const { mount } = await import('@vue/test-utils');
    mount(buildTestHarness(props));
    await new Promise((r) => setTimeout(r, 0));
    await nextTick();

    const opts = createEditorMock.mock.calls[0][0];
    expect(opts.mode).toBe('view');
  });
});
