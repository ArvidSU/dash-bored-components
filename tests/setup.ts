import { mock } from "bun:test";
mock.module("@dash-bored/component", () => ({useComponentVisibility: () => true, trackActivity: <T>(work: Promise<T>) => work, TerminalSurface: () => null}));
