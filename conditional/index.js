// src/renderer/builtins/conditional/index.tsx
import { useEffect, useRef, useState } from "react";
import { useComponentVisibility } from "@dash-bored/component";

// src/renderer/builtins/shared.tsx
import { jsxDEV } from "react/jsx-dev-runtime";
function childSurface(children) {
  return children?.type === "tiled" ? children.surface : null;
}
function stringProp(props, names, fallback = "") {
  for (const name of names) {
    if (typeof props[name] === "string")
      return props[name];
  }
  return fallback;
}

// src/renderer/builtins/conditional/index.tsx
var DEFAULT_POLL_INTERVAL_MS = 5000;
var DEFAULT_TIMEOUT_MS = 5000;
function shellConditionSucceeded(result) {
  return result.exitCode === 0 && result.signal === null && !result.timedOut;
}
function conditionalVisibility(result, invert) {
  const succeeded = shellConditionSucceeded(result);
  return invert ? !succeeded : succeeded;
}
function numberProp(props, name, fallback) {
  const value = props[name];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function stringMapProp(props, name) {
  const value = props[name];
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return;
  if (Object.values(value).some((entry) => typeof entry !== "string"))
    return;
  return value;
}
function Conditional({ props, children, host }) {
  const command = stringProp(props, ["command"]);
  const cwd = stringProp(props, ["cwd"], "");
  const env = stringMapProp(props, "env");
  const invert = props.invert === true;
  const pollIntervalMs = numberProp(props, "pollIntervalMs", DEFAULT_POLL_INTERVAL_MS);
  const timeoutMs = numberProp(props, "timeoutMs", DEFAULT_TIMEOUT_MS);
  const panelVisible = useComponentVisibility();
  const [showChildren, setShowChildren] = useState(true);
  const checkRef = useRef(null);
  useEffect(() => host.actions.register({
    id: "refresh",
    label: "Recheck condition",
    enabled: Boolean(host.shell && command.trim()) && panelVisible,
    disabledReason: !host.shell ? "Trust this project to run the condition." : !panelVisible ? "Condition panel is hidden." : "Configure a condition command.",
    run: () => checkRef.current?.()
  }), [host.actions, host.shell, command, panelVisible]);
  useEffect(() => {
    const run = host.shell?.run;
    if (!run || command.trim() === "" || !panelVisible) {
      if (!run || command.trim() === "")
        setShowChildren(true);
      return;
    }
    let cancelled = false;
    let checking = false;
    const check = async () => {
      if (checking)
        return;
      checking = true;
      try {
        const result = await run({
          command,
          ...cwd ? { cwd } : {},
          ...env ? { env } : {},
          timeoutMs
        });
        if (!cancelled)
          setShowChildren(conditionalVisibility(result, invert));
      } catch {
        if (!cancelled)
          setShowChildren(true);
      } finally {
        checking = false;
      }
    };
    checkRef.current = check;
    check();
    const timer = setInterval(() => void check(), pollIntervalMs);
    return () => {
      cancelled = true;
      checkRef.current = null;
      clearInterval(timer);
    };
  }, [command, cwd, env, host.shell, invert, panelVisible, pollIntervalMs, timeoutMs]);
  return showChildren ? childSurface(children) : null;
}
export {
  shellConditionSucceeded,
  Conditional as default,
  conditionalVisibility
};
