<template>
  <div class="playground">
    <header>
      <h1>Vue OnlyOffice Local Playground</h1>
      <div class="controls">
        <label>
          baseUrl
          <input v-model.trim="baseUrl" class="url-input base-input" placeholder="/" @change="checkAssets" />
        </label>
        <button @click="checkAssets">Check assets</button>
        <div class="input-group">
          <input v-model="inputUrl" placeholder="Document URL" class="url-input" @keyup.enter="loadUrl" />
          <button @click="loadUrl">Load URL</button>
        </div>
        <span class="divider">OR</span>
        <input type="file" @change="handleFileChange" accept=".docx,.xlsx,.pptx,.pdf" />
      </div>
    </header>

    <main>
      <div v-if="missingAssets" class="error-screen">
        <h2>⚠️ Missing offline assets</h2>
        <p v-if="assetStatus">
          <code>{{ assetStatus }}</code>
        </p>
        <div class="instructions">
          <p>v2 loads DocsAPI from a single entry point. Make sure this URL returns 200:</p>
          <ul>
            <li><code>{{ apiUrl }}</code></li>
            <li><code>{{ sdkUrlForBase }}</code> (editor kernel, folder)</li>
            <li><code>{{ normalizeBase(baseUrl) }}vendor/web-apps/</code> (editor UI, folder)</li>
          </ul>
          <p>
            Get the offline build from
            <a href="https://github.com/sweetwisdom/onlyoffice-web-local/releases" target="_blank" rel="noreferrer">
              onlyoffice-web-local releases</a>
            (<code>html.zip</code>, ~700 MB) and copy its <code>vendor/</code> folder into
            <code>public/vendor/</code>.
          </p>
          <p>
            Note: <code>public/libs/sdk.js</code> was the <strong>v1</strong> layout. No OnlyOffice
            release ships a file called <code>sdk.js</code>, and v2 no longer needs x2t.
          </p>
        </div>
        <button class="retry-btn" @click="checkAssets">Re-check</button>
      </div>

      <div v-else-if="!file" class="placeholder">
        Pick a document or paste a URL.
        <p class="hint">baseUrl = <code>{{ baseUrl || '/' }}</code> → DocsAPI at <code>{{ apiUrl }}</code></p>
      </div>

      <VueOnlyOfficeLocal
        v-else
        :key="editorKey"
        :file="file"
        :file-name="fileName"
        :base-url="baseUrl || '/'"
        style="height: 100%; width: 100%"
        @ready="onEditorReady"
        @document-ready="onDocumentReady"
        @error="onEditorError"
      >
        <template #loading>
          <div class="custom-loading">Initializing local editor…</div>
        </template>
        <template #error="{ error }">
          <div class="component-error">
            <h3>Editor error</h3>
            <p>{{ error.message }}</p>
            <button class="retry-btn" @click="reload">Retry</button>
          </div>
        </template>
      </VueOnlyOfficeLocal>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { VueOnlyOfficeLocal, normalizeBaseUrl } from 'vue-onlyoffice-local';

const file = ref<File | string | null>(null);
const fileName = ref('');
const baseUrl = ref('/');
const editorKey = ref(0);
const missingAssets = ref(false);
const assetStatus = ref('');
const inputUrl = ref('');

const normalizeBase = (value: string) => normalizeBaseUrl(value || '/');
const apiUrl = () => normalizeBase(baseUrl.value) + 'vendor/web-apps/apps/api/documents/api.js';
const sdkUrlForBase = () => normalizeBase(baseUrl.value) + 'vendor/sdkjs/';

function describe(status: number, ok: boolean) {
  if (ok) return `200 OK — ${apiUrl()}`;
  if (status === 0) return `unreachable — ${apiUrl()}`;
  return `${status} — ${apiUrl()}`;
}

/** Probe the real entry point instead of pattern-matching error strings. */
async function checkAssets() {
  try {
    const res = await fetch(apiUrl(), { method: 'GET', cache: 'no-store' });
    missingAssets.value = !res.ok;
    assetStatus.value = describe(res.status, res.ok);
  } catch {
    missingAssets.value = true;
    assetStatus.value = describe(0, false);
  }
  return !missingAssets.value;
}

async function prepare() {
  file.value = null;
  const ok = await checkAssets();
  if (ok) editorKey.value += 1;
}

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  if (!target.files || !target.files[0]) return;
  file.value = target.files[0];
  fileName.value = target.files[0].name;
}

async function loadUrl() {
  if (!inputUrl.value.trim()) return;
  file.value = null;
  const ok = await checkAssets();
  if (!ok) return;
  file.value = inputUrl.value.trim();
  fileName.value = inputUrl.value.trim().split('/').pop() || 'document.docx';
  editorKey.value += 1;
}

function onEditorReady() {
  console.log('[playground] editor ready');
}
function onDocumentReady() {
  console.log('[playground] document ready');
}
function onEditorError(err: Error) {
  console.error('[playground] editor error:', err.message);
}
function reload() {
  editorKey.value += 1;
}

checkAssets();
</script>

<style>
body {
  margin: 0;
  font-family: sans-serif;
  background: #f5f5f5;
}
.playground {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
header {
  padding: 1rem;
  background: white;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}
h1 {
  margin: 0;
  font-size: 1.2rem;
}
.controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}
.input-group {
  display: flex;
  gap: 0.5rem;
}
.url-input {
  width: 260px;
  padding: 0.25rem;
}
.base-input {
  width: 120px;
}
.divider {
  font-weight: bold;
  color: #999;
}
main {
  flex: 1;
  padding: 1rem;
  overflow: hidden;
  position: relative;
}
.placeholder {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #666;
  border: 2px dashed #ccc;
  border-radius: 8px;
}
.hint {
  font-size: 0.8rem;
  color: #999;
}
.custom-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-size: 1.1rem;
  color: #1976d2;
}
.error-screen {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.97);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 100;
  text-align: center;
  overflow: auto;
}
.instructions {
  background: #fff3e0;
  padding: 1.5rem 2rem;
  border-radius: 8px;
  border: 1px solid #ffe0b2;
  margin: 1rem 0;
  text-align: left;
  max-width: 720px;
}
.instructions code {
  word-break: break-all;
}
.retry-btn {
  padding: 0.5rem 1rem;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.component-error {
  color: #b3261e;
  text-align: center;
  padding: 1rem;
}
</style>
