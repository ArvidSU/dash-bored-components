import "./component.css";
// src/renderer/builtins/command/index.tsx
import { TerminalSurface } from "@dash-bored/component";
import { useEffect, useState } from "react";

// src/renderer/builtins/shared.tsx
import { jsxDEV } from "react/jsx-dev-runtime";
function stringProp(props, names, fallback = "") {
  for (const name of names) {
    if (typeof props[name] === "string")
      return props[name];
  }
  return fallback;
}
function CapabilityGate({
  title,
  children
}) {
  return /* @__PURE__ */ jsxDEV("div", {
    className: "component-state component-state--locked",
    children: [
      /* @__PURE__ */ jsxDEV("span", {
        className: "component-state__icon",
        "aria-hidden": "true",
        children: "◇"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV("strong", {
        children: title
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV("span", {
        children
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}

// src/shared/process-state.ts
function processRun(snapshot) {
  if (snapshot === undefined)
    return;
  const run = normalizedRun(snapshot.run);
  if (run !== undefined)
    return run;
  if (snapshot.interactive === true)
    return;
  return normalizedRun(snapshot);
}
function normalizedRun(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return;
  const record = value;
  const phase = record.phase;
  if (phase !== "running" && phase !== "stopping" && phase !== "exited" && phase !== "failed")
    return;
  return {
    phase,
    exitCode: typeof record.exitCode === "number" ? record.exitCode : null,
    signal: typeof record.signal === "string" ? record.signal : null,
    startedAt: typeof record.startedAt === "string" ? record.startedAt : "",
    ...typeof record.durationMs === "number" ? { durationMs: record.durationMs } : {}
  };
}
function isProcessRunActive(snapshot) {
  const phase = processRun(snapshot)?.phase;
  return phase === "running" || phase === "stopping";
}
function isProcessLive(snapshot) {
  return snapshot?.phase === "running" || snapshot?.phase === "stopping";
}
function processRunOutcome(run) {
  if (run.phase === "running")
    return "running";
  if (run.phase === "stopping")
    return "stopping";
  if (run.signal !== null)
    return run.signal;
  if (run.exitCode !== null)
    return `exit ${run.exitCode}`;
  return run.phase === "failed" ? "failed to start" : "exited";
}
function processRunFailed(run) {
  return (run.phase === "exited" || run.phase === "failed") && !(run.exitCode === 0 && run.signal === null);
}

// src/renderer/lib/actions.ts
function normalize(value) {
  return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
}
function verbLabel(verb, label) {
  return normalize(label).split(" ")[0] === normalize(verb) ? label : `${verb} ${label}`;
}

// src/renderer/builtins/command/index.tsx
import { jsxDEV as jsxDEV2 } from "react/jsx-dev-runtime";
function Command({
  props,
  host: componentHost
}) {
  const processApi = componentHost.processes;
  const process = processApi?.get();
  const live = isProcessLive(process);
  const runActive = isProcessRunActive(process);
  const stopping = process?.phase === "stopping";
  const run = processRun(process);
  const attachOnly = processApi?.attachOnly === true;
  const canStart = !attachOnly && Boolean(processApi?.start);
  const canStop = Boolean(processApi?.stop);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [terminalVisible, setTerminalVisible] = useState(attachOnly ? process !== undefined && process.phase !== "idle" : live);
  const [scrollToLatest, setScrollToLatest] = useState(0);
  const label = stringProp(props, ["label", "title"], "Run command");
  const command = stringProp(props, ["command"]);
  useEffect(() => componentHost.actions.register({
    id: "run",
    label: verbLabel("Run", label),
    description: "Run the configured command with selected item values in DASH_ITEM_* environment variables.",
    enabled: Boolean(processApi?.start) && !runActive && !stopping,
    disabledReason: !processApi?.start ? "Trust this project to run the command." : runActive ? "This command is already running." : stopping ? "This terminal is closing." : undefined,
    invocationOutcome: "started",
    process,
    run: async (_selections, args = {}) => {
      if (!processApi?.start)
        throw new Error("The command is unavailable.");
      const itemEnvironment = {};
      for (const [field, value] of Object.entries(args)) {
        if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(field) || typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
          throw new Error(`Unsupported item action argument: ${field}`);
        }
        const key = `DASH_ITEM_${field.toUpperCase()}`;
        if (key in itemEnvironment)
          throw new Error(`Duplicate item environment name: ${key}`);
        itemEnvironment[key] = String(value);
      }
      setTerminalVisible(true);
      const started = await processApi.start(itemEnvironment);
      if (started.phase === "failed" || started.run?.phase === "failed") {
        throw new Error("The command could not start. Inspect its process output.");
      }
    }
  }), [componentHost.actions, label, processApi?.start, process, runActive, stopping]);
  useEffect(() => {
    if (live)
      setTerminalVisible(true);
  }, [live]);
  if (!processApi || !attachOnly && (!processApi.start || !processApi.stop)) {
    return /* @__PURE__ */ jsxDEV2(CapabilityGate, {
      title: label,
      children: "Trust this project to run its configured command."
    }, undefined, false, undefined, this);
  }
  async function runQuickAction() {
    const run2 = processApi?.runQuickAction;
    if (!run2)
      return;
    setPending(true);
    setError(null);
    setTerminalVisible(true);
    try {
      await run2();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setPending(false);
    }
  }
  async function openTerminal() {
    const open = processApi?.open;
    if (!open)
      return;
    setPending(true);
    setError(null);
    setTerminalVisible(true);
    try {
      await open();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setPending(false);
    }
  }
  async function closeTerminal() {
    const stop = processApi?.stop;
    if (!stop)
      return;
    setPending(true);
    setError(null);
    try {
      await stop();
      if (!attachOnly)
        setTerminalVisible(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setPending(false);
    }
  }
  return /* @__PURE__ */ jsxDEV2("div", {
    className: "command",
    children: [
      /* @__PURE__ */ jsxDEV2("div", {
        className: "command__content",
        children: [
          /* @__PURE__ */ jsxDEV2("strong", {
            children: label
          }, undefined, false, undefined, this),
          command ? /* @__PURE__ */ jsxDEV2("code", {
            children: command
          }, undefined, false, undefined, this) : null,
          run ? /* @__PURE__ */ jsxDEV2("span", {
            className: runActive ? "phase phase--running" : processRunFailed(run) ? "phase phase--failed" : "phase",
            title: runActive ? "The command is running." : "Result of the latest run.",
            children: processRunOutcome(run)
          }, undefined, false, undefined, this) : live ? /* @__PURE__ */ jsxDEV2("span", {
            className: "phase",
            children: "open"
          }, undefined, false, undefined, this) : null
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV2("div", {
        className: "command__actions",
        children: [
          terminalVisible ? /* @__PURE__ */ jsxDEV2("button", {
            className: "button button--quiet button--small",
            type: "button",
            onClick: () => setScrollToLatest((value) => value + 1),
            children: "Latest output"
          }, undefined, false, undefined, this) : null,
          canStart && !live ? /* @__PURE__ */ jsxDEV2("button", {
            className: "button button--quiet button--small",
            type: "button",
            disabled: pending,
            onClick: () => void openTerminal(),
            children: "Open terminal"
          }, undefined, false, undefined, this) : null,
          canStart ? /* @__PURE__ */ jsxDEV2("button", {
            className: "button button--primary",
            type: "button",
            disabled: pending || stopping || runActive,
            title: runActive ? "The command is running. Press Ctrl-C in the terminal or close it to stop." : undefined,
            onClick: () => void runQuickAction(),
            children: pending ? "Working…" : runActive ? "Running…" : label
          }, undefined, false, undefined, this) : null,
          live && canStop ? /* @__PURE__ */ jsxDEV2("button", {
            className: "button button--danger",
            type: "button",
            disabled: pending || stopping,
            onClick: () => void closeTerminal(),
            children: "Close terminal"
          }, undefined, false, undefined, this) : null
        ]
      }, undefined, true, undefined, this),
      terminalVisible ? /* @__PURE__ */ jsxDEV2(TerminalSurface, {
        process,
        onWrite: processApi.write,
        onResize: processApi.resize,
        scrollToLatest,
        label: `Interactive terminal for ${label}`
      }, undefined, false, undefined, this) : null,
      error ? /* @__PURE__ */ jsxDEV2("p", {
        className: "inline-error",
        role: "alert",
        children: error
      }, undefined, false, undefined, this) : null
    ]
  }, undefined, true, undefined, this);
}
export {
  Command as default
};
