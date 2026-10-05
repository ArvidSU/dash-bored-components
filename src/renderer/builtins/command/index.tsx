import { TerminalSurface } from "@dash-bored/component";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import "./command.css";
import type { ComponentRendererProps } from "../types";
import { CapabilityGate, stringProp } from "../shared";
import { isProcessLive, isProcessRunActive, processRun, processRunFailed, processRunOutcome } from "../../../shared/process-state";
import { verbLabel } from "../../lib/actions";

export default function Command({
  props,
  host: componentHost,
}: ComponentRendererProps): ReactNode {
  const processApi = componentHost.processes;
  const process = processApi?.get();
  // The terminal stays open between runs; only an active run blocks another.
  const live = isProcessLive(process);
  const runActive = isProcessRunActive(process);
  const stopping = process?.phase === "stopping";
  const run = processRun(process);
  const attachOnly = processApi?.attachOnly === true;
  const canStart = !attachOnly && Boolean(processApi?.start);
  const canStop = Boolean(processApi?.stop);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [terminalVisible, setTerminalVisible] = useState(
    attachOnly ? process !== undefined && process.phase !== "idle" : live,
  );
  const [scrollToLatest, setScrollToLatest] = useState(0);
  const label = stringProp(props, ["label", "title"], "Run command");
  const command = stringProp(props, ["command"]);

  useEffect(() => componentHost.actions.register({
    id: "run",
    label: verbLabel("Run", label),
    description: "Run the configured command with selected item values in DASH_ITEM_* environment variables.",
    enabled: Boolean(processApi?.start) && !runActive && !stopping,
    disabledReason: !processApi?.start ? "Trust this project to run the command."
      : runActive ? "This command is already running."
        : stopping ? "This terminal is closing." : undefined,
    invocationOutcome: "started",
    process,
    run: async (_selections, args = {}) => {
      if (!processApi?.start) throw new Error("The command is unavailable.");
      const itemEnvironment: Record<string, string> = {};
      for (const [field, value] of Object.entries(args)) {
        if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(field) || (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean")) {
          throw new Error(`Unsupported item action argument: ${field}`);
        }
        const key = `DASH_ITEM_${field.toUpperCase()}`;
        if (key in itemEnvironment) throw new Error(`Duplicate item environment name: ${key}`);
        itemEnvironment[key] = String(value);
      }
      setTerminalVisible(true);
      const started = await processApi.start(itemEnvironment);
      if (started.phase === "failed" || started.run?.phase === "failed") {
        throw new Error("The command could not start. Inspect its process output.");
      }
    },
  }), [componentHost.actions, label, processApi?.start, process, runActive, stopping]);

  useEffect(() => {
    if (live) setTerminalVisible(true);
  }, [live]);

  if (!processApi || (!attachOnly && (!processApi.start || !processApi.stop))) {
    return (
      <CapabilityGate title={label}>
        Trust this project to run its configured command.
      </CapabilityGate>
    );
  }

  async function runQuickAction(): Promise<void> {
    const run = processApi?.runQuickAction;
    if (!run) return;
    setPending(true);
    setError(null);
    setTerminalVisible(true);
    try {
      await run();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setPending(false);
    }
  }

  async function openTerminal(): Promise<void> {
    const open = processApi?.open;
    if (!open) return;
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

  async function closeTerminal(): Promise<void> {
    const stop = processApi?.stop;
    if (!stop) return;
    setPending(true);
    setError(null);
    try {
      await stop();
      // Attached agent tasks remain mounted after stopping so the user can
      // review the output that caused the run to finish.
      if (!attachOnly) setTerminalVisible(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="command">
      <div className="command__content">
        <strong>{label}</strong>
        {command ? <code>{command}</code> : null}
        {run ? (
          <span
            className={runActive ? "phase phase--running" : processRunFailed(run) ? "phase phase--failed" : "phase"}
            title={runActive ? "The command is running." : "Result of the latest run."}
          >
            {processRunOutcome(run)}
          </span>
        ) : live ? <span className="phase">open</span> : null}
      </div>
      <div className="command__actions">
        {terminalVisible ? (
          <button className="button button--quiet button--small" type="button" onClick={() => setScrollToLatest((value) => value + 1)}>
            Latest output
          </button>
        ) : null}
        {canStart && !live ? (
          <button className="button button--quiet button--small" type="button" disabled={pending} onClick={() => void openTerminal()}>
            Open terminal
          </button>
        ) : null}
        {canStart ? (
          <button
            className="button button--primary"
            type="button"
            disabled={pending || stopping || runActive}
            title={runActive ? "The command is running. Press Ctrl-C in the terminal or close it to stop." : undefined}
            onClick={() => void runQuickAction()}
          >
            {pending ? "Working…" : runActive ? "Running…" : label}
          </button>
        ) : null}
        {live && canStop ? (
          <button className="button button--danger" type="button" disabled={pending || stopping} onClick={() => void closeTerminal()}>
            Close terminal
          </button>
        ) : null}
      </div>
      {terminalVisible ? (
        <TerminalSurface process={process} onWrite={processApi.write} onResize={processApi.resize} scrollToLatest={scrollToLatest} label={`Interactive terminal for ${label}`} />
      ) : null}
      {error ? <p className="inline-error" role="alert">{error}</p> : null}
    </div>
  );
}
