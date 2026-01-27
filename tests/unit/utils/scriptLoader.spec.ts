import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadScript } from '../../../src/utils/scriptLoader';

describe('scriptLoader', () => {
  let appendChildSpy: any;
  let createElementSpy: any;
  let head: HTMLElement;

  beforeEach(() => {
    // Reset DOM
    document.head.innerHTML = '';
    head = document.head;
    
    // Spy on DOM methods
    appendChildSpy = vi.spyOn(head, 'appendChild');
    createElementSpy = vi.spyOn(document, 'createElement');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Clear the cache manually if possible, or we rely on unique URLs in tests
    // Since we can't easily clear the module-level variable `loadedScripts`, 
    // we should use unique URLs for each test case or accept caching behavior.
  });

  it('should load a script successfully', async () => {
    const url = 'https://example.com/script1.js';
    const promise = loadScript(url);

    // Verify script element creation
    expect(createElementSpy).toHaveBeenCalledWith('script');
    expect(appendChildSpy).toHaveBeenCalled();

    // Get the created script element
    const script = appendChildSpy.mock.calls[0][0] as HTMLScriptElement;
    expect(script.src).toBe(url);
    expect(script.type).toBe('text/javascript');

    // Simulate load event
    script.onload?.(new Event('load'));

    await expect(promise).resolves.toBeUndefined();
  });

  it('should fail if script loading errors', async () => {
    const url = 'https://example.com/error-script.js';
    const promise = loadScript(url);

    const script = appendChildSpy.mock.calls[0][0] as HTMLScriptElement;
    
    // Simulate error event
    script.onerror?.(new Event('error'));

    await expect(promise).rejects.toThrow(`Failed to load script: ${url}`);
  });

  it('should return cached promise for same URL', () => {
    const url = 'https://example.com/cached.js';
    const promise1 = loadScript(url);
    const promise2 = loadScript(url);

    expect(promise1).toBe(promise2);
    expect(createElementSpy).toHaveBeenCalledTimes(1);
  });

  it('should resolve immediately if script with ID exists', async () => {
    const url = 'https://example.com/existing.js';
    const id = 'existing-script-id';

    // Create existing script
    const existingScript = document.createElement('script');
    existingScript.id = id;
    document.body.appendChild(existingScript);
    
    // Clear mocks after setup to avoid counting the setup calls
    createElementSpy.mockClear();

    const promise = loadScript(url, id);

    await expect(promise).resolves.toBeUndefined();
    // Should not create new script
    expect(createElementSpy).not.toHaveBeenCalledWith('script');
  });
});
