<template>
  <div class="vue-onlyoffice-local" :class="{ 'is-loading': isLoading, 'has-error': !!error }">
    <div v-if="isLoading" class="vue-onlyoffice-local__loading">
      <slot name="loading">
        <div class="loading-spinner">Loading Editor...</div>
      </slot>
    </div>

    <div v-if="error" class="vue-onlyoffice-local__error">
      <slot name="error" :error="error">
        <div class="error-message">
          Error: {{ error.message }}
        </div>
      </slot>
    </div>

    <div ref="containerRef" class="vue-onlyoffice-local__container"></div>
  </div>
</template>

<script setup lang="ts">
import { useOnlyOffice } from '../composables/useOnlyOffice';
import type { OnlyOfficeConfig } from '../types/index';

export interface VueOnlyOfficeLocalProps {
  sdkUrl?: string;
  x2tUrl?: string;
  file?: string | Blob | File;
  fileName?: string;
  fileType?: string;
  config?: OnlyOfficeConfig;
  theme?: 'light' | 'dark';
  configHook?: (config: OnlyOfficeConfig) => Promise<OnlyOfficeConfig> | OnlyOfficeConfig;
}

export interface VueOnlyOfficeLocalEmits {
  (e: 'ready', editor: any): void;
  (e: 'document-ready'): void;
  (e: 'save', blob: Blob, fileName: string): void;
  (e: 'error', error: Error): void;
}

const props = withDefaults(defineProps<VueOnlyOfficeLocalProps>(), {
  theme: 'light',
});

const emit = defineEmits<VueOnlyOfficeLocalEmits>();

const { containerRef, isLoading, error, editorInstance } = useOnlyOffice(props, emit);

// Expose editor instance to parent
defineExpose({
  editorInstance,
});
</script>

<style scoped>
.vue-onlyoffice-local {
  width: 100%;
  height: 100%;
  position: relative;
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.vue-onlyoffice-local__container {
  flex: 1;
  width: 100%;
  height: 100%;
}

.vue-onlyoffice-local__loading,
.vue-onlyoffice-local__error {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  z-index: 10;
}

.loading-spinner {
  font-family: sans-serif;
  color: #666;
}

.error-message {
  color: #d32f2f;
  padding: 20px;
  background: #ffebee;
  border-radius: 4px;
}
</style>
