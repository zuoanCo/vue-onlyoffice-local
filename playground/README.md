# Playground

Local playground for `vue-onlyoffice-local`.

## Run

```bash
npm run dev:playground
```

Open http://localhost:3000, pick a local `.docx`, and the editor mounts.

## Offline assets (v2 layout)

v2 loads DocsAPI from a **single** entry point:

```
<baseUrl>/vendor/web-apps/apps/api/documents/api.js
```

`baseUrl` defaults to `/`, so with the default setup the file has to be reachable at
`/vendor/web-apps/apps/api/documents/api.js`.

To test against the real editor, download the offline build
([onlyoffice-web-local releases](https://github.com/sweetwisdom/onlyoffice-web-local/releases),
`html.zip`, ~700 MB) and replace the whole `playground/public/vendor` directory with the
`vendor/` folder from that archive:

```
playground/public/vendor/
  web-apps/apps/api/documents/api.js   <-- DocsAPI entry
  sdkjs/                               <-- editor kernel
  web-apps/apps/documenteditor/...     <-- editor UI
```

Deploying under a sub-path? Set the **baseUrl** field in the playground toolbar to that
prefix (e.g. `/my-app/`); the editor uses it to resolve every asset.

> The `playground/public/vendor` directory checked into this repo contains a small **stub**
> `api.js` (see the `TEST-ONLY mock` banner at the top of that file) so the playground boots
> without the 700 MB build. Replace the directory to exercise the real editor.

## The v1 layout is gone

v1.0.x asked for `public/libs/sdk.js` + `public/libs/x2t.js`. No OnlyOffice release ever
shipped a file named `sdk.js`, and v2 dropped x2t entirely. If you are upgrading, delete
`public/libs` and follow the `vendor/` layout above.
