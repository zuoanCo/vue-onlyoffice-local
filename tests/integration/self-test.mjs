// Auto-generated self-test driver.
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const PORT = 5173;
const BASE_URL = "http://127.0.0.1:" + PORT;

function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }
async function waitForServer(url, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try { const r = await fetch(url + "/"); if (r.ok || r.status === 304) return; } catch {}
    await wait(250);
  }
  throw new Error("Server did not become ready: " + url);
}

function startVite() {
  const viteBin = path.join(repoRoot, "node_modules", "vite", "bin", "vite.js");
  const cmd = process.execPath;
  const child = spawn(cmd, [
    viteBin, "--config", "vite.config.integration.ts",
    "--port", String(PORT), "--host", "127.0.0.1",
  ], { cwd: repoRoot, stdio: ["ignore", "pipe", "pipe"], windowsHide: true, env: process.env });
  child.stdout.on("data", (b) => process.stdout.write("[vite] " + b));
  child.stderr.on("data", (b) => process.stderr.write("[vite!] " + b));
  return child;
}

const report = [];
let exitCode = 0;
function record(check, ok, detail) {
  report.push({ check, ok, detail });
  const tag = ok ? "PASS" : "FAIL";
  console.log("[" + tag + "] " + check + (detail ? " :: " + detail : ""));
  if (!ok) exitCode = 1;
}

async function main() {
  let playwright = null;
  try { playwright = await import("playwright-core"); } catch (e) {
    console.error("[self-test] failed to import playwright-core: " + e.message);
    process.exit(2);
  }
  const chromium = playwright.chromium;

  console.log("[self-test] starting vite dev server on :" + PORT + " ...");
  const vite = startVite();
  let stopped = false;
  async function cleanup() { if (stopped) return; stopped = true; try { vite.kill(); } catch {} }
  let browser;

  try {
    await waitForServer(BASE_URL, 45000);
    console.log("[self-test] vite ready");
    const exePaths = [
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    ];
    let executablePath;
    for (const p of exePaths) { if (fs.existsSync(p)) { executablePath = p; break; } }
    const launchOpts = { headless: true };
    if (executablePath) launchOpts.executablePath = executablePath;
    else console.log("[self-test] no system browser found; relying on playwright bundled chromium");

    browser = await chromium.launch(launchOpts);
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    page.on("console", (msg) => { if (msg.type() === "error") console.log("  [page-error] " + msg.text()); });
    page.on("pageerror", (e) => console.log("  [pageerror] " + e.message));

    const resp = await page.goto(BASE_URL + "/", { waitUntil: "networkidle", timeout: 30000 });
    record("harness GET /", !!resp && resp.ok(), "status=" + (resp ? resp.status() : "none"));

    await page.waitForFunction(() => !!(window.__docxState && window.__docxState.mounted >= 1), null, { timeout: 20000 });
    try {
      const out = path.join(repoRoot, 'tests', 'integration', 'self-test.png');
      await page.screenshot({ path: out, fullPage: false });
      console.log("[self-test] screenshot -> " + out);
    } catch (e) {
      console.log("[self-test] screenshot failed: " + e.message);
    }
    const docxState = await page.evaluate(() => {
      const s = window.__docxState;
      return {
        installed: !!s.installed,
        apiVersion: s.apiVersion,
        mounted: s.mounted,
        destroyed: s.destroyed,
        lastDocumentTitle: s.lastDocumentTitle,
        lastConfig: s.lastConfig,
        lastEventsNames: s.lastEvents ? Object.keys(s.lastEvents) : [],
        mountedOrder: s.mountedOrder || [],
      };
    });

    record("mock DocsAPI installed", docxState.installed, "v=" + docxState.apiVersion);
    record("createEditor invoked once", docxState.mounted === 1, "mounted=" + docxState.mounted);
    record("document mounted", !!docxState.lastConfig && !!docxState.lastConfig.document);

    const cfg = docxState.lastConfig || {};
    const doc = cfg.document || {};
    record("document.fileType=docx", doc.fileType === "docx", "got=" + doc.fileType);
    record("document.title set", typeof doc.title === "string" && doc.title.length > 0, "got=" + doc.title);
    record("document.key starts with doc-", typeof doc.key === "string" && doc.key.startsWith("doc-"), "key=" + doc.key);
    record("document.url is blob:", typeof doc.url === "string" && doc.url.startsWith("blob:"), "url=" + doc.url);
    record("permissions.edit=true", !!(doc.permissions && doc.permissions.edit === true));
    record("permissions.download=true", !!(doc.permissions && doc.permissions.download === true));

    const events = await page.evaluate(() => (window.__harness && window.__harness.events.slice()) || []);
    record("harness emitted ready", events.some((e) => e.name === "ready"), "count=" + events.length);
    record("harness emitted document-ready", events.some((e) => e.name === "document-ready"));
    record("SDK config wires >=6 events", docxState.lastEventsNames.length >= 6, "have=" + docxState.lastEventsNames.length);

    const cfgHookResult = await page.evaluate(() => window.__docxState && window.__docxState.lastConfig && window.__docxState.lastConfig.document);
    record("configHook invoked", !!cfgHookResult && cfgHookResult.title === "overridden-by-configHook.docx", "title=" + (cfgHookResult && cfgHookResult.title));

    console.log("[self-test] triggering imperative save()...");
    const saveOutcome = await page.evaluate(async () => {
      const t = window.__harness && window.__harness.triggerSave;
      if (!t) return { error: "triggerSave missing" };
      return await t();
    });
    const r = saveOutcome && (saveOutcome.buffer ? saveOutcome : (saveOutcome.result || saveOutcome));
    record("save() resolved", !!(r && r.buffer), "outcomeKeys=" + Object.keys(saveOutcome || {}));
    const meta = await page.evaluate(() => window.__harness && window.__harness.lastSaveMeta);
    if (r) {
      record("SaveResult.fileName set", typeof r.fileName === "string" && r.fileName.length > 0, "name=" + r.fileName);
      record("SaveResult.fileType set", typeof r.fileType === "string" && r.fileType.length > 0, "type=" + r.fileType);
    }
    record("SaveResult carries bytes (lastSaveMeta.bytes > 0)",
      !!(meta && meta.hasBuffer && typeof meta.bytes === "number" && meta.bytes > 0),
      "metaBytes=" + (meta && meta.bytes) + ", ctor=" + (meta && meta.ctor));

    console.log("[self-test] unmount + remount to test state-change and lifecycle...");
    await page.goto("about:blank", { waitUntil: "load" });
    await wait(120);

    const page2 = await context.newPage();
    page2.on("console", (msg) => { if (msg.type() === "error") console.log("  [page2-error] " + msg.text()); });
    page2.on("pageerror", (e) => console.log("  [page2-error] " + e.message));
    await page2.goto(BASE_URL + "/", { waitUntil: "networkidle" });
    await page2.waitForFunction(() => !!(window.__docxState && window.__docxState.mounted >= 1), null, { timeout: 20000 });

    const fmtResult = await page2.evaluate(async () => {
      const t = window.__harness && window.__harness.triggerSave;
      if (!t) return null;
      return await t("pdf");
    });
    const r2 = fmtResult && (fmtResult.buffer ? fmtResult : (fmtResult.result || fmtResult));
    record("save(pdf) resolves", !!r2, "haveResult=" + !!fmtResult);
    const meta2 = await page2.evaluate(() => window.__harness && window.__harness.lastSaveMeta);
    record("save(pdf) carries bytes", !!meta2 && typeof meta2.bytes === "number" && meta2.bytes > 0,
      "bytes=" + (meta2 && meta2.bytes));

    const counts = await page2.evaluate(() => ({ mounted: window.__docxState.mounted, destroyed: window.__docxState.destroyed }));
    record("second mount re-instantiates DocEditor", counts.mounted === 1, "mountCount=" + counts.mounted);

    await page2.close();
    await wait(150);
    const afterClose = await page2.evaluate(() => ({ destroyed: window.__docxState.destroyed })).catch(() => null);
    if (afterClose) record("destroyEditor fired on unmount", afterClose.destroyed >= 1, "destroyed=" + afterClose.destroyed);
  } catch (err) {
    record("uncaught exception", false, String((err && err.stack) || err));
  } finally {
    if (browser) try { await browser.close(); } catch {}
    await cleanup();
  }

  const total = report.length;
  const passed = report.filter((r) => r.ok).length;
  console.log("");
  console.log("=== self-test report ===");
  console.log("passed: " + passed + "/" + total);
  if (passed !== total) {
    console.log("failures:");
    for (const r of report.filter((x) => !x.ok)) console.log("  - " + r.check + ": " + r.detail);
  }
  process.exit(exitCode);
}

main().catch((e) => { console.error("[self-test] fatal:", e); process.exit(2); });