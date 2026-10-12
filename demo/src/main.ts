import { createApp } from 'vue'
import App from './App.vue'
import VueOnlyOfficeLocal from 'vue-onlyoffice-local'
import './style.css'

const app = createApp(App)

// v2 loads DocsAPI from `<defaultBaseUrl>/vendor/web-apps/apps/api/documents/api.js`.
// This demo serves the self-hosted OnlyOffice 9.x offline build from the same origin,
// so the default base URL of '/' is all that is required.
app.use(VueOnlyOfficeLocal, {
  defaultBaseUrl: '/',
  globalConfig: {
    editorConfig: { lang: 'en-US' },
  },
})

app.mount('#app')