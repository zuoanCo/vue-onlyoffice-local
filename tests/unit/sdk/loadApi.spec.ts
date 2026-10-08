import { describe, it, expect, beforeEach, vi } from 'vitest';

type LoadApi = (baseUrl: string) => Promise<void>;

/** Each test gets a pristine module so the internal loadedByBase cache is empty. */
async function freshLoadApi(): Promise<LoadApi> {
  vi.resetModules();
  const mod = await import('../../../src/sdk/loadApi');
  return mod.loadApi;
}

function scriptTag(): HTMLScriptElement {
  const el = document.head.querySelector<HTMLScriptElement>('script[data-oo-api]');
  if (!el) throw new Error('no api.js <script> was injected');
  return el;
}

describe('loadApi', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    delete (window as unknown as { DocsAPI?: unknown }).DocsAPI;
  });

  it('derives the DocsAPI entry from baseUrl', async () => {
    const mod = await import('../../../src/sdk/loadApi');
    expect(mod.apiScriptUrl('')).toBe('/vendor/web-apps/apps/api/documents/api.js');
    expect(mod.apiScriptUrl('/')).toBe('/vendor/web-apps/apps/api/documents/api.js');
    expect(mod.apiScriptUrl('app')).toBe('app/vendor/web-apps/apps/api/documents/api.js');
    expect(mod.apiScriptUrl('/app/')).toBe('/app/vendor/web-apps/apps/api/documents/api.js');
  });

  it('injects api.js and resolves once DocsAPI is mounted', async () => {
    const loadApi = await freshLoadApi();
    const pending = loadApi('/');
    const el = scriptTag();
    expect(el.src).toContain('/vendor/web-apps/apps/api/documents/api.js');

    (window as unknown as { DocsAPI: unknown }).DocsAPI = { DocEditor: class {} };
    el.dispatchEvent(new Event('load'));
    await expect(pending).resolves.toBeUndefined();
  });

  it('rejects with the exact failing URL so the user can see the 404', async () => {
    const loadApi = await freshLoadApi();
    const pending = loadApi('/app');
    scriptTag().dispatchEvent(new Event('error'));
    await expect(pending).rejects.toThrow(
      'Failed to load api.js: /app/vendor/web-apps/apps/api/documents/api.js',
    );
  });

  it('reports DocsAPI-not-mounted when api.js is served but defines nothing', async () => {
    const loadApi = await freshLoadApi();
    const pending = loadApi('/');
    scriptTag().dispatchEvent(new Event('load'));
    await expect(pending).rejects.toThrow('DocsAPI not mounted');
  });

  it('removes the dead <script> so a retry can actually re-fetch', async () => {
    const loadApi = await freshLoadApi();

    const first = loadApi('/');
    scriptTag().dispatchEvent(new Event('error'));
    await expect(first).rejects.toThrow(/Failed to load api\.js/);

    // Browsers do not restart an <script> whose load already failed, so the
    // element must be gone for the next attempt to work.
    expect(document.head.querySelector('script[data-oo-api]')).toBeNull();
  });

  it('evicts a failed load so the next mount retries instead of replaying it', async () => {
    const loadApi = await freshLoadApi();

    const first = loadApi('/');
    scriptTag().dispatchEvent(new Event('error'));
    await expect(first).rejects.toThrow(/Failed to load api\.js/);

    // A second call must hand back a NEW promise and a FRESH <script>,
    // not the cached rejection nor the dead element.
    const second = loadApi('/');
    expect(second).not.toBe(first);
    const retryTag = scriptTag();
    retryTag.dispatchEvent(new Event('error'));
    await expect(second).rejects.toThrow(/Failed to load api\.js/);

    // Once the assets are actually in place the retry succeeds.
    // Once the assets are actually in place, the next attempt mounts.
    const third = loadApi('/');
    (window as unknown as { DocsAPI: unknown }).DocsAPI = { DocEditor: class {} };
    scriptTag().dispatchEvent(new Event('load'));
    await expect(third).resolves.toBeUndefined();
  });

  it('short-circuits once DocsAPI exists, regardless of baseUrl', async () => {
    const loadApi = await freshLoadApi();
    (window as unknown as { DocsAPI: unknown }).DocsAPI = { DocEditor: class {} };
    await expect(loadApi('/anything/else')).resolves.toBeUndefined();
    expect(document.head.querySelector('script[data-oo-api]')).toBeNull();
  });
});

