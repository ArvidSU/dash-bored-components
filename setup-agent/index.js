import "./component.css";
// src/renderer/builtins/setup-agent/index.tsx
import { useCallback, useEffect, useState } from "react";

// src/renderer/builtins/shared.tsx
import { jsxDEV } from "react/jsx-dev-runtime";
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

// src/renderer/builtins/setup-agent/index.tsx
import { jsxDEV as jsxDEV2 } from "react/jsx-dev-runtime";
function SetupAgent({ host }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const configured = host.environment?.values.find((entry) => entry.key === "DASH_BORED_AGENT");
  const command = configured?.value?.trim() || "codex exec";
  const missing = configured?.source === "unset" || !configured?.value?.trim();
  const setupWithAgent = host.dashboard.setupWithAgent;
  const start = useCallback(async (reportFailure = false) => {
    setPending(true);
    setError(null);
    try {
      await setupWithAgent?.();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      if (reportFailure)
        throw cause;
    } finally {
      setPending(false);
    }
  }, [setupWithAgent]);
  useEffect(() => host.actions.register({
    id: "setup",
    label: "Set up dashboard with agent",
    enabled: Boolean(setupWithAgent) && !pending && !missing,
    disabledReason: !setupWithAgent ? "Trust this project to run its configured agent." : missing ? "Configure DASH_BORED_AGENT first." : "Agent setup is starting.",
    confirmation: { title: "Set up dashboard with agent?", message: `Run ${command} to customize this dashboard.` },
    run: () => start(true)
  }), [host.actions, setupWithAgent, pending, missing, command, start]);
  if (!setupWithAgent) {
    return /* @__PURE__ */ jsxDEV2(CapabilityGate, {
      title: "Set up this dashboard",
      children: "Trust this project to run its configured agent."
    }, undefined, false, undefined, this);
  }
  return /* @__PURE__ */ jsxDEV2("div", {
    className: "setup-agent",
    children: [
      /* @__PURE__ */ jsxDEV2("strong", {
        children: "Dashboard agent"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV2("span", {
        children: missing ? "Set an agent in Settings or declare DASH_BORED_AGENT in this bundle's .env." : `Runs ${command}`
      }, undefined, false, undefined, this),
      configured && !missing ? /* @__PURE__ */ jsxDEV2("small", {
        children: [
          "Command source: ",
          configured.source === "app" ? "App settings" : configured.source
        ]
      }, undefined, true, undefined, this) : null,
      /* @__PURE__ */ jsxDEV2("button", {
        className: "button button--primary",
        type: "button",
        onClick: () => void start(),
        disabled: pending,
        children: pending ? "Starting…" : "Set up this dashboard"
      }, undefined, false, undefined, this),
      error ? /* @__PURE__ */ jsxDEV2("span", {
        role: "alert",
        children: error
      }, undefined, false, undefined, this) : null
    ]
  }, undefined, true, undefined, this);
}
export {
  SetupAgent as default
};
