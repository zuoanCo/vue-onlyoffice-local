# Vue OnlyOffice Local

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?logo=github)](https://github.com/zuoanCo/vue-onlyoffice-local)
[![NPM Downloads](https://img.shields.io/npm/dm/@zzk-1015/vue-onlyoffice-local?logo=npm)](https://www.npmjs.com/package/@zzk-1015/vue-onlyoffice-local)

[English](./README.md) | [中文](./README_CN.md)

A Vue 3 plugin for fully local OnlyOffice document editing, aligned with [onlyoffice-web-local v2.0.0](https://github.com/sweetwisdom/onlyoffice-web-local) (oo-offline SDK).

This plugin lets you embed a fully functional OnlyOffice editor in your Vue 3 application **without requiring a backend Document Server**. It bundles the upstream `oo-offline` SDK: documents open as in-memory blob URLs, the editor loads `<baseUrl>/vendor/web-apps/apps/api/documents/api.js` from your self-hosted OnlyOffice 9.x offline vendor build, and saving uses an imperative `editor.save(format?)` that resolves with the file buffer via a `postMessage` file-stream hook.

## Features

- 🔒 **Privacy-First**: No data leaves the browser; the offline vendor build stays on your host.
- 📝 **Full Vue 3 Support**: Written in TypeScript with Composition API.
- ⚡ **Reactive**: Rebuilds the editor when `file`, `mode`, `baseUrl`, or `config` change.
- 🌐 **URL & Local File Support**: Loads documents from `File` / `Blob` / http(s) URL. Remote URLs are converted to blob URLs when CORS allows, and pass through to `document.url` when not.
- 🎛 **Imperative `save()`**: Trigger `editor.save('pdf' | undefined)` via template ref and receive the saved buffer.
- 🪪 **Customizable**: Extensive configuration via props / slots / `configHook` middleware.
- 📦 **Type Safe**: Complete TypeScript definitions; `vue-tsc` clean.

## Installation

```bash
npm install vue-onlyoffice-local
# or
yarn add vue-onlyoffice-local
# or
pnpm add vue-onlyoffice-local
```

## Prerequisites

This plugin requires a self-hosted copy of the OnlyOffice 9.x **offline vendor build**. Concretely, you must serve these assets from the same origin as your Vue app:

- `<baseUrl>/vendor/web-apps/apps/api/documents/api.js` (DocsAPI entry point)
- `<baseUrl>/vendor/sdkjs/` (editor core)
- `<baseUrl>/vendor/web-apps/` (editor UI applications)

The assets come from the upstream `onlyoffice-web-local` release (`html/vendor` directory inside the GitHub release zip). They are roughly 700 MB and are intentionally **not** bundled in this npm package - host them under `<your app>/public/vendor/` (or any same-origin path you point `baseUrl` at).

> ❗ x2t WASM is **no longer required** at the application layer: conversion runs inside the offline editor build (`Offline.js` + browser-resident x2t). The legacy `sdkUrl` / `x2tUrl` props are kept for backward compatibility but are ignored by v2.0.0.

Grab the vendor build from the upstream release: <https://github.com/sweetwisdom/onlyoffice-web-local/releases>.

## Usage

### Global Registration

```typescript
import { createApp } from 'vue';
import VueOnlyOfficeLocal from 'vue-onlyoffice-local';
import 'vue-onlyoffice-local/dist/style.css';

const app = createApp(App);
app.use(VueOnlyOfficeLocal, {
  // SDK loads <defaultBaseUrl>/vendor/web-apps/apps/api/documents/api.js
  defaultBaseUrl: '/',
  globalConfig: {
    editorConfig: { lang: 'en' },
  },
});
app.mount('#app');
```

### Local Registration (Composition API)

#### 1. Loading a Local File (from `<input type="file">`)

```vue
<template>
  <div>
    <input type="file" @change="handleFileChange" accept=".docx,.xlsx,.pptx" />

    <div v-if="file" style="height: 600px;">
      <VueOnlyOfficeLocal
        :file="file"
        :file-name="fileName"
        :base-url="'/'"
        @ready="onEditorReady"
        @error="onEditorError"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { VueOnlyOfficeLocal } from 'vue-onlyoffice-local';

const file = ref<File | null>(null);
const fileName = ref('');

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    file.value = target.files[0];
    fileName.value = target.files[0].name;
  }
};

const onEditorReady = (editor: { save: (fmt?: string) => Promise<unknown> }) => {
  console.log('Editor initialized:', editor);
};

const onEditorError = (err: Error) => {
  console.error('Editor failed:', err);
};
</script>
```

#### 2. Loading from a URL

```vue
<template>
  <div style="height: 600px;">
    <VueOnlyOfficeLocal
      file="https://example.com/documents/report.docx"
      file-name="report.docx"
      :base-url="'/'"
      @ready="onEditorReady"
    />
  </div>
</template>
```

> **Note**: When loading from a URL, the resource must allow Cross-Origin Resource Sharing (CORS). The plugin will try to `fetch` it and turn the bytes into a blob URL; on CORS failure, it falls back to passing the URL through to `document.url` so the editor can load it directly.

## API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `baseUrl` | `string` | `/` | Same-origin URL prefix where the OnlyOffice 9.x offline vendor build is hosted. The SDK loads `<baseUrl>/vendor/web-apps/apps/api/documents/api.js`. |
| `file` | `string | Blob | File` | `undefined` | The document source. `File` / `Blob` opens as an in-memory blob URL; http(s) URLs are fetched and turned into a blob URL when CORS allows; other strings pass through to `document.url`. |
| `fileName` | `string` | `undefined` | Title shown in the editor (e.g., "my-doc.docx"). Inferred from File / URL when omitted. |
| `fileType` | `string` | inferred | Extension (e.g., "docx", "xlsx", "pdf"). Inferred from `fileName` when omitted. |
| `mode` | `'edit' | 'view'` | `'edit'` | Editor mode. |
| `width` | `string` | `'100%'` | CSS width of the editor container. |
| `height` | `string` | `'100%'` | CSS height of the editor container. |
| `config` | `OnlyOfficeConfig` | `{}` | Deep merge override for the internal OnlyOffice config object. |
| `configHook` | `(config) => config | Promise<config>` | `undefined` | Middleware that can rewrite the resolved document (`url`, `fileType`, `title`) and editor config before mounting. |
| `sdkUrl` | `string` | `'libs/sdk.js'` | Deprecated in v2.0.0. Use `baseUrl` + a vendor build. |
| `x2tUrl` | `string` | `'libs/x2t.js'` | Deprecated in v2.0.0. x2t WASM no longer needed. |
| `theme` | `'light' | 'dark'` | `'light'` | Visual hint (kept for slot theming; the offline editor has its own theme toggle). |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `ready` | `(editor: OfficeEditor)` | Editor instance is mounted; the `save()` handle is now usable. |
| `document-ready` | `void` | Document finished loading inside the editor. |
| `state-change` | `(modified: boolean)` | Document dirty state changed. |
| `request-close` | `void` | The user attempted to close the editor. |
| `meta-change` | `(title: string)` | Document title changed. |
| `save` | `(buffer, fileName, fileType)` | Editor finished saving via `downloadAs`. (Available when used inside `configHook` or via the menu.) |
| `error` | `(error: Error)` | Initialization / runtime error. |

### Imperative save (template ref)

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { VueOnlyOfficeLocal } from 'vue-onlyoffice-local';

const editor = ref<InstanceType<typeof VueOnlyOfficeLocal> | null>(null);

async function onSaveClick() {
  const result = await editor.value?.save('pdf');
  if (result) {
    const blob = new Blob([result.buffer], { type: 'application/pdf' });
    // download, upload, etc.
  }
}
</script>

<template>
  <VueOnlyOfficeLocal ref="editor" :file="file" :base-url="'/'" />
  <button @click="onSaveClick">Save as PDF</button>
</template>
```

### Low-level SDK access

The vendored `oo-offline` SDK is also re-exported for advanced users who want to skip the Vue component:

```typescript
import { createEditor, bufferToBlobUrl } from 'vue-onlyoffice-local';

const url = bufferToBlobUrl(file, 'docx');
const editor = await createEditor({
  container: document.getElementById('host')!,
  baseUrl: '/',
  document: { url, fileType: 'docx', title: 'demo.docx' },
});
const { buffer } = await editor.save('docx');
editor.destroy();
URL.revokeObjectURL(url);
```

### Slots

| Slot | Scope | Description |
|------|-------|-------------|
| `loading` | - | Custom content while the editor resources load. |
| `error` | `{ error: Error }` | Custom content if the editor fails to load. |

## Migration from 1.x

This release is a behaviour-changing upgrade. Key differences from 1.0.x:

| 1.0.x | 2.0.0 |
|-------|-------|
| External `libs/sdk.js` + `libs/x2t.js` | Self-hosted OnlyOffice 9.x offline vendor build at `<baseUrl>/vendor/...` |
| Conversion via `x2t.js` WASM + `asc_openDocument({buf})` | Blob URL + `Offline.js` browser-resident x2t |
| Save via legacy `onSave` callback | Imperative `editor.save(format?)` -> `SaveResult` via `postMessage` file-stream hook |
| `sdkUrl`, `x2tUrl` props required | Both deprecated; `baseUrl` is the only required URL prop |

Legacy `sdkUrl` / `x2tUrl` props are still accepted (ignored) so old callers don't crash, but you must serve the new vendor build for the editor to mount.

## Development

### Project Setup

```bash
npm install
```

### Run Playground (Dev Server)

```bash
# 1) Drop the OnlyOffice 9.x offline vendor build into playground/public/vendor/
#    (the upstream release ships an html/vendor/ directory - copy it as-is).
# 2) Start the playground:
npm run dev:playground
```

### Build Library

```bash
npm run build
```

## License

MIT
