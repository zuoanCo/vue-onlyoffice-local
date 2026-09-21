/**
 * TEST-ONLY mock OnlyOffice DocsAPI.
 *
 * This file is NOT shipped in the npm package and NOT expected to exist in
 * real deployments. It exists to let the vue-onlyoffice-local self-test
 * drive the SDK without the ~700MB OnlyOffice 9.x offline vendor build.
 *
 * Behavior contract (matches the real DocsAPI surface exercised by
 * src/sdk/createEditor.ts):
 *  - window.DocsAPI.DocEditor(id, config) returns an instance
 *  - constructor fires onAppReady synchronously, onDocumentReady after 1 tick
 *  - instance.destroyEditor() is idempotent and sets destroyed = true
 *  - instance.downloadAs(format?) schedules a 'onlyoffice-file-stream'
 *    postMessage to its parent window with a tiny 8-byte ArrayBuffer
 *  - instance.setMetaData({title}) schedules a onMetaChange event
 *
 * Inspect the last config / events at window.__docxState.
 */
(function () {
  if (window.__docxState && window.__docxState.installed) {
    // Already installed (re-injected after navigation).
    return;
  }
  window.__docxState = window.__docxState || {
    installed: false,
    mounted: 0,
    destroyed: 0,
    saveRequests: 0,
    lastConfig: null,
    lastEvents: null,
    lastDocumentTitle: null,
    saveBuffer: null,
    stateModifications: 0,
  };

  function emit(name, event) {
    const fn = window.__docxState.lastEvents && window.__docxState.lastEvents[name];
    if (typeof fn === 'function') {
      try { fn(event); } catch (e) { console.error('[mock-docsapi]', name, e); }
    }
  }

  class MockDocEditor {
    constructor(id, config) {
      this.id = id;
      this.config = config;
      this.destroyed = false;
      this.state = { state__docx: window.__docxState };
      window.__docxState.mounted += 1;
      window.__docxState.lastConfig = config;
      window.__docxState.lastEvents = (config && config.events) || {};
      window.__docxState.lastDocumentTitle =
        (config && config.document && config.document.title) || null;

      // Synchronous onAppReady (real DocsAPI also fires it from the iframe
      // once the api scripts finish loading).
      const raf =
        typeof requestAnimationFrame === 'function'
          ? requestAnimationFrame
          : (cb) => setTimeout(cb, 0);
      raf(() => {
        if (this.destroyed) return;
        emit('onAppReady', {});
        window.__docxState.mountedOrder = (window.__docxState.mountedOrder || []).concat([
          'appReady:' + id,
        ]);
        raf(() => {
          if (this.destroyed) return;
          emit('onDocumentReady', {});
          window.__docxState.mountedOrder.push('documentReady:' + id);
        });
      });

      // Stand in for the editor iframe: the SDK's saveStream hook looks for
      // container.querySelector('iframe') and hooks into its contentWindow.
      // We expose a fake iframe on the mount node so that hookDownloadInFrame
      // succeeds. See src/sdk/saveStream.ts hookDownloadInFrame.
      const host = document.getElementById(id);
      if (host) {
        host.innerHTML = '';
        const fakeFrame = document.createElement('iframe');
        fakeFrame.style.width = '100%';
        fakeFrame.style.height = '100%';
        fakeFrame.style.border = '0';
        fakeFrame.setAttribute('data-mock-onlyoffice-iframe', '1');
        // Same-origin blank document keeps the postMessage flow simple.
        fakeFrame.srcdoc =
          '<!doctype html><html><body data-mock-onlyoffice-iframe="1"></body></html>';
        host.appendChild(fakeFrame);

        // Hook into the iframe's contentWindow so saveStream.hookDownloadInFrame
        // can patch AscCommon.DownloadFileFromBytes on it.
        fakeFrame.addEventListener('load', () => {
          try {
            const win = fakeFrame.contentWindow;
            win.AscCommon = win.AscCommon || {};
            win.AscCommon.DownloadFileFromBytes = function (data, fileName, _mime) {
              const buf =
                data instanceof ArrayBuffer
                  ? data
                  : new ArrayBuffer(0);
              let buffer;
              try {
                // Mirror the upstream hook: try to transfer the buffer,
                // fall back to a cloned slice.
                buffer = buf.slice(0);
                win.parent.postMessage(
                  {
                    type: 'onlyoffice-file-stream',
                    fileName: fileName || 'mock.docx',
                    fileType:
                      String(fileName || 'mock.docx')
                        .split('.')
                        .pop()
                        .toLowerCase() || 'docx',
                    buffer,
                  },
                  '*',
                  [buffer]
                );
              } catch (_e) {
                win.parent.postMessage(
                  {
                    type: 'onlyoffice-file-stream',
                    fileName: fileName || 'mock.docx',
                    fileType:
                      String(fileName || 'mock.docx')
                        .split('.')
                        .pop()
                        .toLowerCase() || 'docx',
                    buffer: buffer ? buffer.slice(0) : new ArrayBuffer(0),
                  },
                  '*'
                );
              }
              if (
                win.OO_FILE_STREAM_ONLY === true ||
                window.OO_FILE_STREAM_ONLY === true
              ) {
                return;
              }
              // Otherwise, simulate the browser download by stashing a copy
              // on window.__docxState.saveBuffer.
              window.__docxState.saveBuffer = buffer;
            };
          } catch (e) {
            console.error('[mock-docsapi] iframe hook failed:', e);
          }
        });
      }
    }

    destroyEditor() {
      if (this.destroyed) return;
      this.destroyed = true;
      window.__docxState.destroyed += 1;
      window.__docxState.mountedOrder =
        window.__docxState.mountedOrder || [];
      window.__docxState.mountedOrder.push('destroyed:' + this.id);
      const host = document.getElementById(this.id);
      if (host) host.innerHTML = '';
    }

    downloadAs(format) {
      window.__docxState.saveRequests += 1;
      window.__docxState.lastDownloadFormat = format || null;
      // Emit onDownloadAs to mirror the SDK's already-handled case (it
      // ignores the callback in offline mode). Following that, the SDK
      // expects a 'onlyoffice-file-stream' message; we trigger the same
      // code path by calling our hooked DownloadFileFromBytes.
      const iframe = document.querySelector(
        '[data-mock-onlyoffice-iframe="1"]'
      );
      const win = iframe && iframe.contentWindow;
      if (win && win.AscCommon && win.AscCommon.DownloadFileFromBytes) {
        // Synthesize an 8-byte payload so the postMessage carries real
        // bytes that the SDK converts to ArrayBuffer.
        const payload = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1, 2, 3, 4]);
        // Match the SDK's save() precondition: temporarily flip the
        // OO_FILE_STREAM_ONLY flag so the mock respects the swallow.
        window.OO_FILE_STREAM_ONLY = true;
        try {
          win.AscCommon.DownloadFileFromBytes(
            payload.buffer,
            format
              ? 'mock-document.' + format
              : (this.config &&
                  this.config.document &&
                  this.config.document.title) ||
                  'mock.docx'
          );
        } finally {
          window.OO_FILE_STREAM_ONLY = false;
        }
      }
      emit('onDownloadAs', {});
    }

    setMetaData(meta) {
      const title = meta && meta.title;
      if (title) {
        window.__docxState.lastDocumentTitle = title;
        emit('onMetaChange', { data: meta });
      }
    }
  }

  window.DocsAPI = { DocEditor: MockDocEditor };
  window.__docxState.installed = true;
  window.__docxState.apiVersion = 'mock-2.0.0';
  console.log('[mock-docsapi] installed; surface:', Object.keys(window.DocsAPI));
})();
