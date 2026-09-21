# Vue OnlyOffice Local (Español)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?logo=github)](https://github.com/zuoanCo/vue-onlyoffice-local)
[![NPM Downloads](https://img.shields.io/npm/dm/@zzk-1015/vue-onlyoffice-local?logo=npm)](https://www.npmjs.com/package/@zzk-1015/vue-onlyoffice-local)

[English](./README.md) | [中文](./README_CN.md) | [Español](./README.es-ES.md)

Plugin de Vue 3 para edición de documentos OnlyOffice **totalmente local**, alineado con [onlyoffice-web-local v2.0.0](https://github.com/sweetwisdom/onlyoffice-web-local) (SDK oo-offline).

Esta versión (2.0.0) replica la arquitectura del upstream: los documentos se abren como URLs blob en memoria, el editor carga `<baseUrl>/vendor/web-apps/apps/api/documents/api.js` desde tu build offline autohospedado de OnlyOffice 9.x, y el guardado usa un `editor.save(formato?)` imperativo que devuelve el buffer del archivo mediante un hook `postMessage`.

## Instalación

```bash
npm install vue-onlyoffice-local
```

## Requisitos previos

Necesitas servir el **build offline de OnlyOffice 9.x** desde el mismo origen que tu app Vue:

- `<baseUrl>/vendor/web-apps/apps/api/documents/api.js`
- `<baseUrl>/vendor/sdkjs/`
- `<baseUrl>/vendor/web-apps/`

Descarga el build desde la release de upstream: <https://github.com/sweetwisdom/onlyoffice-web-local/releases> (directorio `html/vendor/`).

> ❗ Desde 2.0.0 **ya no se requiere x2t WASM** en la capa de aplicación: la conversión corre dentro del editor offline (`Offline.js` + x2t en el navegador). Las props legacy `sdkUrl` / `x2tUrl` se conservan por compatibilidad pero se ignoran.

## Uso

```typescript
import { createApp } from 'vue';
import VueOnlyOfficeLocal from 'vue-onlyoffice-local';
import 'vue-onlyoffice-local/dist/style.css';

const app = createApp(App);
app.use(VueOnlyOfficeLocal, {
  defaultBaseUrl: '/',
  globalConfig: { editorConfig: { lang: 'es-ES' } },
});
app.mount('#app');
```

```vue
<template>
  <div style="height: 600px;">
    <VueOnlyOfficeLocal
      :file="file"
      :file-name="fileName"
      :base-url="'/'"
      :mode="'edit'"
      @ready="onEditorReady"
      @error="onEditorError"
    />
  </div>
</template>
```

## API clave

| Prop | Tipo | Por defecto | Descripción |
|------|------|-------------|-------------|
| `baseUrl` | `string` | `/` | Prefijo URL donde está el build offline de OnlyOffice 9.x. |
| `file` | `string | Blob | File` | `undefined` | Fuente del documento. |
| `mode` | `'edit' | 'view'` | `'edit'` | Modo del editor. |
| `configHook` | función | `undefined` | Middleware para reescribir el documento/configuración antes de montar. |

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `ready` | `(editor: OfficeEditor)` | Editor listo, `save()` disponible. |
| `document-ready` | `void` | Documento cargado. |
| `state-change` | `(modified: boolean)` | Estado modificado. |
| `request-close` | `void` | Cierre solicitado. |
| `meta-change` | `(title: string)` | Título del documento cambió. |
| `error` | `(error: Error)` | Error de inicialización o ejecución. |

## Migración desde 1.x

| 1.0.x | 2.0.0 |
|-------|-------|
| `libs/sdk.js` + `libs/x2t.js` | Build offline OnlyOffice 9.x autohospedado en `<baseUrl>/vendor/...` |
| x2t WASM + `asc_openDocument({buf})` | URL blob + `Offline.js` + x2t del navegador |
| Callback `onSave` | Imperativo `editor.save(formato?)` -> `SaveResult` |
| `sdkUrl`, `x2tUrl` obligatorios | Ambos obsoletos, lo principal es `baseUrl` |

Las props `sdkUrl` / `x2tUrl` se aceptan pero se ignoran. Debes servir el build con el layout nuevo para que el editor cargue.

## Licencia

MIT
