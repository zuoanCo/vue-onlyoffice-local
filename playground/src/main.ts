import { createApp } from 'vue';
import App from './App.vue';
import VueOnlyOfficeLocal from 'vue-onlyoffice-local';

const app = createApp(App);

// v2.0.0 loads DocsAPI from `<defaultBaseUrl>/vendor/web-apps/apps/api/documents/api.js`.
// The deprecated v1 `defaultSdkUrl` / `defaultX2tUrl` options are ignored.
app.use(VueOnlyOfficeLocal, {
  defaultBaseUrl: '/',
  globalConfig: {
    editorConfig: { lang: 'zh-CN' },
  },
});

app.mount('#app');
