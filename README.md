# dash-bored components

The standard components for [dash-bored](https://github.com/ArvidSU/dash-bored), published as an ordinary Git-pinned external package. MIT licensed.

Install this repository as `core`. Dashboards reference `./components/external/core/button`, `./components/external/core/group`, and the other component directories at the repository root. Each directory contains a schema-v3 `component.yaml`, its editable `index.tsx`, and any component CSS for API 1.0.0. Manifests declare `sourceRoot: ..` so components can import the common `shared/` helpers and other component sources within this package. The app compiles these sources through the same public compiler used for local components. The full commit is pinned in the dashboard's lock file; no dependency installation is needed by the dashboard.

All components run after normal project trust. The package preserves the initial 17 components, including legacy adapters; extraction does not retire their behavior. The package targets component API 1.0.0 and dashboard contract 4. React and `@dash-bored/component` use the host app's runtime.

## Development

List item colors and glyphs come from `state` or `done`, never from detail or
tags. Emit `healthy`/`success`, `warning`/`pending`/`running`, `error`/`failed`,
or `unknown` for explicit observations; arbitrary states stay neutral. `online`
indicates observed liveness without claiming a healthcheck passed. Per-item
process feedback uses an amber triangle for Running/Stopping, a green check for
Finished, and a red cross for failures, based on the actual owned process run.

Use Bun 1.3.14. Run `bun install --frozen-lockfile`, then edit the component directories or `shared/` directly. There is no core-specific compilation or generated component entry to rebuild. Run `dash-bored component setup button --tsconfig tsconfig.json` to install the public authoring SDK, then `bun run check`, `bun run typecheck`, and `bun run test` before publishing. The check script invokes the public component checker for all 17 entries through the included `dash-bored.sh` launcher; it requires a compatible app tool. Package-only CI runs the source/dependency regression tests; the dash-bored app integration suite compiles the whole package. Run `dash-bored component check <component-directory> --source-project tsconfig.json` for each changed component to verify its source with the public checker and production bundler. Manifests are the authoritative props, children, actions, resources, and permission contracts. Build changes must preserve shared React and import only the public host SDK.

Agents should use the installed dash-bored skill's `references/components.md#standalone-component-authoring` workflow. Above, `dash-bored` means that skill's absolute launcher path, such as `~/.agents/skills/dash-bored/scripts/dash-bored`, or `"$DASH_BORED_TOOL"` when launched by the app; the command is not installed on PATH. Run setup against this repository's `tsconfig.json` after cloning or updating the app. The SDK supplies ambient editor declarations without redirecting runtime React imports, so tests need to mock only the app's virtual component module. Keep `.dash-bored-sdk/` ignored. Standalone source work does not require initializing a dashboard; use an existing development dashboard later for preview.

Updates are explicit. Publish a tag, review the source changes, and update dashboard lock pins intentionally. The app's default pin changes only with an app release. Component code receives permission-gated host callbacks; the app retains topology, framing, trust, drafts, process supervision, and native webview ownership.

## Prepared browser dependencies

Markdown imports `vendor/react-markdown.js`, a committed browser dependency
prepared with the public authoring tool. Dashboard installation needs only Git;
it never installs npm packages or runs a package lifecycle script. React and
`@dash-bored/component` remain supplied by the host. To update the dependency,
update `react-markdown` and the lockfile, install dependencies, then run:

```sh
dash-bored component prepare . --dependency react-markdown --output vendor/react-markdown.js
```

Review the dependency output and its adjacent declaration before publishing.
The declaration records the small synchronous renderer interface used here.
`THIRD_PARTY_NOTICES.md` carries the bundled dependency licenses.
Do not prepare the component sources themselves: their manifests point directly
at the editable TSX entries.
