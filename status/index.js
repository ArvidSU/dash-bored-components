import "./component.css";
// src/renderer/builtins/shared.tsx
import { jsxDEV } from "react/jsx-dev-runtime";
function stringProp(props, names, fallback = "") {
  for (const name of names) {
    if (typeof props[name] === "string")
      return props[name];
  }
  return fallback;
}

// src/renderer/lib/use-dashboard-source.ts
import { useCallback, useEffect, useState } from "react";
import { useComponentVisibility } from "@dash-bored/component";

// src/renderer/lib/source.ts
import { trackActivity } from "@dash-bored/component";
function decodeSourceText(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
function readDashboardSource(source, host) {
  return trackActivity(readSource(source, host));
}
async function readSource(source, host) {
  const kinds = ["shell", "file", "http", "process", "inline"].filter((kind) => (kind in source));
  if (kinds.length !== 1)
    throw new Error("Source must define exactly one of shell, file, http, process, or inline.");
  switch (kinds[0]) {
    case "inline":
      return source.inline;
    case "shell": {
      if (!host.shell)
        throw new Error("Source requires process:execute permission.");
      const result = await host.shell.run({ command: source.shell, cwd: source.cwd, env: source.env, timeoutMs: source.timeoutMs });
      if (result.timedOut || result.exitCode !== 0)
        throw new Error(`Command failed (${result.timedOut ? "timed out" : `exit ${result.exitCode}`}): ${result.stderr.slice(-500)}`);
      return decodeSourceText(result.stdout);
    }
    case "file": {
      if (!host.filesystem)
        throw new Error("Source requires filesystem:read permission.");
      return decodeSourceText(await host.filesystem.readText(source.file));
    }
    case "http": {
      if (!host.http)
        throw new Error("Source requires network:http permission.");
      const response = await host.http.request({ url: source.http, timeoutMs: source.timeoutMs });
      if (response.status < 200 || response.status >= 300)
        throw new Error(`HTTP ${response.status}: ${response.body.slice(-500)}`);
      return decodeSourceText(response.body);
    }
    case "process": {
      if (!host.processes)
        throw new Error("Source requires process:observe permission.");
      const snapshot = host.processes.get(source.process);
      if (snapshot === undefined)
        throw new Error(`No supervised process exists with id ${source.process}.`);
      return snapshot;
    }
  }
}

// src/renderer/lib/use-dashboard-source.ts
function missingSourcePermission(source, host) {
  if (!source)
    return;
  if (source.shell && !host.shell)
    return "process:execute";
  if (source.file && !host.filesystem)
    return "filesystem:read";
  if (source.http && !host.http)
    return "network:http";
  if (source.process && !host.processes)
    return "process:observe";
  return;
}
function useSourceComponent(source, host, { label, withoutSource, unavailableReason, confirmation }) {
  const [refreshes, setRefreshes] = useState(0);
  const refresh = useCallback(() => setRefreshes((count) => count + 1), []);
  const unavailable = missingSourcePermission(source, host);
  const state = useLoadedSource(unavailable ? null : source, host, refreshes);
  const reason = unavailable ? unavailableReason?.(unavailable) ?? `Trust this project to grant ${unavailable}.` : source === null ? withoutSource ?? undefined : undefined;
  useEffect(() => host.actions.register({
    id: "refresh",
    label,
    enabled: reason === undefined,
    disabledReason: reason,
    confirmation,
    run: refresh
  }), [host.actions, label, reason, refresh, confirmation?.title, confirmation?.message, confirmation?.confirmLabel]);
  return { state, unavailable, refresh, refreshes };
}
function useLoadedSource(source, host, refresh) {
  const visible = useComponentVisibility();
  const [state, setState] = useState({ loading: true });
  const processSnapshot = source?.process ? host.processes?.get(source.process) : undefined;
  const sourceKey = JSON.stringify(source);
  const every = typeof source?.every === "number" ? Math.max(1000, Math.min(300000, source.every)) : undefined;
  useEffect(() => {
    if (!visible || !source)
      return;
    const activeSource = source;
    let cancelled = false;
    let timer;
    async function load() {
      setState((previous) => ({ ...previous, loading: true, error: undefined }));
      try {
        const value = await readDashboardSource(activeSource, host);
        if (!cancelled)
          setState({ value, loading: false, updatedAt: new Date });
      } catch (cause) {
        if (!cancelled)
          setState((previous) => ({
            ...previous,
            loading: false,
            error: cause instanceof Error ? cause.message : String(cause)
          }));
      } finally {
        if (!cancelled && every !== undefined)
          timer = window.setTimeout(() => void load(), every);
      }
    }
    load();
    return () => {
      cancelled = true;
      if (timer !== undefined)
        window.clearTimeout(timer);
    };
  }, [every, host, refresh, sourceKey, visible]);
  useEffect(() => {
    if (source?.process && processSnapshot !== undefined) {
      setState({ value: processSnapshot, loading: false, updatedAt: new Date });
    }
  }, [processSnapshot, source?.process]);
  return state;
}

// src/renderer/lib/state-visual.tsx
import { jsxDEV as jsxDEV2, Fragment } from "react/jsx-dev-runtime";
var CLOSED_STATES = new Set(["done", "completed", "closed"]);
var POSITIVE_STATES = new Set(["ok", "online", "healthy", "success", "passed", "ready", ...CLOSED_STATES]);
var WARNING_STATES = new Set(["warn", "warning", "pending", "starting", "running", "stopping", "blocked", "degraded", "stale"]);
var NEGATIVE_STATES = new Set(["error", "failed", "failing", "offline", "down", "bug", "broken"]);
function stateTone(state, done = false) {
  const normalized = state?.trim().toLowerCase() ?? "";
  if (done || POSITIVE_STATES.has(normalized))
    return "positive";
  if (WARNING_STATES.has(normalized))
    return "warning";
  if (NEGATIVE_STATES.has(normalized))
    return "negative";
  return "neutral";
}
function StateGlyph({ tone }) {
  return /* @__PURE__ */ jsxDEV2("svg", {
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    children: tone === "positive" ? /* @__PURE__ */ jsxDEV2(Fragment, {
      children: [
        /* @__PURE__ */ jsxDEV2("circle", {
          cx: "10",
          cy: "10",
          r: "7"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV2("path", {
          d: "m6.5 10 2.3 2.3 4.7-4.6"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this) : tone === "warning" ? /* @__PURE__ */ jsxDEV2(Fragment, {
      children: [
        /* @__PURE__ */ jsxDEV2("path", {
          d: "M10 2.5 18 17H2Z"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV2("path", {
          d: "M10 7.5v4M10 14h.01"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this) : tone === "negative" ? /* @__PURE__ */ jsxDEV2(Fragment, {
      children: [
        /* @__PURE__ */ jsxDEV2("circle", {
          cx: "10",
          cy: "10",
          r: "7"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV2("path", {
          d: "m7.5 7.5 5 5m0-5-5 5"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this) : /* @__PURE__ */ jsxDEV2(Fragment, {
      children: [
        /* @__PURE__ */ jsxDEV2("circle", {
          cx: "10",
          cy: "10",
          r: "7"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV2("path", {
          d: "M7.5 10h5"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this)
  }, undefined, false, undefined, this);
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
function processRunFailed(run) {
  return (run.phase === "exited" || run.phase === "failed") && !(run.exitCode === 0 && run.signal === null);
}

// src/renderer/lib/chart-data.ts
var CHART_COLORS = [1, 2, 3, 4, 5, 6].map((index) => `var(--chart-${index})`);

// src/renderer/lib/view-shapes.ts
var STATUS_TREND_MAX_POINTS = 60;
var STATUS_SEGMENTS_MAX = 8;
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function parseTrend(value) {
  if (value === undefined)
    return;
  if (!Array.isArray(value) || value.length < 2 || value.length > STATUS_TREND_MAX_POINTS)
    return null;
  if (!value.every((point) => point === null || typeof point === "number" && Number.isFinite(point)))
    return null;
  return value.some((point) => point !== null) ? value : null;
}
function parseSegments(value) {
  if (value === undefined)
    return;
  if (!Array.isArray(value) || value.length === 0 || value.length > STATUS_SEGMENTS_MAX)
    return null;
  const segments = [];
  for (const entry of value) {
    if (!isRecord(entry) || typeof entry.label !== "string" || !entry.label.trim())
      return null;
    if (typeof entry.value !== "number" || !Number.isFinite(entry.value) || entry.value < 0)
      return null;
    if (entry.state !== undefined && typeof entry.state !== "string")
      return null;
    segments.push({ label: entry.label, value: entry.value, ...typeof entry.state === "string" ? { state: entry.state } : {} });
  }
  return segments;
}
function parseStatusValue(value) {
  if (!isRecord(value))
    return null;
  const states = ["unknown", "healthy", "warning", "error"];
  if (states.includes(value.state)) {
    if (value.detail !== undefined && typeof value.detail !== "string")
      return null;
    const trend = parseTrend(value.trend);
    const segments = parseSegments(value.segments);
    if (trend === null || segments === null)
      return null;
    return {
      state: value.state,
      ...typeof value.detail === "string" ? { detail: value.detail } : {},
      ...trend ? { trend } : {},
      ...segments ? { segments } : {}
    };
  }
  if (isProcessPhase(value.phase)) {
    const run = processRun(value);
    if (run === undefined) {
      return { state: "unknown", detail: value.phase === "idle" ? "Not run yet" : "Terminal open; not run yet" };
    }
    if (run.phase === "running" || run.phase === "stopping") {
      return { state: "warning", detail: run.phase === "running" ? "Running" : "Stopping" };
    }
    const detail = run.signal !== null ? `Stopped by ${run.signal}` : typeof run.exitCode === "number" ? `Exit code ${run.exitCode}` : run.phase === "failed" ? "Failed to start" : "Process exited";
    return { state: processRunFailed(run) ? "error" : "healthy", detail };
  }
  return null;
}
function isProcessPhase(value) {
  return value === "idle" || value === "running" || value === "stopping" || value === "exited" || value === "failed";
}

// src/renderer/lib/glance-visual.tsx
import { jsxDEV as jsxDEV3 } from "react/jsx-dev-runtime";
function finite(values) {
  return values.filter((value) => typeof value === "number" && Number.isFinite(value));
}
function trendDirection(values) {
  const middle = Math.floor(values.length / 2);
  const older = finite(values.slice(0, middle));
  const newer = finite(values.slice(values.length - middle));
  if (older.length === 0 || newer.length === 0)
    return "steady";
  const mean = (entries) => entries.reduce((sum, entry) => sum + entry, 0) / entries.length;
  const all = finite(values);
  const range = Math.max(...all) - Math.min(...all);
  const delta = mean(newer) - mean(older);
  if (range === 0 || Math.abs(delta) < range * 0.1)
    return "steady";
  return delta > 0 ? "rising" : "falling";
}
function trendSummary(values) {
  const all = finite(values);
  const latest = [...values].reverse().find((value) => typeof value === "number");
  const gaps = values.length - all.length;
  return `${trendDirection(values)} over ${values.length} points; latest ${latest ?? "unknown"}, low ${Math.min(...all)}, high ${Math.max(...all)}${gaps ? `, ${gaps} missing` : ""}`;
}
function Sparkline({ values, className = "glance-sparkline" }) {
  const width = 72;
  const height = 22;
  const pad = 2.5;
  const all = finite(values);
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || 1;
  const x = (index) => pad + (values.length <= 1 ? 0 : index / (values.length - 1)) * (width - pad * 2);
  const y = (value) => max === min ? height / 2 : pad + (max - value) / span * (height - pad * 2);
  const segments = [];
  let current = "";
  values.forEach((value, index) => {
    if (typeof value !== "number") {
      if (current)
        segments.push(current);
      current = "";
      return;
    }
    current += `${current ? " L" : "M"} ${x(index).toFixed(1)} ${y(value).toFixed(1)}`;
  });
  if (current)
    segments.push(current);
  const lastIndex = values.length - 1 - [...values].reverse().findIndex((value) => typeof value === "number");
  const last = values[lastIndex];
  const direction = trendDirection(values);
  return /* @__PURE__ */ jsxDEV3("span", {
    className,
    "data-direction": direction,
    children: [
      /* @__PURE__ */ jsxDEV3("svg", {
        viewBox: `0 0 ${width} ${height}`,
        role: "img",
        "aria-label": `Trend ${trendSummary(values)}`,
        children: [
          /* @__PURE__ */ jsxDEV3("path", {
            className: "glance-sparkline__line",
            d: segments.join(" ")
          }, undefined, false, undefined, this),
          typeof last === "number" ? /* @__PURE__ */ jsxDEV3("circle", {
            className: "glance-sparkline__last",
            cx: x(lastIndex),
            cy: y(last),
            r: "2.2"
          }, undefined, false, undefined, this) : null
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV3("span", {
        className: "glance-sparkline__direction",
        "aria-hidden": "true",
        children: [
          direction === "rising" ? "↗" : direction === "falling" ? "↘" : "→",
          " ",
          direction
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function percent(value, total) {
  return total > 0 ? Math.round(value / total * 100) : 0;
}
function SegmentMeter({ segments, label }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  return /* @__PURE__ */ jsxDEV3("div", {
    className: "glance-meter",
    role: "group",
    "aria-label": `${label}: ${total} total`,
    children: [
      /* @__PURE__ */ jsxDEV3("div", {
        className: "glance-meter__bar",
        "aria-hidden": "true",
        children: total > 0 ? segments.map((segment, index) => segment.value > 0 ? /* @__PURE__ */ jsxDEV3("span", {
          "data-tone": stateTone(segment.state),
          style: { flexGrow: segment.value }
        }, `${segment.label}-${index}`, false, undefined, this) : null) : /* @__PURE__ */ jsxDEV3("span", {
          "data-tone": "empty",
          style: { flexGrow: 1 }
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV3("ul", {
        className: "glance-meter__legend",
        children: segments.map((segment, index) => /* @__PURE__ */ jsxDEV3("li", {
          "data-tone": stateTone(segment.state),
          children: [
            /* @__PURE__ */ jsxDEV3(StateGlyph, {
              tone: stateTone(segment.state)
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsxDEV3("span", {
              children: [
                segment.label,
                " ",
                segment.value
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsxDEV3("small", {
              children: [
                percent(segment.value, total),
                "%"
              ]
            }, undefined, true, undefined, this)
          ]
        }, `${segment.label}-${index}`, true, undefined, this))
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}

// src/renderer/lib/observation-changes.ts
import { useEffect as useEffect2, useRef, useState as useState2 } from "react";
var CHANGE_FLASH_MS = 1200;
function useFlash(at) {
  const [flashing, setFlashing] = useState2(false);
  useEffect2(() => {
    if (!at)
      return;
    setFlashing(true);
    const timer = window.setTimeout(() => setFlashing(false), CHANGE_FLASH_MS);
    return () => window.clearTimeout(timer);
  }, [at]);
  return flashing;
}
function useObservationChange(value, settled) {
  const previous = useRef(undefined);
  const [change, setChange] = useState2(undefined);
  useEffect2(() => {
    if (!settled)
      return;
    const before = previous.current;
    previous.current = value;
    if (before === undefined || before === value)
      return;
    setChange({ from: before, at: new Date });
  }, [settled, value]);
  return { change, flashing: useFlash(change?.at) };
}

// src/renderer/builtins/status/index.tsx
import { jsxDEV as jsxDEV4 } from "react/jsx-dev-runtime";
function receivedPreview(value) {
  const text = JSON.stringify(value) ?? String(value);
  return text.length > 160 ? `${text.slice(0, 160)}…` : text;
}
function Status({ props, host }) {
  const label = stringProp(props, ["label", "name"], "Status");
  const source = props.source && typeof props.source === "object" && !Array.isArray(props.source) ? props.source : null;
  const { state: sourceState, unavailable } = useSourceComponent(source, host, {
    label: "Refresh status",
    withoutSource: "This status uses a hand-written state."
  });
  let value = stringProp(props, ["state", "status", "value"], "unknown");
  let detail = stringProp(props, ["detail", "description"]);
  let diagnostic;
  let trend;
  let segments;
  if (source) {
    if (unavailable) {
      value = "unknown";
      detail = `Trust this project to read the source (${unavailable}).`;
    } else if (sourceState.error) {
      value = "error";
      detail = sourceState.error;
    } else if (sourceState.value !== undefined) {
      const parsed = parseStatusValue(sourceState.value);
      if (parsed) {
        value = parsed.state;
        detail = parsed.detail ?? "";
        trend = parsed.trend;
        segments = parsed.segments;
      } else {
        value = "unknown";
        detail = "";
        diagnostic = `Expected { state: unknown | healthy | warning | error, detail?: string, trend?: (number | null)[2..60], segments?: [{ label, value ≥ 0, state? }][1..8] } or a supervised process snapshot. Received ${receivedPreview(sourceState.value)}.`;
      }
    } else if (sourceState.loading) {
      value = "unknown";
      detail = "Loading status source…";
    }
  }
  const refreshing = sourceState.loading && sourceState.value !== undefined;
  const settled = source !== null && !unavailable && (sourceState.value !== undefined || sourceState.error !== undefined);
  const { change, flashing } = useObservationChange(value, settled);
  const compact = props.density === "compact";
  const tone = stateTone(value);
  const changedAt = change?.at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return /* @__PURE__ */ jsxDEV4("div", {
    className: compact ? "status status--compact" : "status",
    "data-tone": tone,
    "data-changed": flashing || undefined,
    "aria-label": `${label}: ${value}`,
    children: [
      /* @__PURE__ */ jsxDEV4("span", {
        className: `status__dot status__dot--${tone}${refreshing ? " status__dot--refreshing" : ""}`,
        title: refreshing ? "Updating…" : undefined,
        "aria-hidden": "true",
        children: /* @__PURE__ */ jsxDEV4(StateGlyph, {
          tone
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV4("span", {
        className: "status__label",
        children: label
      }, undefined, false, undefined, this),
      change ? /* @__PURE__ */ jsxDEV4("span", {
        className: "status__changed",
        role: "status",
        title: `Changed from ${change.from} at ${changedAt}`,
        children: [
          /* @__PURE__ */ jsxDEV4("span", {
            children: "Changed"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV4("span", {
            className: "status__changed-from",
            children: [
              " from ",
              change.from,
              " · ",
              changedAt
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this) : null,
      /* @__PURE__ */ jsxDEV4("span", {
        className: "status__value",
        children: value
      }, undefined, false, undefined, this),
      trend ? /* @__PURE__ */ jsxDEV4(Sparkline, {
        values: trend,
        className: "glance-sparkline status__trend"
      }, undefined, false, undefined, this) : null,
      detail ? /* @__PURE__ */ jsxDEV4("span", {
        className: "status__detail",
        title: compact ? detail : undefined,
        children: detail
      }, undefined, false, undefined, this) : null,
      segments ? /* @__PURE__ */ jsxDEV4("div", {
        className: "status__meter",
        children: /* @__PURE__ */ jsxDEV4(SegmentMeter, {
          segments,
          label: `${label} breakdown`
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this) : null,
      diagnostic ? /* @__PURE__ */ jsxDEV4("span", {
        className: "status__diagnostic",
        role: "alert",
        children: [
          "Source shape: ",
          diagnostic
        ]
      }, undefined, true, undefined, this) : null,
      refreshing ? /* @__PURE__ */ jsxDEV4("span", {
        className: "status__refreshing",
        role: "status",
        children: "Updating…"
      }, undefined, false, undefined, this) : null
    ]
  }, undefined, true, undefined, this);
}
export {
  Status as default
};
