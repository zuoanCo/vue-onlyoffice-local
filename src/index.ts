import { App, Plugin } from 'vue';
import VueOnlyOfficeLocal from './components/VueOnlyOfficeLocal.vue';
import { useOnlyOffice } from './composables/useOnlyOffice';
import * as types from './types';

// Export components
export { VueOnlyOfficeLocal };

// Export composables
export { useOnlyOffice };

// Export types
export * from './types';

// Vue Plugin definition
const plugin: Plugin = {
  install(app: App, options?: types.VueOnlyOfficeLocalOptions) {
    app.component('VueOnlyOfficeLocal', VueOnlyOfficeLocal);
    if (options) {
      app.provide('vueOnlyOfficeLocalOptions', options);
    }
  },
};

export default plugin;
