import { mock } from "bun:test";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

// Authoring path aliases point at declarations. Tests explicitly supply their
// installed React runtime, just as the real app supplies its shared runtime.
const require = createRequire(import.meta.url);
const reactDirectory = dirname(require.resolve("react/package.json"));
const React = require(join(reactDirectory, "index.js"));
mock.module("react", () => ({ ...React, default: React }));
mock.module("react/jsx-runtime", () => require(join(reactDirectory, "jsx-runtime.js")));
mock.module("react/jsx-dev-runtime", () => require(join(reactDirectory, "jsx-dev-runtime.js")));
mock.module("@dash-bored/component", () => ({ useComponentVisibility: () => true, trackActivity: <T>(work: Promise<T>) => work, TerminalSurface: () => null }));
