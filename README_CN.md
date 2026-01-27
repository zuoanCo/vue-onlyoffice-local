# Vue OnlyOffice Local

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?logo=github)](https://github.com/zuoanCo/vue-onlyoffice-local)

[English](./README.md) | [中文](./README_CN.md)

一个专业的 Vue 3 插件，用于实现 **纯本地** 的 OnlyOffice 文档编辑功能。本项目基于 [onlyoffice-web-local](https://github.com/sweetwisdom/onlyoffice-web-local) 的架构开发。

此插件允许您在 Vue 3 应用中嵌入全功能的 OnlyOffice 编辑器，而**无需部署后端 Document Server**。它利用 WebAssembly (`x2t-wasm`) 进行文件转换，并使用 OnlyOffice Web SDK 进行渲染。

## 特性

- 🔒 **隐私优先**：不向外部服务器发送任何数据。所有文档处理均在浏览器本地完成。
- 📝 **完整 Vue 3 支持**：使用 TypeScript 和 Composition API 编写。
- ⚡ **响应式**：Props 变化时自动重新加载。
- 🌐 **支持 URL 和本地文件**：可从本地文件输入框加载，也可直接加载远程 URL（需支持 CORS）。
- 🎨 **高度可定制**：通过 props 和 slots 提供丰富的配置选项。
- 📦 **类型安全**：包含完整的 TypeScript 类型定义。

## 安装

```bash
npm install vue-onlyoffice-local
# 或
yarn add vue-onlyoffice-local
# 或
pnpm add vue-onlyoffice-local
```

## 前置要求

要在本地使用此插件，您**必须**将必要的静态资源文件（OnlyOffice SDK 和 x2t-wasm）放置在您的 public 目录下并提供服务。由于这些文件体积较大且属于专有资源，因此无法直接打包在 npm 包中。

1.  在您的项目中创建一个 `public/libs`（或类似名称）文件夹。
2.  将以下文件放入其中（可从 [onlyoffice-web-local](https://github.com/sweetwisdom/onlyoffice-web-local) 获取）：
    *   `sdk.js` (OnlyOffice Web SDK 入口文件)
    *   `x2t.js` & `x2t.wasm` (WebAssembly 转换器)
    *   `sdkjs/` 文件夹 (包含编辑器核心)
    *   `web-apps/` 文件夹 (包含编辑器 UI 应用程序)

> **重要提示**：请确保您的 `sdkUrl` 和 `x2tUrl` props 正确指向这些文件相对于您网站根目录的位置。

## 使用方法

### 全局注册

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
      lang: 'zh-CN', // 设置默认语言为中文
    },
  },
});
app.mount('#app');
```

### 局部注册 (Composition API)

#### 1. 加载本地文件 (通过 `<input type="file">`)

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
  console.log('编辑器已初始化:', editor);
};

const onEditorError = (err: Error) => {
  console.error('编辑器加载失败:', err);
};
</script>
```

#### 2. 加载 URL

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

> **注意**：当从 URL 加载时，如果资源位于不同域名下，该资源必须允许跨域资源共享 (CORS)。

## API 参考

### Props (属性)

| 属性名 | 类型 | 默认值 | 描述 |
|------|------|---------|-------------|
| `file` | `string \| Blob \| File` | `undefined` | 文档源。可以是本地 `File` 对象（来自 input），`Blob` 对象，或者 URL 字符串。 |
| `fileName` | `string` | `undefined` | 文件名（例如 "my-doc.docx"）。如果 `file` 是 Blob，则**必须**提供；否则可选（会从 File 对象或 URL 中推断）。 |
| `fileType` | `string` | 推断值 | 文件扩展名（例如 "docx", "xlsx"）。如果未提供，将从 `fileName` 推断。 |
| `sdkUrl` | `string` | `'libs/sdk.js'` | OnlyOffice SDK 脚本的路径。 |
| `x2tUrl` | `string` | `'libs/x2t.js'` | x2t WASM 加载脚本的路径。 |
| `config` | `OnlyOfficeConfig` | `{}` | 深度合并覆盖 OnlyOffice 内部配置对象。 |
| `theme` | `'light' \| 'dark'` | `'light'` | 编辑器 UI 主题。 |
| `configHook` | `(config) => config` | `undefined` | 中间件函数，用于在初始化前修改最终的配置对象。 |

### Events (事件)

| 事件名 | 载荷 | 描述 |
|-------|---------|-------------|
| `ready` | `(editor: any)` | 当编辑器实例完全初始化并准备就绪时触发。 |
| `document-ready` | `void` | 当文档内容成功加载到编辑器中时触发。 |
| `save` | `(blob: Blob, name: string)` | 当用户点击保存按钮时触发（大多数本地场景需要实现自定义保存逻辑）。 |
| `error` | `(error: Error)` | 当初始化失败、资源丢失或转换错误时触发。 |

### Slots (插槽)

| 插槽名 | 作用域 | 描述 |
|------|-------|-------------|
| `loading` | - | 自定义加载内容，显示在编辑器资源加载和初始化期间。 |
| `error` | `{ error: Error }` | 自定义错误内容，显示在编辑器加载失败时。 |

## 开发

### 项目设置

```bash
npm install
```

### 运行演示 (Dev Server)

```bash
npm run dev:playground
```

### 构建库

```bash
npm run build
```

## 许可证

MIT
