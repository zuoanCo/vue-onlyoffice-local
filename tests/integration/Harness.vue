<template>
  <div class="vue-onlyoffice-local" :class="{ 'is-loading': isLoading, 'has-error': !!error }">
    <div v-if="isLoading" class="vue-onlyoffice-local__loading">Loading Editor...</div>
    <div v-if="error" class="vue-onlyoffice-local__error">Error: {{ error.message }}</div>
    <div ref="containerRef" class="vue-onlyoffice-local__container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, getCurrentInstance } from 'vue';
import { useOnlyOffice } from '../../src/composables/useOnlyOffice';
import type { OfficeEditor } from '../../src/sdk';

const props = defineProps<{
  file: String | Blob | File | null;
  fileName: string;
  fileType: string;
  baseUrl: string;
  configHook: ((cfg: any) => any) | null;
  mode: "edit" | "view";
}>();

const events: any[] = [];
function recordEvent(name: string, ...args: unknown[]) {
  events.push({ name, args });
}

const emitFn = (name: string, ...args: unknown[]) => recordEvent(name, ...args);

const { containerRef, isLoading, error, editorInstance, saveEditor } = useOnlyOffice(
  props as any,
  emitFn as never,
);

declare global {
  interface Window {
    __harness?: any;
    __editorInstance?: OfficeEditor | null;
  }
}

onMounted(() => {
  window.__harness = {
    events,
    triggerSave: saveEditor,
    lastSaveMeta: null,
  };
  const origSave = saveEditor;
  // Wrap triggerSave to record buffer byteLength on window.__harness so
  // Playwright's page.evaluate JSON return can be sanity-checked.
  window.__harness.triggerSave = async (format?: string) => {
    const out = await origSave(format as string | undefined);
    const buf = out && out.buffer;
    window.__harness.lastSaveMeta = {
      hasBuffer: !!buf,
      bytes: buf && buf.byteLength,
      ctor: buf && buf.constructor && buf.constructor.name,
      fileName: out && out.fileName,
      fileType: out && out.fileType,
    };
    return out;
  };
  window.__editorInstance = editorInstance.value;
});

onUnmounted(() => {
  if (window.__harness && window.__harness.events === events) window.__harness = undefined;
  window.__editorInstance = null;
});

defineExpose({ editorInstance, save: saveEditor });
</script>

<style scoped>
.vue-onlyoffice-local { width: 100%; height: 600px; position: relative; display: flex; flex-direction: column; }
.vue-onlyoffice-local__container { flex: 1; width: 100%; height: 100%; min-height: 320px; }
.vue-onlyoffice-local__loading, .vue-onlyoffice-local__error {
  position: absolute; inset: 0; display: flex; justify-content: center; align-items: center;
  background: rgba(255, 255, 255, 0.92); z-index: 10;
}
</style>
