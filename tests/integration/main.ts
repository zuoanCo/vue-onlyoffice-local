import { createApp } from 'vue';
import Harness from './Harness.vue';

const app = createApp(Harness, {
  fileName: 'integration-self-test.docx',
  fileType: 'docx',
  baseUrl: '/',
  mode: "edit",
  file: new File([new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1, 2, 3, 4])], "integration-source.docx", {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  }),
  configHook: async (cfg: any) => ({
    ...cfg,
    document: { ...(cfg.document || {}), title: 'overridden-by-configHook.docx' },
  }),
});

app.mount(document.getElementById('app')!);