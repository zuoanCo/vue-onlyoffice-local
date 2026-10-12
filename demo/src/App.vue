<script setup lang="ts">
/**
 * Demo page for @zzk-1015/vue-onlyoffice-local.
 *
 * The whole point of the library is that a document never leaves the browser,
 * so this page deliberately has no backend of its own: the three sample files
 * are static assets, and every edit happens inside the OnlyOffice iframe that
 * the plugin mounts.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { VueOnlyOfficeLocal, type SaveResult } from 'vue-onlyoffice-local'

declare const __DEMO_VERSION__: string

const REPO = 'https://github.com/zuoanCo/vue-onlyoffice-local'

type SampleId = 'docx' | 'xlsx' | 'pptx'
type StageState = 'idle' | 'loading' | 'ready' | 'modified' | 'saving' | 'error'

interface Sample {
  id: SampleId
  label: string
  ext: string
  file: string
  mime: string
  blurb: string
}

const samples: Sample[] = [
  {
    id: 'docx',
    label: 'DOCX',
    ext: 'docx',
    file: 'sample.docx',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    blurb: 'Word editing',
  },
  {
    id: 'xlsx',
    label: 'XLSX',
    ext: 'xlsx',
    file: 'sample.xlsx',
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    blurb: 'Cell editing',
  },
  {
    id: 'pptx',
    label: 'PPTX',
    ext: 'pptx',
    file: 'sample.pptx',
    mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    blurb: 'Slide editing',
  },
]

const active = ref<SampleId>('docx')
const file = ref<File | null>(null)
const fileName = ref('')
const mode = ref<'edit' | 'view'>('edit')
const editorKey = ref(0)
const status = ref<StageState>('idle')
const statusNote = ref('')
const errorMessage = ref('')
const editorRef = ref<InstanceType<typeof VueOnlyOfficeLocal> | null>(null)
const copied = ref<string | null>(null)

const activeSample = computed(() => samples.find((s) => s.id === active.value) ?? samples[0])

const statusLabel = computed(() => {
  switch (status.value) {
    case 'loading':
      return 'Loading kernel'
    case 'ready':
      return 'Ready'
    case 'modified':
      return 'Unsaved edits'
    case 'saving':
      return 'Saving'
    case 'error':
      return 'Failed'
    default:
      return 'Idle'
  }
})

const overlay = computed<'idle' | 'loading' | 'error' | null>(() => {
  if (status.value === 'error') return 'error'
  if (!file.value) return 'idle'
  if (status.value === 'idle' || status.value === 'loading') return 'loading'
  return null
})

const busy = computed(() => status.value === 'loading' || status.value === 'saving')

function setStatus(next: StageState, note = '') {
  status.value = next
  statusNote.value = note
}

async function openSample(id: SampleId) {
  const sample = samples.find((s) => s.id === id)
  if (!sample) return
  active.value = id
  await load(sample.file, sample.file, sample.mime)
}

async function onPick(event: Event) {
  const input = event.target as HTMLInputElement
  const picked = input.files?.[0]
  if (!picked) return
  active.value = 'docx'
  // Release the handle so re-picking the same file still fires `change`.
  input.value = ''
  await load(picked, picked.name, picked.type)
}

async function load(source: string, name: string, mime: string) {
  setStatus('loading', `Opening ${name}`)
  errorMessage.value = ''
  try {
    if (typeof source === 'string' && source.startsWith('http')) {
      const res = await fetch(source)
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
      const blob = await res.blob()
      file.value = new File([blob], name, { type: mime || blob.type })
    } else {
      file.value = source as File
    }
    fileName.value = name
    // Remount: DocsAPI instances are single-use, so switching documents means
    // building a fresh editor rather than reconfiguring the existing one.
    editorKey.value += 1
    setStatus('loading', 'Booting editor')
  } catch (err) {
    fail(err)
  }
}

function fail(err: unknown) {
  errorMessage.value = err instanceof Error ? err.message : String(err)
  setStatus('error')
}

function retry() {
  const name = fileName.value || activeSample.value.file
  const mime = activeSample.value.mime
  void load(name, name, mime)
}

function onReady() {
  setStatus('ready')
}
function onDocumentReady() {
  setStatus('ready')
}
function onError(err: Error) {
  fail(err)
}
function onStateChange(modified: boolean) {
  if (status.value === 'error') return
  setStatus(modified ? 'modified' : 'ready')
}

function triggerDownload(result: SaveResult) {
  const bytes = new Uint8Array(result.buffer)
  const blob = new Blob([bytes], {
    type:
      result.fileType === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.' +
          `${result.fileType === 'xlsx' ? 'spreadsheetml' : result.fileType === 'pptx' ? 'presentationml' : 'wordprocessingml'}.${result.fileType}`,
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = result.fileName || fileName.value
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  // Give the browser a beat to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

async function save(format?: string) {
  const handle = editorRef.value
  if (!handle || busy.value) return
  setStatus('saving', format ? `Exporting ${format.toUpperCase()}` : 'Writing file')
  try {
    const result = await handle.save(format)
    if (!result) {
      setStatus('modified', 'No changes to write')
      return
    }
    triggerDownload(result)
    setStatus('ready', `Saved ${result.fileName}`)
  } catch (err) {
    fail(err)
  }
}

let copyTimer: ReturnType<typeof setTimeout> | null = null
async function copy(text: string, key: string) {
  try {
    await navigator.clipboard.writeText(text)
    copied.value = key
  } catch {
    // Clipboard API needs a secure context; fall back to a selection copy.
    const area = document.createElement('textarea')
    area.value = text
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    try {
      document.execCommand('copy')
      copied.value = key
    } catch {
      /* nothing more we can do */
    }
    document.body.removeChild(area)
  }
  if (copyTimer) clearTimeout(copyTimer)
  copyTimer = setTimeout(() => (copied.value = null), 1800)
}

onBeforeUnmount(() => {
  if (copyTimer) clearTimeout(copyTimer)
})

const installCmd = 'npm i @zzk-1015/vue-onlyoffice-local'

const usageSnippet = [
  { c: '<script', t: ' setup lang="ts">' },
  { c: "import { VueOnlyOfficeLocal } from '@zzk-1015/vue-onlyoffice-local'", t: '' },
  { c: '', t: '' },
  { c: '<template>', t: '' },
  { c: '  <VueOnlyOfficeLocal', t: '' },
  { c: '    ref="editor"', t: '' },
  { c: '    :file="file"', t: '' },
  { c: '    file-name="report.docx"', t: '' },
  { c: '    base-url="/"', t: '' },
  { c: '    @error="onError"', t: '' },
  { c: '  />', t: '' },
  { c: '</template>', t: '' },
  { c: '', t: '' },
  { c: '<script', t: ' setup lang="ts">' },
  { c: 'const file = ref(new File([], "report.docx"))', t: '' },
  { c: '', t: '' },
  { c: '// Editor bytes come back to the host page; nothing is uploaded.', t: 'c' },
  { c: 'const onSave = async () => {', t: '' },
  { c: '  const result = await editor.value?.save()', t: '' },
  { c: '  if (result) download(result.buffer, result.fileName)', t: '' },
  { c: '}', t: '' },
  { c: '</' + 'script>', t: '' },
]

const usageText = usageSnippet.map((l) => l.c || l.t).join('\n')

const features = [
  {
    n: '01',
    title: 'No document server',
    body: 'The editor kernel is the self-hosted OnlyOffice 9.x offline build, mounted in an iframe. There is no Document Server to provision, license or keep online.',
    code: '',
  },
  {
    n: '02',
    title: 'Nothing is uploaded',
    body: 'Your file is turned into a Blob URL and opened in place. Open the network tab while you edit — you will not see a single request carrying your document.',
    code: '',
  },
  {
    n: '03',
    title: 'Imperative save()',
    body: 'A postMessage file-stream hook intercepts the editor download and hands the edited bytes back to your component as an ArrayBuffer.',
    code: 'editor.value.save()',
  },
  {
    n: '04',
    title: 'Component or composable',
    body: 'Drop in <VueOnlyOfficeLocal> for the common case, or call useOnlyOffice() when you need to own the mount lifecycle yourself.',
    code: 'useOnlyOffice()',
  },
  {
    n: '05',
    title: 'Three surface styles',
    body: 'Component props, the useOnlyOffice() composable, and the headless createEditor() SDK are all first-class entry points.',
    code: 'createEditor()',
  },
  {
    n: '06',
    title: 'v2 event surface',
    body: 'Beyond ready and error: state-change, request-close, meta-change and save all surface as Vue emits.',
    code: '@state-change',
  },
]

const steps = [
  {
    n: 'Step 01',
    title: 'Host the offline build',
    body: 'Copy the vendor/ folder from the OnlyOffice 9.x offline build anywhere on your origin. The plugin resolves DocsAPI from <baseUrl>/vendor/web-apps/apps/api/documents/api.js.',
  },
  {
    n: 'Step 02',
    title: 'Install and register',
    body: 'npm i @zzk-1015/vue-onlyoffice-local, then app.use() it with defaultBaseUrl pointing at wherever you dropped the vendor build.',
  },
  {
    n: 'Step 03',
    title: 'Pass a file, call save()',
    body: 'Hand the component a File, Blob or URL. When the user is done, await save() to receive the edited bytes — still entirely in the browser.',
  },
]

interface RepoStats {
  stars: number
  forks: number
  openIssues: number
  pushedAt: string
  version: string
  generatedAt: string
  downloads: { lastweek: number; lastmonth: number; lastyear: number }
}

const stats = ref<RepoStats | null>(null)
const statsFailed = ref(false)

/**
 * /stats.json is written every 30 minutes by /usr/local/bin/oo-demo-stats on the
 * server. It is deliberately not fetched live from api.github.com in here:
 * that endpoint is CORS-open but capped at 60 requests per hour per IP, which
 * every visitor behind the same NAT would share, and the npm API is not
 * reachable from every network.
 */
async function loadStats() {
  try {
    const res = await fetch('/stats.json', { cache: 'no-cache' })
    if (!res.ok) throw new Error(String(res.status))
    stats.value = (await res.json()) as RepoStats
  } catch {
    // Leave the strip hidden rather than showing stale or invented numbers.
    statsFailed.value = true
  }
}

const nf = new Intl.NumberFormat('en-US')
const formatCount = (n: number) => (n >= 1000 ? nf.format(Math.round(n / 100) / 10) + 'k' : nf.format(n))

const statsAge = computed(() => {
  const iso = stats.value?.generatedAt
  if (!iso) return ''
  const mins = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000))
  if (mins < 1) return 'just now'
  if (mins < 60) return mins + ' min ago'
  const hours = Math.round(mins / 60)
  if (hours < 24) return hours + ' h ago'
  return Math.round(hours / 24) + ' d ago'
})

onMounted(loadStats)

const links = [
  { href: REPO, label: 'Source' },
  { href: `${REPO}#readme`, label: 'Readme' },
  { href: `${REPO}/releases`, label: 'Releases' },
  { href: `${REPO}/issues`, label: 'Issues' },
]
</script>

<template>
  <header class="topbar">
    <div class="shell topbar__inner">
      <a class="brand" :href="REPO">
        <svg class="brand__mark" viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="6" fill="#16181D" />
          <path
            d="M7 9.5h7.2c1.6 0 2.6.9 2.6 2.3v8.4c0 1.4-1 2.3-2.6 2.3H7z"
            fill="none"
            stroke="#F7F6F3"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
          <path
            d="M17.2 12.6h7.1M17.2 16h7.1M17.2 19.4h4.6"
            stroke="#C2410C"
            stroke-width="1.8"
            stroke-linecap="round"
          />
        </svg>
        <span class="brand__name">vue-onlyoffice-local</span>
      </a>
      <nav class="topnav">
        <a href="#demo">Live demo</a>
        <a href="#features">Features</a>
        <a href="#install">Install</a>
        <a class="btn" :href="REPO" target="_blank" rel="noreferrer noopener">
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path
              d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38l-.01-1.33C3.79 14.3 3.34 13 3.34 13c-.36-.93-.88-1.18-.88-1.18-.72-.49.05-.48.05-.48.8.06 1.22.82 1.22.82.71 1.21 1.86.86 2.31.66.07-.52.28-.86.5-1.06-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48l-.01 2.2c0 .21.15.46.55.38A8 8 0 0 0 8 0z"
            />
          </svg>
          GitHub
        </a>
      </nav>
    </div>
  </header>

  <main>
    <!-- ------------------------------------------------------------ hero -->
    <section class="hero">
      <div class="shell">
        <div class="hero__grid">
          <div>
            <p class="eyebrow">Vue 3 &middot; MIT &middot; zero upload</p>
            <h1>
              OnlyOffice editing,<br />
              <em>entirely</em> in the browser.
            </h1>
            <p class="hero__lede">
              A Vue 3 plugin that opens and edits DOCX, XLSX and PPTX without a document
              server. The file becomes a Blob URL, the editor runs in an iframe, and the
              edited bytes come straight back to your component.
            </p>
            <div class="hero__actions">
              <a class="btn btn--primary" href="#demo">Try the live editor</a>
              <a class="btn" :href="REPO" target="_blank" rel="noreferrer noopener">
                Read the source
              </a>
            </div>

            <dl v-if="stats" class="hero__stats">
              <div>
                <dt>GitHub stars</dt>
                <dd>
                  <a :href="REPO + '/stargazers'" target="_blank" rel="noreferrer noopener">{{
                    formatCount(stats.stars)
                  }}</a>
                </dd>
              </div>
              <div>
                <dt>Forks</dt>
                <dd>
                  <a :href="REPO + '/network/members'" target="_blank" rel="noreferrer noopener">{{
                    formatCount(stats.forks)
                  }}</a>
                </dd>
              </div>
              <div>
                <dt>npm / week</dt>
                <dd>
                  <a
                    href="https://www.npmjs.com/package/@zzk-1015/vue-onlyoffice-local"
                    target="_blank"
                    rel="noreferrer noopener"
                    >{{ formatCount(stats.downloads.lastweek) }}</a
                  >
                </dd>
              </div>
              <div>
                <dt>npm / year</dt>
                <dd>{{ formatCount(stats.downloads.lastyear) }}</dd>
              </div>
              <p class="hero__stats-fresh">
                <span class="live-dot" aria-hidden="true" />
                Live from the GitHub and npm APIs, refreshed {{ statsAge }}
              </p>
            </dl>
          </div>
          <div class="hero__meta">
            <dl>
              <div>
                <dt>Version</dt>
                <dd>{{ __DEMO_VERSION__ }}</dd>
              </div>
              <div>
                <dt>License</dt>
                <dd>MIT</dd>
              </div>
              <div>
                <dt>Formats</dt>
                <dd>DOCX / XLSX / PPTX</dd>
              </div>
              <div>
                <dt>Uploads</dt>
                <dd>None</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>

    <!-- ------------------------------------------------------------ demo -->
    <section class="demo" id="demo">
      <div class="shell">
        <div class="section-head">
          <div>
            <p class="eyebrow">01 &mdash; Live</p>
            <h2>Edit a document right here.</h2>
          </div>
          <p class="section-head__note">
            Pick a sample or drop in your own file. Every byte stays in this tab &mdash;
            watch the network panel while you type.
          </p>
        </div>

        <div class="console">
          <div class="console__bar">
            <div class="tabs" role="tablist" aria-label="Sample document">
              <button
                v-for="s in samples"
                :key="s.id"
                role="tab"
                type="button"
                :aria-selected="fileName === s.file"
                :disabled="busy"
                @click="openSample(s.id)"
              >
                {{ s.label }}
              </button>
            </div>

            <label class="btn filefield">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                <path d="M8 11V3M8 3 5 6M8 3l3 3M2.5 11v1.5a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V11" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Open your file
              <input
                type="file"
                accept=".docx,.xlsx,.pptx"
                :disabled="busy"
                @change="onPick"
              />
            </label>

            <span class="console__spacer" />

            <div class="console__group">
              <button
                class="btn btn--ghost"
                type="button"
                :disabled="busy"
                @click="mode = mode === 'edit' ? 'view' : 'edit'; editorKey += 1"
              >
                {{ mode === 'edit' ? 'Editing' : 'View only' }}
              </button>
              <span class="status" :data-state="status">
                <span class="status__dot" />
                {{ statusLabel }}
              </span>
            </div>
          </div>

          <div class="console__stage">
            <VueOnlyOfficeLocal
              v-if="file"
              :key="editorKey"
              ref="editorRef"
              :file="file"
              :file-name="fileName"
              :mode="mode"
              base-url="/"
              @ready="onReady"
              @document-ready="onDocumentReady"
              @state-change="onStateChange"
              @error="onError"
            />

            <div
              v-if="overlay === 'idle'"
              class="stage-overlay"
            >
              <h3>Pick a document to start.</h3>
              <p>
                Choose one of the samples above, or open a
                <code>.docx</code>, <code>.xlsx</code> or <code>.pptx</code> from your machine.
              </p>
            </div>

            <div v-else-if="overlay === 'loading'" class="stage-overlay">
              <h3>Starting the editor.</h3>
              <p>
                The first load pulls the OnlyOffice kernel from
                <code>/vendor/</code>, so it can take a few seconds.
              </p>
              <div class="stage-overlay__bar" />
              <span class="stage-overlay__step">{{ statusNote || 'Loading' }}</span>
            </div>

            <div v-else-if="overlay === 'error'" class="stage-overlay stage-overlay--error">
              <h3>Could not open the document.</h3>
              <p><code>{{ errorMessage }}</code></p>
              <button class="btn" type="button" @click="retry">Try again</button>
            </div>
          </div>

          <div class="console__foot">
            <span>
              <kbd>Ctrl</kbd> + <kbd>S</kbd> inside the editor saves through the
              file-stream hook.
            </span>
            <div class="console__actions">
              <button
                class="btn"
                type="button"
                :disabled="busy || !file || status === 'error'"
                @click="save()"
              >
                Save file
              </button>
              <button
                class="btn"
                type="button"
                :disabled="busy || !file || status === 'error'"
                @click="save('pdf')"
              >
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- -------------------------------------------------------- features -->
    <section class="features" id="features">
      <div class="shell">
        <div class="section-head">
          <div>
            <p class="eyebrow">02 &mdash; What you get</p>
            <h2>One plugin, three ways in.</h2>
          </div>
          <p class="section-head__note">
            The component is the happy path. Everything it does is also reachable from
            the composable and the raw SDK.
          </p>
        </div>

        <div class="feature-list">
          <article v-for="f in features" :key="f.n" class="feature">
            <span class="feature__num">{{ f.n }}</span>
            <div>
              <h3>{{ f.title }}</h3>
              <p>
                {{ f.body }}
                <code v-if="f.code">{{ f.code }}</code>
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- ------------------------------------------------------------ flow -->
    <section class="flow">
      <div class="shell">
        <div class="section-head">
          <div>
            <p class="eyebrow">03 &mdash; Setup</p>
            <h2>Three steps to a working editor.</h2>
          </div>
        </div>
        <div class="flow__steps">
          <div v-for="s in steps" :key="s.n" class="flow__step">
            <b>{{ s.n }}</b>
            <h3>{{ s.title }}</h3>
            <p>{{ s.body }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- --------------------------------------------------------- install -->
    <section class="install" id="install">
      <div class="shell">
        <div class="install__grid">
          <div>
            <p class="eyebrow">04 &mdash; Install</p>
            <h2>Drop it into an existing Vue app.</h2>
            <p class="install__note">
              The only deployment requirement is the self-hosted OnlyOffice offline
              build, served from your own origin under <code>/vendor</code>.
            </p>
          </div>
          <div>
            <div class="terminal">
              <div class="terminal__head">
                <span>install</span>
                <button class="btn" type="button" @click="copy(installCmd, 'install')">
                  {{ copied === 'install' ? 'Copied' : 'Copy' }}
                </button>
              </div>
              <pre><code><span class="prompt">$</span> {{ installCmd }}</code></pre>
            </div>

            <div class="terminal" style="margin-top: 1rem">
              <div class="terminal__head">
                <span>usage.vue</span>
                <button class="btn" type="button" @click="copy(usageText, 'usage')">
                  {{ copied === 'usage' ? 'Copied' : 'Copy' }}
                </button>
              </div>
              <pre><code><span v-for="(line, i) in usageSnippet" :key="i" class="line"><span v-if="line.c" :class="line.c">{{ line.c }}</span><span v-else>{{ line.t }}</span></span></code></pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="shell footer__inner">
      <div>
        <p class="eyebrow">vue-onlyoffice-local</p>
        <p>
          MIT licensed. Built on the
          <a href="https://github.com/sweetwisdom/onlyoffice-web-local" target="_blank" rel="noreferrer noopener"
            >onlyoffice-web-local</a
          >
          offline architecture.
        </p>
      </div>
      <div class="footer__links">
        <a v-for="l in links" :key="l.href" :href="l.href" target="_blank" rel="noreferrer noopener">
          {{ l.label }}
        </a>
      </div>
    </div>
  </footer>
</template>