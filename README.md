# dash-bored components

The standard components for [dash-bored](https://github.com/ArvidSU/dash-bored), published as an ordinary Git-pinned external package. MIT licensed.

Install this repository as `core`. Dashboards reference `./components/external/core/button`, `./components/external/core/group`, and the other component directories at the repository root. Each directory contains a schema-v3 `component.yaml`, a self-contained `index.js`, generated CSS, and an `index.d.ts` declaration for API 1.0.0. The full commit is pinned in the dashboard's lock file; no dependency installation is needed by the dashboard.

All components run after normal project trust. The package preserves the initial 17 components, including legacy adapters; extraction does not retire their behavior. The package targets component API 1.0.0 and dashboard contract 4. React and `@dash-bored/component` use the host app's runtime.

## Development

Use Bun 1.3.14. Run `bun install --frozen-lockfile`, edit the readable source under `src/`, then `bun run build`. Run `bun run check`, `bun run typecheck`, and `bun run test` before publishing. Run `dash-bored component setup <component-directory> --tsconfig <tsconfig.json>` to install the public authoring SDK before typechecking, and `dash-bored component check <component-directory> --source-project <tsconfig.json>` to validate a component. Generated component directories are committed so installs are reproducible. Manifests are the authoritative props, children, actions, resources, and permission contracts. Build changes must preserve shared React and import only the public host SDK.

Agents should use the installed dash-bored skill's `references/components.md#standalone-component-authoring` workflow. Above, `dash-bored` means that skill's absolute launcher path, such as `~/.agents/skills/dash-bored/scripts/dash-bored`, or `"$DASH_BORED_TOOL"` when launched by the app; the command is not installed on PATH. Run setup against this repository's `tsconfig.json` after cloning or updating the app. The SDK supplies ambient editor declarations without redirecting runtime React imports, so tests need to mock only the app's virtual component module. Keep `.dash-bored-sdk/` ignored. Standalone source work does not require initializing a dashboard; use an existing development dashboard later for preview.

Updates are explicit. Publish a tag, review the generated output, and update dashboard lock pins intentionally. The app's default pin changes only with an app release. Component code receives permission-gated host callbacks; the app retains topology, framing, trust, drafts, process supervision, and native webview ownership.
