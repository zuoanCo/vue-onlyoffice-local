<template>
  <div class="playground">
    <header>
      <h1>Vue OnlyOffice Local Playground</h1>
      <div class="controls">
        <label>
          Theme:
          <select v-model="theme">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <div class="input-group">
            <input type="text" v-model="inputUrl" placeholder="Enter Document URL" class="url-input" />
            <button @click="loadUrl">Load URL</button>
        </div>
        <span class="divider">OR</span>
        <input type="file" @change="handleFileChange" accept=".docx,.xlsx,.pptx" />
      </div>
    </header>

    <main>
      <div v-if="missingAssets" class="error-screen">
        <h2>⚠️ Missing Static Assets</h2>
        <p>The OnlyOffice SDK and WebAssembly files are missing.</p>
        <div class="instructions">
          <p>Please verify that the following files exist in <code>playground/public/</code>:</p>
          <ul>
            <li><code>web-apps/apps/api/documents/api.js</code></li>
            <li><code>wasm/x2t/x2t.js</code></li>
            <li><code>sdkjs/</code> folder</li>
          </ul>
        </div>
        <button @click="retry" class="retry-btn">Retry</button>
      </div>

      <div v-else-if="!file" class="placeholder">
        <p>Please select a document to edit (docx, xlsx, pptx)</p>
      </div>

      <VueOnlyOfficeLocal
        v-else
        :file="file"
        :file-name="fileName"
        :theme="theme"
        @ready="onEditorReady"
        @error="onEditorError"
      >
        <template #loading>
          <div class="custom-loading">
            Initializing Local Editor...
          </div>
        </template>
        <template #error="{ error }">
          <div class="component-error">
            <h3>Editor Error</h3>
            <p>{{ error.message }}</p>
          </div>
        </template>
      </VueOnlyOfficeLocal>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const file = ref<File | string | null>(null);
const fileName = ref('');
const theme = ref<'light' | 'dark'>('light');
const missingAssets = ref(false);
const inputUrl = ref('https://file-examples.com/storage/fe45e8c14366f7737233891/2017/02/file-sample_100kB.docx');

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    file.value = target.files[0];
    fileName.value = target.files[0].name;
    missingAssets.value = false; // Reset error on new file attempt
  }
};

const loadUrl = () => {
    if (inputUrl.value) {
        file.value = inputUrl.value;
        fileName.value = inputUrl.value.split('/').pop() || 'document.docx';
        missingAssets.value = false;
    }
};

const onEditorReady = (editor: any) => {
  console.log('Editor Ready:', editor);
};

const onEditorError = (err: Error) => {
  console.error('Editor Error:', err);
  if (err.message.includes('Failed to load script')) {
    missingAssets.value = true;
  } else {
    alert('Editor failed: ' + err.message);
  }
};

const retry = () => {
  missingAssets.value = false;
  window.location.reload();
};
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
}

h1 {
  margin: 0;
  font-size: 1.2rem;
}

.controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.input-group {
    display: flex;
    gap: 0.5rem;
}

.url-input {
    width: 300px;
    padding: 0.25rem;
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

.note {
  font-size: 0.8rem;
  color: #d32f2f;
  margin-top: 1rem;
}

.custom-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-size: 1.2rem;
  color: #1976d2;
}

.error-screen {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 100;
  text-align: center;
}

.instructions {
  background: #fff3e0;
  padding: 2rem;
  border-radius: 8px;
  border: 1px solid #ffe0b2;
  margin: 1rem 0;
  text-align: left;
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
  color: #d32f2f;
  text-align: center;
}
</style>
