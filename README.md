# Vue OnlyOffice Local

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?logo=github)](https://github.com/zuoanCo/vue-onlyoffice-local)

[English](./README.md) | [中文](./README_CN.md)

A professional Vue 3 plugin for **purely local** OnlyOffice document editing, based on the architecture of [onlyoffice-web-local](https://github.com/sweetwisdom/onlyoffice-web-local).

This plugin allows you to embed a fully functional OnlyOffice editor in your Vue 3 application **without requiring a backend Document Server**. It leverages WebAssembly (`x2t-wasm`) for file conversion and the OnlyOffice Web SDK for the UI.

## Features

- 🔒 **Privacy-First**: No data sent to external servers. All document processing happens locally in the browser.
- 📝 **Full Vue 3 Support**: Written in TypeScript with Composition API.
- ⚡ **Reactive**: Automatically reloads when props change.
- 🌐 **URL & Local File Support**: Load documents from local file inputs or remote URLs (CORS required).
- � **Customizable**: Extensive configuration options via props and slots.
- 📦 **Type Safe**: Complete TypeScript definitions included.

## Installation

```bash
npm install vue-onlyoffice-local
# or
yarn add vue-onlyoffice-local
# or
pnpm add vue-onlyoffice-local
```

## Prerequisites

To use this plugin locally, you **must** serve the necessary static assets (OnlyOffice SDK and x2t-wasm) from your public directory. These files are too large and proprietary to bundle directly in the npm package.

1.  Create a `public/libs` (or similar) folder in your project.
2.  Place the following files in it (obtainable from [onlyoffice-web-local](https://github.com/sweetwisdom/onlyoffice-web-local)):
    *   `sdk.js` (The OnlyOffice Web SDK entry point)
    *   `x2t.js` & `x2t.wasm` (The WebAssembly converter)
    *   `sdkjs/` folder (Contains the editor core)
    *   `web-apps/` folder (Contains the editor UI applications)

> **Important**: Ensure your `sdkUrl` and `x2tUrl` props point to the correct location of these files relative to your web root.

## Usage

### Global Registration

```typescript
import { createApp } from 'vue';
import VueOnlyOfficeLocal from 'vue-onlyoffice-local';
import 'vue-onlyoffice-local/dist/style.css';

const app = createApp(App);
app.use(VueOnlyOfficeLocal, {
  defaultSdkUrl: '/libs/sdk.js',
  defaultX2tUrl: '/libs/x2t.js',
  globalConfig: {
    editorConfig: {
      lang: 'en',
    },
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
        sdk-url="/libs/sdk.js"
        x2t-url="/libs/x2t.js"
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

const onEditorReady = (editor: any) => {
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
      @ready="onEditorReady"
    />
  </div>
</template>
```

> **Note**: When loading from a URL, the resource must allow Cross-Origin Resource Sharing (CORS) if it's on a different domain.

## API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `file` | `string \| Blob \| File` | `undefined` | The document source. Can be a local `File` object (from input), a `Blob`, or a string URL. |
| `fileName` | `string` | `undefined` | The name of the file (e.g., "my-doc.docx"). **Required** if `file` is a Blob, optional otherwise (inferred from File name or URL). |
| `fileType` | `string` | inferred | The file extension (e.g., "docx", "xlsx"). If not provided, it's inferred from `fileName`. |
| `sdkUrl` | `string` | `'libs/sdk.js'` | Path to the OnlyOffice SDK script. |
| `x2tUrl` | `string` | `'libs/x2t.js'` | Path to the x2t WASM loader script. |
| `config` | `OnlyOfficeConfig` | `{}` | Deep merge override for the internal OnlyOffice config object. |
| `theme` | `'light' \| 'dark'` | `'light'` | Editor UI theme. |
| `configHook` | `(config) => config` | `undefined` | A middleware function to modify the final configuration object before initialization. |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `ready` | `(editor: any)` | Fired when the editor instance is fully initialized and ready. |
| `document-ready` | `void` | Fired when the document content has been successfully loaded into the editor. |
| `save` | `(blob: Blob, name: string)` | Fired when the user clicks the save button (requires implementation of custom save logic in most local cases). |
| `error` | `(error: Error)` | Fired when initialization fails, resources are missing, or conversion errors occur. |

### Slots

| Slot | Scope | Description |
|------|-------|-------------|
| `loading` | - | Custom content to display while the editor resources are loading and initializing. |
| `error` | `{ error: Error }` | Custom content to display if the editor fails to load. |

## Development

### Project Setup

```bash
npm install
```

### Run Playground (Dev Server)

```bash
npm run dev:playground
```

### Build Library

```bash
npm run build
```

## License

MIT
