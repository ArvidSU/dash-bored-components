import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { ComponentRendererProps } from "../shared/types";
import { CapabilityGate } from "../shared/shared";
import "./setup-agent.css";
import { SETUP_PROMPT } from "../shared/setup-prompt";

export default function SetupAgent({ host }: ComponentRendererProps): ReactNode {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = host.environment?.values.find((entry) => entry.key === "DASH_BORED_AGENT");
  const command = configured?.value?.trim() || "the configured coding agent";
  const missing = configured?.source === "unset" || !configured?.value?.trim();
  const setupAction = host.actions.resolve("agent:prompt");

  const start = useCallback(async (reportFailure = false): Promise<void> => {
    setPending(true);
    setError(null);
    try {
      host.actions.invoke("agent:prompt", { template: "dashboard", prompt: SETUP_PROMPT });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      if (reportFailure) throw cause;
    } finally {
      setPending(false);
    }
  }, [host.actions, setupAction.enabled]);

  useEffect(() => host.actions.register({
    id: "setup", label: "Set up dashboard with agent", enabled: setupAction.enabled && !pending,
    disabledReason: !setupAction.enabled ? setupAction.disabledReason : "Agent setup is starting.",
    confirmation: { title: "Set up dashboard with agent?", message: `Run ${command} to customize this dashboard.` },
    run: () => start(true),
  }), [host.actions, setupAction.enabled, setupAction.disabledReason, pending, command, start]);

  if (!setupAction.enabled) {
    return <CapabilityGate title="Set up this dashboard">Trust this project to run its configured agent.</CapabilityGate>;
  }

  return (
    <div className="setup-agent">
      <strong>Dashboard agent</strong>
      <span>{missing ? "Set an agent in Settings or declare DASH_BORED_AGENT in this bundle's .env." : `Runs ${command}`}</span>
      {configured && !missing ? <small>Command source: {configured.source === "app" ? "App settings" : configured.source}</small> : null}
      <button className="button button--primary" type="button" onClick={() => void start()} disabled={pending}>
        {pending ? "Starting…" : "Set up this dashboard"}
      </button>
      {error ? <span role="alert">{error}</span> : null}
    </div>
  );
}
