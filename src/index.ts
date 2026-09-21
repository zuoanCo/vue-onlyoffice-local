import { App, Plugin } from 'vue';
import VueOnlyOfficeLocal from './components/VueOnlyOfficeLocal.vue';
import { useOnlyOffice } from './composables/useOnlyOffice';
import * as types from './types';

// Re-export the Vue component so consumers can import it as a named member
// without having to also rely on the plugin install() side effect.
export { VueOnlyOfficeLocal };

// Re-export the composable for users that prefer headless usage.
export { useOnlyOffice };

// Re-export every public type so \`vue-tsc\` produces .d.ts for downstream
// consumers (the SDK source is vendored, but re-exported here so consumers
// get a single import surface).
export * from './types';

// Imperative escape hatch: ship the SDK's createEditor + bufferToBlobUrl
// so advanced users can build their own mount flow without using the
// <VueOnlyOfficeLocal> component.
export {
  createEditor,
  bufferToBlobUrl,
  loadApi,
  normalizeExtension,
  detectDocumentType,
  normalizeBaseUrl,
  apiScriptUrl,
  prepareSaveStream,
  beginFileStreamCapture,
  waitForFileStream,
} from './sdk';

export type {
  OfficeDocumentInput,
  OfficeEditor,
  CreateEditorOptions,
  SaveResult,
  DocumentType,
} from './sdk';

/**
 * Plugin definition: registers the <VueOnlyOfficeLocal> component
 * globally and exposes global options via Vue's provide/inject.
 */
const plugin: Plugin = {
  install(app: App, options?: types.VueOnlyOfficeLocalOptions) {
    app.component('VueOnlyOfficeLocal', VueOnlyOfficeLocal);
    if (options) {
      app.provide('vueOnlyOfficeLocalOptions', options);
    }
  },
};

export default plugin;
