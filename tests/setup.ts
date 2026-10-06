import { mock } from "bun:test";
// The component module is virtual in the app; React resolves normally in tests.
mock.module("@dash-bored/component", () => ({ useComponentVisibility: () => true, trackActivity: <T>(work: Promise<T>) => work, TerminalSurface: () => null }));
