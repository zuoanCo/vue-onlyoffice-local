import { createApp } from 'vue';
import App from './App.vue';
import VueOnlyOfficeLocal from 'vue-onlyoffice-local'; 

const app = createApp(App);

app.use(VueOnlyOfficeLocal, {
  defaultSdkUrl: '/web-apps/apps/api/documents/api.js',
  defaultX2tUrl: '/wasm/x2t/x2t.js',
});

app.mount('#app');
