# Vue OnlyOffice Local(本地 OnlyOffice)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?logo=github)](https://github.com/zuoanCo/vue-onlyoffice-local)
[![NPM Downloads](https://img.shields.io/npm/dm/@zzk-1015/vue-onlyoffice-local?logo=npm)](https://www.npmjs.com/package/@zzk-1015/vue-onlyoffice-local)

[English](./README.md) | [中文](./README_CN.md)

一个面向 Vue 3 的 OnlyOffice 文档**纯本地**编辑插件,与 [onlyoffice-web-local v2.0.0](https://github.com/sweetwisdom/onlyoffice-web-local) 的 oo-offline SDK 架构保持一致。

可以在 Vue 3 应用中嵌入功能完整的 OnlyOffice 编辑器,**完全无需后端 Document Server**。本插件捆绑了上游 `oo-offline` SDK:文档以内存 blob URL 形式打开;编辑器从你自托管的 OnlyOffice 9.x 离线构建加载 `<baseUrl>/vendor/web-apps/apps/api/documents/api.js`;保存走命令式 `editor.save(format?)`,通过 `postMessage` 文件流 hook 返回 `SaveResult`。

## 特性

- 🔒 **隐私优先**:浏览器完全离线运行,数据不出本机。
- 📝 **完整 Vue 3 支持**:TypeScript + Composition API。
- ⚡ **响应式**:`file` / `mode` / `baseUrl` / `config` 变化时自动重建。
- 🌐 **URL 与本地文件**:`File` / `Blob` / http(s) URL 一律先尝试转 blob URL(CORS 允许时)。
- 🎛 **命令式 `save()`**:通过 template ref 调用 `editor.save('pdf')`,返回 `SaveResult`。
- 🪪 **易扩展**:`configHook` 中间件可在挂载前改写文档 / 编辑器配置。
- 📦 **类型完备**:完整 TypeScript 定义, `vue-tsc` 通过。

## 安装

```bash
npm install vue-onlyoffice-local
# or
yarn add vue-onlyoffice-local
# or
pnpm add vue-onlyoffice-local
```

## 前置条件

插件需要你自托管 OnlyOffice 9.x **离线构建**(同名同源路径),具体需要这些资源:

- `<baseUrl>/vendor/web-apps/apps/documents/api.js`? 不,是 `<baseUrl>/vendor/web-apps/apps/api/documents/api.js`(DocsAPI 入口)
- `<baseUrl>/vendor/sdkjs/`(编辑器内核)
- `<baseUrl>/vendor/web-apps/`(编辑器 UI 应用)

资产来自上游 `onlyoffice-web-local` 发行版(GitHub Release 的 zip 包内的 `html/vendor/` 目录)。体积约 700 MB,**不**打进本 npm 包。请放到你的项目 `public/vendor/` 下(或任何 `baseUrl` 能指到的同源路径)。

> ❗ 应用层不再需要 x2t WASM:转换由离线构建内的 `Offline.js` + 浏览器内置 x2t 完成。旧版 `sdkUrl` / `x2tUrl` props 为兼容保留,但 v2.0.0 会忽略它们。

下载离线构建: <https://github.com/sweetwisdom/onlyoffice-web-local/releases>

## 使用

### 全局注册

```typescript
import { createApp } from 'vue';
import VueOnlyOfficeLocal from 'vue-onlyoffice-local';
import 'vue-onlyoffice-local/dist/style.css';

const app = createApp(App);
app.use(VueOnlyOfficeLocal, {
  // SDK 从 <defaultBaseUrl>/vendor/web-apps/apps/api/documents/api.js 加载
  defaultBaseUrl: '/',
  globalConfig: {
    editorConfig: { lang: 'zh-CN' },
  },
});
app.mount('#app');
```

### 局部注册(Composition API)

#### 1. 加载本地文件(`<input type="file">`)

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
</script>
```

#### 2. 加载远程 URL

```vue
<template>
  <div style="height: 600px;">
    <VueOnlyOfficeLocal
      file="https://example.com/documents/report.docx"
      file-name="report.docx"
      :base-url="'/'"
    />
  </div>
</template>
```

> **注意**:跨域 URL 需要服务端开启 CORS。本插件会先尝试 `fetch` 并转 blob URL;失败时回退到把 URL 直接交给 `document.url`,由编辑器自行加载。

## API 参考

### Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `baseUrl` | `string` | `/` | 同源 URL 前缀,指向 OnlyOffice 9.x 离线构建。SDK 加载 `<baseUrl>/vendor/web-apps/apps/api/documents/api.js`。 |
| `file` | `string | Blob | File` | `undefined` | 文档源。`File` / `Blob` 直接转 blob URL;http(s) URL 优先 fetch + blob URL(CORS 失败则透传)。 |
| `fileName` | `string` | 自动推断 | 编辑器内显示的标题。 |
| `fileType` | `string` | 自动推断 | 扩展名("docx" / "xlsx" / "pdf")。 |
| `mode` | `'edit' | 'view'` | `'edit'` | 编辑模式。 |
| `width` | `string` | `'100%'` | 容器宽度。 |
| `height` | `string` | `'100%'` | 容器高度。 |
| `config` | `OnlyOfficeConfig` | `{}` | 深度合并覆盖 OnlyOffice 配置。 |
| `configHook` | `(config) => config | Promise<config>` | `undefined` | 中间件,可在挂载前改写文档/编辑器配置。 |
| `sdkUrl` | `string` | `'libs/sdk.js'` | **已废弃**,请使用 `baseUrl` + 离线构建。 |
| `x2tUrl` | `string` | `'libs/x2t.js'` | **已废弃**,x2t WASM 已不再需要。 |

### 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `ready` | `(editor: OfficeEditor)` | 编辑器挂载完成,可调用 `save()`。 |
| `document-ready` | `void` | 文档在编辑器内加载完成。 |
| `state-change` | `(modified: boolean)` | 文档脏状态变化。 |
| `request-close` | `void` | 用户尝试关闭。 |
| `meta-change` | `(title: string)` | 文档标题变化。 |
| `save` | `(buffer, fileName, fileType)` | 通过 `downloadAs` 保存完成(可走 `configHook` 或菜单)。 |
| `error` | `(error: Error)` | 初始化 / 运行时错误。 |

### 命令式 save(template ref)

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { VueOnlyOfficeLocal } from 'vue-onlyoffice-local';

const editor = ref<InstanceType<typeof VueOnlyOfficeLocal> | null>(null);

async function onSaveClick() {
  const result = await editor.value?.save('pdf');
  if (result) {
    const blob = new Blob([result.buffer], { type: 'application/pdf' });
    // 上传到服务器 / 触发下载等
  }
}
</script>

<template>
  <VueOnlyOfficeLocal ref="editor" :file="file" :base-url="'/'" />
  <button @click="onSaveClick">导出 PDF</button>
</template>
```

### 直接使用 SDK(跳过 Vue 组件)

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

### 插槽

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `loading` | - | 编辑器加载中的自定义内容。 |
| `error` | `{ error: Error }` | 编辑器加载失败的自定义内容。 |

## 从 1.x 迁移

本版本是行为不兼容的升级,与 1.0.x 的主要差异:

| 1.0.x | 2.0.0 |
|-------|-------|
| 外部 `libs/sdk.js` + `libs/x2t.js` | 自托管 OnlyOffice 9.x 离线构建,位于 `<baseUrl>/vendor/...` |
| `x2t.js` WASM + `asc_openDocument({buf})` | blob URL + `Offline.js` + 浏览器内置 x2t |
| 通过 `onSave` 回调获取保存 | 命令式 `editor.save(format?)` -> `SaveResult`(`postMessage` 文件流 hook) |
| `sdkUrl` / `x2tUrl` 必须 | 两者均已废弃,核心是 `baseUrl` |

旧的 `sdkUrl` / `x2tUrl` 仍然接受(忽略),避免老调用方崩溃;但必须按新布局托管 vendor 构建,编辑器才能挂载。

## 开发

### 项目初始化

```bash
npm install
```

### 运行 Playground

```bash
# 1) 把 OnlyOffice 9.x 离线构建放到 playground/public/vendor/
#    (上游 release 包内的 html/vendor/ 目录直接复制即可)
# 2) 启动 playground:
npm run dev:playground
```

### 构建

```bash
npm run build
```

## 协议

MIT
