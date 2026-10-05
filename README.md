# dash-bored components

The standard components for [dash-bored](https://github.com/ArvidSU/dash-bored), published as an ordinary Git-pinned external package. MIT licensed.

Install this repository as `core`. Dashboards reference `./components/external/core/button`, `./components/external/core/group`, and the other component directories at the repository root. Each directory contains a schema-v2 `component.yaml`, a self-contained `index.tsx`, and generated CSS. The full commit is pinned in the dashboard's lock file; no dependency installation is needed by the dashboard.

All components run after normal project trust. The package preserves the initial 17 components, including legacy adapters; extraction does not retire their behavior. Initial compatibility: dash-bored dashboard contract 4 and its component runtime SDK (`useComponentVisibility`, `trackActivity`, and `TerminalSurface`). React and `@dash-bored/component` use the host app's runtime.

## Development

Use Bun 1.3.14. Run `bun install --frozen-lockfile`, edit the readable source under `src/`, then `bun run build`. Run `bun run check` and `bun test ./tests` before publishing. Generated component directories are committed so installs are reproducible. Manifests are the authoritative props, children, actions, resources, and permission contracts. Build changes must preserve shared React and import only the public host SDK.

Updates are explicit. Publish a tag, review the generated output, and update dashboard lock pins intentionally. The app's default pin changes only with an app release. Component code receives permission-gated host callbacks; the app retains topology, framing, trust, drafts, process supervision, and native webview ownership.
