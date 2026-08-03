# Vue OnlyOffice Local

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?logo=github)](https://github.com/zuoanCo/vue-onlyoffice-local)
[![NPM Downloads](https://img.shields.io/npm/dm/@zzk-1015/vue-onlyoffice-local?logo=npm)](https://www.npmjs.com/package/@zzk-1015/vue-onlyoffice-local)

[English](./README.md) | [中文](./README_CN.md)

Un plugin profesional para Vue 3 que permite la **edición de documentos OnlyOffice de forma local**, basado en la arquitectura de [onlyoffice-web-local](https://github.com/sweetwisdom/onlyoffice-web-local).

Este plugin le permite incrustar un editor de OnlyOffice completamente funcional en su aplicación Vue 3 **sin necesidad de un servidor Documento en el backend**. Utiliza WebAssembly (`x2t-wasm`) para la conversión de archivos y el SDK Web de OnlyOffice para la interfaz de usuario.

## Características

- 🔒 **Enfoque en Privacidad**: No se envían datos a servidores externos. Todo el procesamiento de documentos ocurre localmente en el navegador.
- 📝 **Soporte Completo para Vue 3**: Escrito en TypeScript con API de Composición.
- ⚡ **Reactivo**: Recarga automáticamente cuando cambian las propiedades.
- 🌐 **Soporte para URLs y Archivos Locales**: Cargue documentos desde entradas de archivo locales o URLs remotas (se requiere CORS).
-  **Personalizable**: Opciones de configuración extensas mediante props y slots.
- 📦 **Tipado Seguro**: Definiciones de TypeScript completas incluidas.

## Instalación

```bash
npm install vue-onlyoffice-local
# o
yarn add vue-onlyoffice-local
# o
pnpm add vue-onlyoffice-local
```

## Requisitos Previos

Para usar este plugin localmente, **debe** servir los activos estáticos necesarios (SDK de OnlyOffice y x2t-wasm) desde su directorio público. Estos archivos son demasiado grandes y propietarios para incluirlos directamente en el paquete npm.

1. Cree una carpeta `public/libs` (o similar) en su proyecto.
2. Coloque los siguientes archivos en ella (obtenibles de [onlyoffice-web-local](https://github.com/sweetwisdom/onlyoffice-web-local)):
    *   `sdk.js` (Punto de entrada del SDK de OnlyOffice Web)
    *   `x2t.js` y `x2t.wasm` (El conversor WebAssembly)
    *   Carpeta `sdkjs/` (Contiene el núcleo del editor)
    *   Carpeta `web-apps/` (Contiene las aplicaciones de interfaz del editor)

> **Importante**: Asegúrese de que sus props `sdkUrl` y `x2tUrl` apunten a la ubicación correcta de estos archivos relativamente a su raíz web.

## Uso

### Registro Global

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

### Registro Local (API de Composición)

#### 1. Cargando un Archivo Local (desde `<input type="file">`)

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

#### 2. Cargando desde una URL

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

> **Nota**: Al cargar desde una URL, el recurso debe permitir Compartir Recursos de Origen Cruzado (CORS) si se encuentra en un dominio diferente.

## Referencia de API

### Props

| Prop | Tipo | Por Defecto | Descripción |
|------|------|---------|-------------|
| `file` | `string \| Blob \| File` | `undefined` | El origen del documento. Puede ser un objeto `File` local (desde input), un `Blob`, o una cadena URL. |
| `fileName` | `string` | `undefined` | El nombre del archivo (ejemplo: "mi-doc.docx"). **Requerido** si `file` es un Blob, opcional de lo contrario (inferido del nombre del Archivo o URL). |
| `fileType` | `string` | inferido | La extensión del archivo (ejemplo: "docx", "xlsx"). Si no se proporciona, se infiere de `fileName`. |
| `sdkUrl` | `string` | `'libs/sdk.js'` | Ruta al script del SDK de OnlyOffice. |
| `x2tUrl` | `string` | `'libs/x2t.js'` | Ruta al cargador de script WASM x2t. |
| `config` | `OnlyOfficeConfig` | `{}` | Anulación profunda del objeto de configuración interno de OnlyOffice. |
| `theme` | `'light' \| 'dark'` | `'light'` | Tema de interfaz de usuario del editor. |
| `configHook` | `(config) => config` | `undefined` | Una función middleware para modificar el objeto de configuración final antes de la inicialización. |

### Eventos

| Evento | Payload | Descripción |
|-------|---------|-------------|
| `ready` | `(editor: any)` | Se dispara cuando la instancia del editor está completamente inicializada y lista. |
| `document-ready` | `void` | Se dispara cuando el contenido del documento se ha cargado con éxito en el editor. |
| `save` | `(blob: Blob, name: string)` | Se dispara cuando el usuario hace clic en el botón de guardar (requiere implementación de lógica de guardado personalizada en la mayoría de los casos locales). |
| `error` | `(error: Error)` | Se dispara cuando falla la inicialización, faltan recursos, o ocurren errores de conversión. |

### Slots

| Slot | Scope | Descripción |
|------|-------|-------------|
| `loading` | - | Contenido personalizado a mostrar mientras se cargan e inicializan los recursos del editor. |
| `error` | `{ error: Error }` | Contenido personalizado a mostrar si el editor falla en cargar. |

## Desarrollo

### Configuración del Proyecto

```bash
npm install
```

### Ejecutar Playground (Servidor de Desarrollo)

```bash
npm run dev:playground
```

### Construir la Biblioteca

```bash
npm run build
```

## Licencia

MIT
