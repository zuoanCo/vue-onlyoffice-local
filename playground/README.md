# Playground

This is a local playground to test the `vue-onlyoffice-local` plugin.

## Setup

1.  **Crucial Step**: You must copy the OnlyOffice Web SDK and WASM files to the `playground/public/libs` directory.
    
    Structure should look like:
    ```
    playground/
      public/
        libs/
          sdk.js
          sdk-all.js
          sdk-all-min.js
          x2t.js
          x2t.wasm
          ... (other assets)
    ```

    You can get these files from the original [onlyoffice-web-local](https://github.com/sweetwisdom/onlyoffice-web-local) repository or build them.

2.  **Run**:
    ```bash
    npm run dev:playground
    ```

3.  **Use**:
    Open the browser, select a local `.docx` file, and see it load!
