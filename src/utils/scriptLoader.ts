const loadedScripts: Record<string, Promise<void> | undefined> = {};

export function loadScript(url: string, id?: string): Promise<void> {
  if (loadedScripts[url]) {
    return loadedScripts[url]!;
  }

  if (id && document.getElementById(id)) {
    loadedScripts[url] = Promise.resolve();
    return loadedScripts[url]!;
  }

  loadedScripts[url] = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    if (id) script.id = id;

    script.onload = () => {
      resolve();
    };

    script.onerror = (e) => {
      delete loadedScripts[url];
      reject(new Error(`Failed to load script: ${url}`));
    };

    document.head.appendChild(script);
  });

  return loadedScripts[url]!;
}
