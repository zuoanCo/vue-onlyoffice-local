<script setup lang="ts">
/**
 * Demo page for @zzk-1015/vue-onlyoffice-local.
 *
 * The whole point of the library is that a document never leaves the browser,
 * so this page deliberately has no backend of its own: the three sample files
 * are static assets, and every edit happens inside the OnlyOffice iframe that
 * the plugin mounts.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { VueOnlyOfficeLocal, type SaveResult } from 'vue-onlyoffice-local'
import {
  createTranslator,
  features as featureList,
  LOCALES,
  steps as stepList,
  STORAGE_KEY,
  type Locale,
} from './i18n'

declare const __DEMO_VERSION__: string

const REPO = 'https://github.com/zuoanCo/vue-onlyoffice-local'

/**
 * Page language. Defaults to whatever the visitor's browser asks for, so a
 * Chinese-locale browser lands on Chinese without a click; the choice is then
 * remembered in localStorage.
 */
function detectLocale(): Locale {
  // ?lang= wins, so a language can be linked to and bookmarked.
  try {
    const requested = new URLSearchParams(window.location.search).get('lang')
    if (requested === 'zh' || requested === 'en') return requested
  } catch {
    /* ignore */
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'zh' || saved === 'en') return saved
  } catch {
    /* private mode / storage disabled */
  }
  return (navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

const locale = ref<Locale>(detectLocale())
const t = createTranslator(locale)

/**
 * OnlyOffice wants a full tag. Kept separate from the page locale so the editor
 * UI can follow the page without inheriting the OS language.
 */
const editorLang = computed(
  () => LOCALES.find((l) => l.id === locale.value)?.editorLang || 'en-US',
)

function applyLocale(next: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    /* ignore */
  }
  document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en'
  document.title = t('docTitle')

  // Keep the address bar shareable without adding a history entry per click.
  try {
    const url = new URL(window.location.href)
    if (next === 'zh') url.searchParams.set('lang', 'zh')
    else url.searchParams.delete('lang')
    window.history.replaceState({}, '', url)
  } catch {
    /* ignore */
  }
}

watch(locale, (next) => {
  applyLocale(next)
  // DocsAPI instances are single-use, so the editor has to be rebuilt for the
  // new UI language. Harmless when nothing is open (the v-if hides it).
  editorKey.value += 1
})

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
      return t('status.loading')
    case 'ready':
      return t('status.ready')
    case 'modified':
      return t('status.modified')
    case 'saving':
      return t('status.saving')
    case 'error':
      return t('status.error')
    default:
      return t('status.idle')
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
  setStatus('loading', t('demo.opening', { name }))
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
    setStatus('loading', t('demo.booting'))
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
  setStatus('saving', format ? t('demo.exporting', { fmt: format.toUpperCase() }) : t('demo.saving'))
  try {
    const result = await handle.save(format)
    if (!result) {
      setStatus('modified', t('demo.noChanges'))
      return
    }
    triggerDownload(result)
    setStatus('ready', t('demo.saved', { name: result.fileName }))
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

const featureItems = computed(() => featureList(t))
const stepItems = computed(() => stepList(t))

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
  if (mins < 1) return t('stats.ageNow')
  if (mins < 60) return t('stats.ageMin', { n: mins })
  const hours = Math.round(mins / 60)
  if (hours < 24) return t('stats.ageHour', { n: hours })
  return t('stats.ageDay', { n: Math.round(hours / 24) })
})

onMounted(() => {
  applyLocale(locale.value)
  void loadStats()
})

const links = computed(() => [
  { href: REPO, label: t('footer.source') },
  { href: REPO + '#readme', label: t('footer.readme') },
  { href: REPO + '/releases', label: t('footer.releases') },
  { href: REPO + '/issues', label: t('footer.issues') },
  { href: 'https://github.com/sweetwisdom/onlyoffice-web-local', label: 'onlyoffice-web-local' },
])
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
        <a href="#demo">{{ t('nav.demo') }}</a>
        <a href="#features">{{ t('nav.features') }}</a>
        <a href="#install">{{ t('nav.install') }}</a>
        <div class="langswitch" role="group" :aria-label="t('nav.lang')">
          <button
            v-for="l in LOCALES"
            :key="l.id"
            type="button"
            :class="{ 'is-active': locale === l.id }"
            :aria-pressed="locale === l.id"
            @click="locale = l.id"
          >
            {{ l.label }}
          </button>
        </div>
        <a class="btn" :href="REPO" target="_blank" rel="noreferrer noopener">
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path
              d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38l-.01-1.33C3.79 14.3 3.34 13 3.34 13c-.36-.93-.88-1.18-.88-1.18-.72-.49.05-.48.05-.48.8.06 1.22.82 1.22.82.71 1.21 1.86.86 2.31.66.07-.52.28-.86.5-1.06-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48l-.01 2.2c0 .21.15.46.55.38A8 8 0 0 0 8 0z"
            />
          </svg>
          {{ t('nav.github') }}
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
            <p class="eyebrow">{{ t('hero.eyebrow') }}</p>
            <h1>
              {{ t('hero.title1') }}<br />
              <em>{{ t('hero.titleEm') }}</em> {{ t('hero.title2') }}
            </h1>
            <p class="hero__lede">{{ t('hero.lede') }}</p>
            <div class="hero__actions">
              <a class="btn btn--primary" href="#demo">{{ t('hero.ctaTry') }}</a>
              <a class="btn" :href="REPO" target="_blank" rel="noreferrer noopener">
                {{ t('hero.ctaSource') }}
              </a>
            </div>

            <dl v-if="stats" class="hero__stats">
              <div>
                <dt>{{ t('stats.stars') }}</dt>
                <dd>
                  <a :href="REPO + '/stargazers'" target="_blank" rel="noreferrer noopener">{{
                    formatCount(stats.stars)
                  }}</a>
                </dd>
              </div>
              <div>
                <dt>{{ t('stats.forks') }}</dt>
                <dd>
                  <a :href="REPO + '/network/members'" target="_blank" rel="noreferrer noopener">{{
                    formatCount(stats.forks)
                  }}</a>
                </dd>
              </div>
              <div>
                <dt>{{ t('stats.week') }}</dt>
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
                <dt>{{ t('stats.year') }}</dt>
                <dd>{{ formatCount(stats.downloads.lastyear) }}</dd>
              </div>
              <p class="hero__stats-fresh">
                <span class="live-dot" aria-hidden="true" />
                {{ t('stats.fresh', { age: statsAge }) }}
              </p>
            </dl>
          </div>
          <div class="hero__meta">
            <dl>
              <div>
                <dt>{{ t('hero.metaVersion') }}</dt>
                <dd>{{ __DEMO_VERSION__ }}</dd>
              </div>
              <div>
                <dt>{{ t('hero.metaLicense') }}</dt>
                <dd>MIT</dd>
              </div>
              <div>
                <dt>{{ t('hero.metaFormats') }}</dt>
                <dd>DOCX / XLSX / PPTX</dd>
              </div>
              <div>
                <dt>{{ t('hero.metaUploads') }}</dt>
                <dd>{{ t('hero.none') }}</dd>
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
            <p class="eyebrow">{{ t('demo.eyebrow') }}</p>
            <h2>{{ t('demo.title') }}</h2>
          </div>
          <p class="section-head__note">{{ t('demo.note') }}</p>
        </div>

        <div class="console">
          <div class="console__bar">
            <div class="tabs" role="tablist" :aria-label="t('demo.samplesLabel')">
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
              {{ t('demo.openFile') }}
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
                {{ mode === 'edit' ? t('demo.editing') : t('demo.viewOnly') }}
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
              :config="{ editorConfig: { lang: editorLang } }"
              @ready="onReady"
              @document-ready="onDocumentReady"
              @state-change="onStateChange"
              @error="onError"
            />

            <div
              v-if="overlay === 'idle'"
              class="stage-overlay"
            >
              <h3>{{ t('demo.pickTitle') }}</h3>
              <p>{{ t('demo.pickBody') }}</p>
            </div>

            <div v-else-if="overlay === 'loading'" class="stage-overlay">
              <h3>{{ t('demo.startTitle') }}</h3>
              <p>{{ t('demo.startBody') }}</p>
              <div class="stage-overlay__bar" />
              <span class="stage-overlay__step">{{ statusNote || t('demo.loadingFallback') }}</span>
            </div>

            <div v-else-if="overlay === 'error'" class="stage-overlay stage-overlay--error">
              <h3>{{ t('demo.errorTitle') }}</h3>
              <p><code>{{ errorMessage }}</code></p>
              <button class="btn" type="button" @click="retry">{{ t('demo.retry') }}</button>
            </div>
          </div>

          <div class="console__foot">
            <span>
              <kbd>{{ t('demo.hintKey') }}</kbd>{{ t('demo.hintJoin') }}<kbd>S</kbd>
              {{ t('demo.hint') }}
            </span>
            <div class="console__actions">
              <button
                class="btn"
                type="button"
                :disabled="busy || !file || status === 'error'"
                @click="save()"
              >
                {{ t('demo.saveFile') }}
              </button>
              <button
                class="btn"
                type="button"
                :disabled="busy || !file || status === 'error'"
                @click="save('pdf')"
              >
                {{ t('demo.exportPdf') }}
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
            <p class="eyebrow">{{ t('feat.eyebrow') }}</p>
            <h2>{{ t('feat.title') }}</h2>
          </div>
          <p class="section-head__note">{{ t('feat.note') }}</p>
        </div>

        <div class="feature-list">
          <article v-for="f in featureItems" :key="f.n" class="feature">
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
            <p class="eyebrow">{{ t('flow.eyebrow') }}</p>
            <h2>{{ t('flow.title') }}</h2>
          </div>
        </div>
        <div class="flow__steps">
          <div v-for="s in stepItems" :key="s.n" class="flow__step">
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
            <p class="eyebrow">{{ t('install.eyebrow') }}</p>
            <h2>{{ t('install.title') }}</h2>
            <p class="install__note">{{ t('install.note') }}</p>
          </div>
          <div>
            <div class="terminal">
              <div class="terminal__head">
                <span>{{ t('install.tabInstall') }}</span>
                <button class="btn" type="button" @click="copy(installCmd, 'install')">
                  {{ copied === 'install' ? t('install.copied') : t('install.copy') }}
                </button>
              </div>
              <pre><code><span class="prompt">$</span> {{ installCmd }}</code></pre>
            </div>

            <div class="terminal" style="margin-top: 1rem">
              <div class="terminal__head">
                <span>{{ t('install.tabUsage') }}</span>
                <button class="btn" type="button" @click="copy(usageText, 'usage')">
                  {{ copied === 'usage' ? t('install.copied') : t('install.copy') }}
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
        <p>{{ t('footer.tagline') }}</p>
      </div>
      <div class="footer__links">
        <a v-for="l in links" :key="l.href" :href="l.href" target="_blank" rel="noreferrer noopener">
          {{ l.label }}
        </a>
      </div>
    </div>
  </footer>
</template>