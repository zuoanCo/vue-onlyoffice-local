import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import VueOnlyOfficeLocal from '../../../src/components/VueOnlyOfficeLocal.vue';
import * as useOnlyOfficeComposable from '../../../src/composables/useOnlyOffice';

// Mock the composable
vi.mock('../../../src/composables/useOnlyOffice', () => ({
  useOnlyOffice: vi.fn(),
}));

describe('VueOnlyOfficeLocal.vue', () => {
  const mockUseOnlyOffice = {
    containerRef: ref(null),
    isLoading: ref(false),
    error: ref(null),
    editorInstance: ref({ destroyEditor: vi.fn() }),
  };

  beforeEach(() => {
    // We need to return fresh refs for each call to avoid state pollution
    (useOnlyOfficeComposable.useOnlyOffice as any).mockReturnValue({
        containerRef: ref(null),
        isLoading: ref(false),
        error: ref(null),
        editorInstance: ref({ destroyEditor: vi.fn() }),
    });
  });

  it('renders correctly', () => {
    const wrapper = mount(VueOnlyOfficeLocal, {
      props: {
        file: 'test.docx',
      },
    });

    expect(wrapper.classes()).toContain('vue-onlyoffice-local');
    expect(wrapper.find('.vue-onlyoffice-local__container').exists()).toBe(true);
  });

  it('shows loading state', () => {
    (useOnlyOfficeComposable.useOnlyOffice as any).mockReturnValue({
      ...mockUseOnlyOffice,
      isLoading: ref(true),
    });

    const wrapper = mount(VueOnlyOfficeLocal);

    expect(wrapper.classes()).toContain('is-loading');
    expect(wrapper.find('.vue-onlyoffice-local__loading').exists()).toBe(true);
    expect(wrapper.text()).toContain('Loading Editor...');
  });

  it('shows error state', () => {
    const error = new Error('Init failed');
    (useOnlyOfficeComposable.useOnlyOffice as any).mockReturnValue({
      ...mockUseOnlyOffice,
      error: ref(error),
      isLoading: ref(false),
    });

    const wrapper = mount(VueOnlyOfficeLocal);

    expect(wrapper.classes()).toContain('has-error');
    expect(wrapper.find('.vue-onlyoffice-local__error').exists()).toBe(true);
    expect(wrapper.text()).toContain('Error: Init failed');
  });

  it('passes props to composable', () => {
    const props = {
      sdkUrl: 'custom-sdk.js',
      file: 'doc.docx',
      theme: 'dark' as const,
    };

    mount(VueOnlyOfficeLocal, {
      props,
    });

    expect(useOnlyOfficeComposable.useOnlyOffice).toHaveBeenCalledWith(
      expect.objectContaining(props),
      expect.any(Function)
    );
  });

  it('custom slots work', () => {
    (useOnlyOfficeComposable.useOnlyOffice as any).mockReturnValue({
      ...mockUseOnlyOffice,
      isLoading: ref(true),
    });

    const wrapper = mount(VueOnlyOfficeLocal, {
      slots: {
        loading: '<div class="custom-loader">Wait...</div>',
      },
    });

    expect(wrapper.find('.custom-loader').exists()).toBe(true);
    expect(wrapper.text()).toContain('Wait...');
  });
});
