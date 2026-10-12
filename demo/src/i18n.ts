/**
 * Bilingual copy for the demo page.
 *
 * Kept as one flat dictionary rather than per-component constants so that a
 * missing key is obvious in one place. `zh` is the Simplified Chinese
 * translation; `en` is the source of truth.
 *
 * `editorLang` is deliberately separate from the page locale: OnlyOffice wants
 * a full tag like `zh-CN` / `en-US`, and we force English mode in the editor
 * when the page is English so the UI does not follow the visitor's OS.
 */
export type Locale = 'en' | 'zh'

export const LOCALES: { id: Locale; label: string; editorLang: string }[] = [
  { id: 'en', label: 'EN', editorLang: 'en-US' },
  { id: 'zh', label: '\u4e2d\u6587', editorLang: 'zh-CN' },
]

export const STORAGE_KEY = 'vue-onlyoffice-demo-locale'

const en = {
  'htmlLang': 'en',
  'docTitle': 'vue-onlyoffice-local \u2014 Purely local OnlyOffice editing for Vue 3',

  'nav.demo': 'Live demo',
  'nav.features': 'Features',
  'nav.install': 'Install',
  'nav.github': 'GitHub',
  'nav.lang': 'Language',

  'hero.eyebrow': 'Vue 3 \u00b7 MIT \u00b7 zero upload',
  'hero.title1': 'OnlyOffice editing,',
  'hero.titleEm': 'entirely',
  'hero.title2': 'in the browser.',
  'hero.lede':
    'A Vue 3 plugin that opens and edits DOCX, XLSX and PPTX without a document server. The file becomes a Blob URL, the editor runs in an iframe, and the edited bytes come straight back to your component.',
  'hero.ctaTry': 'Try the live editor',
  'hero.ctaSource': 'Read the source',
  'hero.metaVersion': 'Version',
  'hero.metaLicense': 'License',
  'hero.metaFormats': 'Formats',
  'hero.metaUploads': 'Uploads',
  'hero.none': 'None',

  'stats.stars': 'GitHub stars',
  'stats.forks': 'Forks',
  'stats.week': 'npm / week',
  'stats.year': 'npm / year',
  'stats.fresh': 'Live from the GitHub and npm APIs, refreshed {age}',
  'stats.ageNow': 'just now',
  'stats.ageMin': '{n} min ago',
  'stats.ageHour': '{n} h ago',
  'stats.ageDay': '{n} d ago',

  'demo.eyebrow': '01 \u2014 Live',
  'demo.title': 'Edit a document right here.',
  'demo.note':
    'Pick a sample or drop in your own file. Every byte stays in this tab \u2014 watch the network panel while you type.',
  'demo.openFile': 'Open your file',
  'demo.editing': 'Editing',
  'demo.viewOnly': 'View only',
  'demo.saveFile': 'Save file',
  'demo.exportPdf': 'Export PDF',
  'demo.hint': 'inside the editor saves through the file-stream hook.',
  'demo.hintKey': 'Ctrl',
  'demo.hintJoin': '+',
  'demo.samplesLabel': 'Sample document',
  'demo.pickTitle': 'Pick a document to start.',
  'demo.pickBody':
    'Choose one of the samples above, or open a .docx, .xlsx or .pptx from your machine.',
  'demo.startTitle': 'Starting the editor.',
  'demo.startBody': 'The first load pulls the OnlyOffice kernel from /vendor/, so it can take a few seconds.',
  'demo.errorTitle': 'Could not open the document.',
  'demo.retry': 'Try again',
  'demo.loadingFallback': 'Loading',
  'demo.opening': 'Opening {name}',
  'demo.booting': 'Booting editor',
  'demo.saving': 'Writing file',
  'demo.exporting': 'Exporting {fmt}',
  'demo.noChanges': 'No changes to write',
  'demo.saved': 'Saved {name}',

  'status.idle': 'Idle',
  'status.loading': 'Loading kernel',
  'status.ready': 'Ready',
  'status.modified': 'Unsaved edits',
  'status.saving': 'Saving',
  'status.error': 'Failed',

  'feat.f1.title': 'No document server',
  'feat.f1.body':
    'The editor kernel is the self-hosted OnlyOffice 9.x offline build, mounted in an iframe. There is no Document Server to provision, license or keep online.',
  'feat.f2.title': 'Nothing is uploaded',
  'feat.f2.body':
    'Your file is turned into a Blob URL and opened in place. Open the network tab while you edit and you will not see a single request carrying your document.',
  'feat.f3.title': 'Imperative save()',
  'feat.f3.body':
    'A postMessage file-stream hook intercepts the editor download and hands the edited bytes back to your component as an ArrayBuffer.',
  'feat.f4.title': 'Component or composable',
  'feat.f4.body':
    'Drop in the VueOnlyOfficeLocal component for the common case, or call useOnlyOffice() when you need to own the mount lifecycle yourself.',
  'feat.f5.title': 'Three surface styles',
  'feat.f5.body':
    'Component props, the useOnlyOffice() composable and the headless createEditor() SDK are all first-class entry points.',
  'feat.f6.title': 'v2 event surface',
  'feat.f6.body':
    'Beyond ready and error: state-change, request-close, meta-change and save all surface as Vue emits.',

  'flow.s1.title': 'Host the offline build',
  'flow.s1.body':
    'Copy the vendor/ folder from the OnlyOffice 9.x offline build anywhere on your origin. The plugin resolves DocsAPI from <baseUrl>/vendor/web-apps/apps/api/documents/api.js.',
  'flow.s2.title': 'Install and register',
  'flow.s2.body':
    'npm i @zzk-1015/vue-onlyoffice-local, then app.use() it with defaultBaseUrl pointing at wherever you dropped the vendor build.',
  'flow.s3.title': 'Pass a file, call save()',
  'flow.s3.body':
    'Hand the component a File, Blob or URL. When the user is done, await save() to receive the edited bytes, still entirely in the browser.',

  'feat.eyebrow': '02 \u2014 What you get',
  'feat.title': 'One plugin, three ways in.',
  'feat.note':
    'The component is the happy path. Everything it does is also reachable from the composable and the raw SDK.',

  'flow.eyebrow': '03 \u2014 Setup',
  'flow.title': 'Three steps to a working editor.',

  'install.eyebrow': '04 \u2014 Install',
  'install.title': 'Drop it into an existing Vue app.',
  'install.note':
    'The only deployment requirement is the self-hosted OnlyOffice offline build, served from your own origin under /vendor.',
  'install.tabInstall': 'install',
  'install.tabUsage': 'usage.vue',
  'install.copy': 'Copy',
  'install.copied': 'Copied',

  'footer.tagline':
    'MIT licensed. Built on the onlyoffice-web-local offline architecture.',
  'footer.source': 'Source',
  'footer.readme': 'Readme',
  'footer.releases': 'Releases',
  'footer.issues': 'Issues',
}

type Key = keyof typeof en

const zh: Record<Key, string> = {
  'htmlLang': 'zh-CN',
  'docTitle': 'vue-onlyoffice-local \u2014 \u7eaf\u672c\u5730\u7684 Vue 3 OnlyOffice \u6587\u6863\u7f16\u8f91\u5668',

  'nav.demo': '\u5728\u7ebf\u6f14\u793a',
  'nav.features': '\u7279\u6027',
  'nav.install': '\u5b89\u88c5',
  'nav.github': 'GitHub',
  'nav.lang': '\u8bed\u8a00',

  'hero.eyebrow': 'Vue 3 \u00b7 MIT \u00b7 \u96f6\u4e0a\u4f20',
  'hero.title1': 'OnlyOffice \u6587\u6863\u7f16\u8f91\uff0c',
  'hero.titleEm': '\u5b8c\u5168',
  'hero.title2': '\u5728\u6d4f\u89c8\u5668\u5185\u5b8c\u6210\u3002',
  'hero.lede':
    '\u4e00\u4e2a Vue 3 \u63d2\u4ef6\uff0c\u4e0d\u9700\u8981\u6587\u6863\u670d\u52a1\u5668\u5373\u53ef\u6253\u5f00\u5e76\u7f16\u8f91 DOCX\u3001XLSX \u548c PPTX\u3002\u6587\u4ef6\u4f1a\u88ab\u8f6c\u6210 Blob URL\uff0c\u7f16\u8f91\u5668\u8fd0\u884c\u5728 iframe \u4e2d\uff0c\u7f16\u8f91\u540e\u7684\u5b57\u8282\u76f4\u63a5\u8fd4\u56de\u7ed9\u4f60\u7684\u7ec4\u4ef6\u3002',
  'hero.ctaTry': '\u8bd5\u7528\u5728\u7ebf\u7f16\u8f91\u5668',
  'hero.ctaSource': '\u67e5\u770b\u6e90\u7801',
  'hero.metaVersion': '\u7248\u672c',
  'hero.metaLicense': '\u8bb8\u53ef\u8bc1',
  'hero.metaFormats': '\u683c\u5f0f',
  'hero.metaUploads': '\u4e0a\u4f20',
  'hero.none': '无',

  'stats.stars': 'GitHub Star',
  'stats.forks': 'Fork',
  'stats.week': 'npm / \u5468',
  'stats.year': 'npm / \u5e74',
  'stats.fresh': '\u6570\u636e\u5b9e\u65f6\u6765\u81ea GitHub \u4e0e npm API\uff0c{age}\u66f4\u65b0',
  'stats.ageNow': '\u521a\u521a',
  'stats.ageMin': '{n} \u5206\u949f\u524d',
  'stats.ageHour': '{n} \u5c0f\u65f6\u524d',
  'stats.ageDay': '{n} \u5929\u524d',

  'demo.eyebrow': '01 \u2014 \u5728\u7ebf',
  'demo.title': '\u5c31\u5728\u8fd9\u91cc\u7f16\u8f91\u6587\u6863\u3002',
  'demo.note': '\u9009\u4e00\u4e2a\u6837\u4f8b\uff0c\u6216\u6253\u5f00\u4f60\u81ea\u5df1\u7684\u6587\u4ef6\u3002\u6bcf\u4e2a\u5b57\u8282\u90fd\u7559\u5728\u8fd9\u4e2a\u6807\u7b7e\u9875\u91cc\u2014\u2014\u7f16\u8f91\u65f6\u987a\u624b\u6253\u5f00\u7f51\u7edc\u9762\u677f\u770b\u4e00\u773c\u3002',
  'demo.openFile': '\u6253\u5f00\u672c\u5730\u6587\u4ef6',
  'demo.editing': '\u7f16\u8f91\u6a21\u5f0f',
  'demo.viewOnly': '\u53ea\u8bfb\u6a21\u5f0f',
  'demo.saveFile': '\u4fdd\u5b58\u6587\u4ef6',
  'demo.exportPdf': '\u5bfc\u51fa PDF',
  'demo.hint': '\u5728\u7f16\u8f91\u5668\u5185\u6309\u4e0a\u8ff9\u5373\u53ef\u901a\u8fc7\u6587\u4ef6\u6d41\u63d2\u9488\u4fdd\u5b58\u3002',
  'demo.hintKey': 'Ctrl',
  'demo.hintJoin': '+',
  'demo.samplesLabel': '\u6837\u4f8b\u6587\u6863',
  'demo.pickTitle': '\u5148\u9009\u4e00\u4e2a\u6587\u6863\u3002',
  'demo.pickBody': '\u4e0a\u65b9\u53ef\u4ee5\u9009\u4e2a\u6837\u4f8b\uff0c\u4e5f\u53ef\u4ee5\u6253\u5f00\u4f60\u672c\u673a\u7684 .docx\u3001.xlsx \u6216 .pptx \u6587\u4ef6\u3002',
  'demo.startTitle': '\u6b63\u5728\u542f\u52a8\u7f16\u8f91\u5668\u3002',
  'demo.startBody': '\u9996\u6b21\u52a0\u8f7d\u4f1a\u4ece /vendor/ \u62c9\u53d6 OnlyOffice \u5185\u6838\uff0c\u53ef\u80fd\u9700\u8981\u51e0\u79d2\u949f\u3002',
  'demo.errorTitle': '\u65e0\u6cd5\u6253\u5f00\u8be5\u6587\u6863\u3002',
  'demo.retry': '\u91cd\u8bd5',
  'demo.loadingFallback': '\u52a0\u8f7d\u4e2d',
  'demo.opening': '\u6b63\u5728\u6253\u5f00 {name}',
  'demo.booting': '\u6b63\u5728\u542f\u52a8\u7f16\u8f91\u5668',
  'demo.saving': '\u6b63\u5728\u5199\u5165\u6587\u4ef6',
  'demo.exporting': '\u6b63\u5728\u5bfc\u51fa {fmt}',
  'demo.noChanges': '\u6ca1\u6709\u9700\u8981\u4fdd\u5b58\u7684\u4fee\u6539',
  'demo.saved': '\u5df2\u4fdd\u5b58 {name}',

  'status.idle': '\u7a7a\u95f2',
  'status.loading': '\u52a0\u8f7d\u5185\u6838',
  'status.ready': '\u5df2\u5c31\u7eea',
  'status.modified': '\u6709\u672a\u4fdd\u5b58\u4fee\u6539',
  'status.saving': '\u4fdd\u5b58\u4e2d',
  'status.error': '\u5931\u8d25',

  'feat.f1.title': '\u65e0\u9700\u6587\u6863\u670d\u52a1\u5668',
  'feat.f1.body': '\u7f16\u8f91\u5668\u5185\u6838\u5c31\u662f\u81ea\u6258\u7ba1\u7684 OnlyOffice 9.x \u79bb\u7ebf\u6784\u5efa\uff0c\u76f4\u63a5\u6302\u5728 iframe \u91cc\u3002\u4e0d\u9700\u8981\u90e8\u7f72\u3001\u6388\u6743\u6216\u4fdd\u6301\u4e00\u4e2a\u6301\u7eed\u5728\u7ebf\u7684\u6587\u6863\u670d\u52a1\u5668\u3002',
  'feat.f2.title': '\u4e0d\u4f1a\u4e0a\u4f20',
  'feat.f2.body': '\u4f60\u7684\u6587\u4ef6\u4f1a\u88ab\u8f6c\u6210 Blob URL \u5e76\u5728\u539f\u5730\u6253\u5f00\u3002\u7f16\u8f91\u65f6\u6253\u5f00\u7f51\u7edc\u9762\u677f\uff0c\u4e0d\u4f1a\u770b\u5230\u4efb\u4f55\u643a\u5e26\u4f60\u6587\u6863\u5185\u5bb9\u7684\u8bf7\u6c42\u3002',
  'feat.f3.title': '\u547d\u4ee4\u5f0f save()',
  'feat.f3.body': 'postMessage \u6587\u4ef6\u6d41\u63d2\u9488\u4f1a\u62e6\u622a\u7f16\u8f91\u5668\u7684\u4e0b\u8f7d\uff0c\u5e76\u628a\u7f16\u8f91\u540e\u7684\u5b57\u8282\u4ee5 ArrayBuffer \u7684\u5f62\u5f0f\u4ea4\u56de\u7ed9\u4f60\u7684\u7ec4\u4ef6\u3002',
  'feat.f4.title': '\u7ec4\u4ef6\u6216\u7ec4\u5408\u5f0f\u51fd\u6570',
  'feat.f4.body': '\u5e38\u89c1\u573a\u666f\u76f4\u63a5\u7528 VueOnlyOfficeLocal \u7ec4\u4ef6\uff1b\u9700\u8981\u81ea\u5df1\u7ba1\u7406\u6302\u8f7d\u751f\u547d\u5468\u671f\u65f6\uff0c\u8c03\u7528 useOnlyOffice() \u5373\u53ef\u3002',
  'feat.f5.title': '\u4e09\u79cd\u4f7f\u7528\u5165\u53e3',
  'feat.f5.body': '\u7ec4\u4ef6 props\u3001useOnlyOffice() \u7ec4\u5408\u5f0f\u51fd\u6570\u3001\u4ee5\u53ca\u5e95\u5c42\u7684 createEditor() SDK\uff0c\u4e09\u8005\u662f\u5e73\u7ea7\u7684\u5165\u53e3\u3002',
  'feat.f6.title': 'v2 \u4e8b\u4ef6\u96c6',
  'feat.f6.body': '\u9664\u4e86 ready \u548c error\uff0cstate-change\u3001request-close\u3001meta-change \u4e0e save \u4e5f\u90fd\u4f1a\u4ee5 Vue emit \u7684\u5f62\u5f0f\u66b4\u9732\u3002',

  'flow.s1.title': '\u6258\u7ba1\u79bb\u7ebf\u6784\u5efa',
  'flow.s1.body': '\u628a OnlyOffice 9.x \u79bb\u7ebf\u6784\u5efa\u91cc\u7684 vendor/ \u76ee\u5f55\u653e\u5230\u4f60\u57df\u540d\u4e0b\u7684\u4efb\u610f\u4f4d\u7f6e\u3002\u63d2\u4ef6\u4f1a\u4ece <baseUrl>/vendor/web-apps/apps/api/documents/api.js \u52a0\u8f7d DocsAPI\u3002',
  'flow.s2.title': '\u5b89\u88c5\u5e76\u6ce8\u518c',
  'flow.s2.body': 'npm i @zzk-1015/vue-onlyoffice-local\uff0c\u7136\u540e app.use() \u6ce8\u518c\uff0c\u5e76\u7528 defaultBaseUrl \u6307\u5411\u4f60\u653e vendor \u6784\u5efa\u7684\u5730\u5740\u3002',
  'flow.s3.title': '\u4f20\u5165\u6587\u4ef6\uff0c\u8c03\u7528 save()',
  'flow.s3.body': '\u7ed9\u7ec4\u4ef6\u4f20\u5165 File\u3001Blob \u6216 URL\u3002\u7f16\u8f91\u5b8c\u6210\u540e await save() \u5373\u53ef\u62ff\u5230\u7f16\u8f91\u540e\u7684\u5b57\u8282\uff0c\u5168\u7a0b\u4ecd\u7136\u5728\u6d4f\u89c8\u5668\u5185\u3002',

  'feat.eyebrow': '02 \u2014 \u4f60\u80fd\u5f97\u5230\u4ec0\u4e48',
  'feat.title': '\u4e00\u4e2a\u63d2\u4ef6\uff0c\u4e09\u79cd\u7528\u6cd5\u3002',
  'feat.note': '\u7ec4\u4ef6\u662f\u6700\u65b9\u4fbf\u7684\u8def\u5f84\u3002\u5b83\u80fd\u505a\u7684\u4e8b\uff0c\u7ec4\u5408\u5f0f\u51fd\u6570\u548c\u5e95\u5c42 SDK \u4e5f\u90fd\u80fd\u505a\u5230\u3002',

  'flow.eyebrow': '03 \u2014 \u642d\u5efa',
  'flow.title': '\u4e09\u6b65\u4e4b\u5185\u642d\u597d\u7f16\u8f91\u5668\u3002',

  'install.eyebrow': '04 \u2014 \u5b89\u88c5',
  'install.title': '\u63a5\u5165\u73b0\u6709\u7684 Vue \u5e94\u7528\u3002',
  'install.note': '\u552f\u4e00\u7684\u90e8\u7f72\u8981\u6c42\u662f\u81ea\u6258\u7ba1\u7684 OnlyOffice \u79bb\u7ebf\u6784\u5efa\uff0c\u4ece\u4f60\u81ea\u5df1\u7684\u57df\u540d\u4e0b\u7684 /vendor \u8def\u5f84\u63d0\u4f9b\u670d\u52a1\u3002',
  'install.tabInstall': '\u5b89\u88c5',
  'install.tabUsage': '\u4f7f\u7528\u793a\u4f8b',
  'install.copy': '\u590d\u5236',
  'install.copied': '\u5df2\u590d\u5236',

  'footer.tagline': 'MIT \u8bb8\u53ef\u3002\u57fa\u4e8e onlyoffice-web-local \u79bb\u7ebf\u67b6\u6784\u5efa\u3002',
  'footer.source': '\u6e90\u7801',
  'footer.readme': '\u8bf4\u660e',
  'footer.releases': '\u53d1\u5e03\u65e5\u5fd7',
  'footer.issues': '\u95ee\u9898',
}

/** Feature grid, localised. Kept out of the flat dictionary because it is a
 *  structured list rather than a set of independent labels. */
export function features(t: (k: string) => string) {
  return [
    {
      n: '01',
      title: t('feat.f1.title'),
      body: t('feat.f1.body'),
      code: '',
    },
    {
      n: '02',
      title: t('feat.f2.title'),
      body: t('feat.f2.body'),
      code: '',
    },
    {
      n: '03',
      title: t('feat.f3.title'),
      body: t('feat.f3.body'),
      code: 'editor.value.save()',
    },
    {
      n: '04',
      title: t('feat.f4.title'),
      body: t('feat.f4.body'),
      code: 'useOnlyOffice()',
    },
    {
      n: '05',
      title: t('feat.f5.title'),
      body: t('feat.f5.body'),
      code: 'createEditor()',
    },
    {
      n: '06',
      title: t('feat.f6.title'),
      body: t('feat.f6.body'),
      code: '@state-change',
    },
  ]
}

export function steps(t: (k: string) => string) {
  return [
    { n: 'Step 01', title: t('flow.s1.title'), body: t('flow.s1.body') },
    { n: 'Step 02', title: t('flow.s2.title'), body: t('flow.s2.body') },
    { n: 'Step 03', title: t('flow.s3.title'), body: t('flow.s3.body') },
  ]
}

export function createTranslator(locale: { value: Locale }) {
  return function t(key: Key, vars?: Record<string, string | number>): string {
    const dict = locale.value === 'zh' ? zh : en
    let out: string = dict[key] ?? en[key] ?? key
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        out = out.split('{' + k + '}').join(String(v))
      }
    }
    return out
  }
}

export type { Key as MessageKey }
