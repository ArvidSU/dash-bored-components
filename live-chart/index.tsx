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

// src/renderer/lib/chart-data.ts
var CHART_COLORS = [1, 2, 3, 4, 5, 6].map((index) => `var(--chart-${index})`);
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function readChartDataPath(value, path) {
  const segments = path.split(".").map((segment) => segment.trim()).filter(Boolean);
  let current = value;
  for (const segment of segments) {
    if (!isRecord(current) || !Object.hasOwn(current, segment))
      return;
    current = current[segment];
  }
  return current;
}
function resolveChartEndpoint(endpoint, baseUrl) {
  try {
    const url = new URL(endpoint, baseUrl);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}
function parseValues(value) {
  if (!Array.isArray(value))
    return null;
  return value.map((item) => typeof item === "number" && Number.isFinite(item) ? item : null);
}
function parseSeries(value) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (!isRecord(item) || typeof item.label !== "string")
        return [];
      const values = parseValues(item.values);
      if (values === null)
        return [];
      return [
        {
          label: item.label,
          values,
          ...typeof item.color === "string" && item.color.length > 0 ? { color: item.color } : {}
        }
      ];
    });
  }
  if (!isRecord(value))
    return [];
  return Object.entries(value).flatMap(([label, values]) => {
    const parsed = parseValues(values);
    return parsed === null ? [] : [{ label, values: parsed }];
  });
}
function parseChartData(value) {
  if (!isRecord(value))
    return null;
  const series = parseSeries(value.series);
  if (series.length === 0 && Object.hasOwn(value, "values")) {
    const values = parseValues(value.values);
    if (values !== null) {
      series.push({
        label: typeof value.label === "string" ? value.label : "Value",
        values
      });
    }
  }
  if (series.length === 0)
    return null;
  const pointCount = Math.max(...series.map((item) => item.values.length), 0);
  if (pointCount === 0)
    return null;
  const labels = Array.isArray(value.labels) ? value.labels.map((label, index) => typeof label === "string" && label.length > 0 ? label : `Point ${index + 1}`) : [];
  while (labels.length < pointCount)
    labels.push(`Point ${labels.length + 1}`);
  return {
    labels: labels.slice(0, pointCount),
    series
  };
}
function limitChartData(data, maxPoints = 60) {
  const pointCount = Math.max(2, Math.floor(maxPoints));
  if (data.labels.length <= pointCount)
    return data;
  const start = data.labels.length - pointCount;
  return {
    labels: data.labels.slice(start),
    series: data.series.map((series) => ({
      ...series,
      values: series.values.slice(start)
    }))
  };
}

// src/renderer/lib/view-shapes.ts
function isRecord2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function parseSourceChart(value) {
  if (!isRecord2(value) || !Array.isArray(value.labels) || !value.labels.every((label) => typeof label === "string"))
    return null;
  if (!Array.isArray(value.series) || value.series.length === 0)
    return null;
  if (!value.series.every((series) => isRecord2(series) && typeof series.label === "string" && Array.isArray(series.values) && series.values.every((item) => item === null || typeof item === "number" && Number.isFinite(item))))
    return null;
  const parsed = parseChartData(value);
  if (!parsed || parsed.labels.length !== value.labels.length || parsed.series.length !== value.series.length)
    return null;
  return parsed;
}

// src/renderer/lib/state-visual.tsx
import { jsxDEV as jsxDEV2, Fragment } from "react/jsx-dev-runtime";
var CLOSED_STATES = new Set(["done", "completed", "closed"]);
var POSITIVE_STATES = new Set(["ok", "online", "healthy", "success", "passed", "ready", ...CLOSED_STATES]);
var WARNING_STATES = new Set(["warn", "warning", "pending", "starting", "running", "stopping", "blocked", "degraded", "stale"]);
var NEGATIVE_STATES = new Set(["error", "failed", "failing", "offline", "down", "bug", "broken"]);
function actionVerb(reference) {
  if (reference.startsWith("process:"))
    return "process";
  if (reference.startsWith("agent:"))
    return "agent";
  if (reference.startsWith("select:") || reference.startsWith("reveal:") || reference.startsWith("focus:"))
    return "navigate";
  if (reference.endsWith(":refresh"))
    return "refresh";
  return "action";
}
function ActionGlyph({ reference }) {
  const verb = actionVerb(reference);
  return /* @__PURE__ */ jsxDEV2("svg", {
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    children: verb === "process" ? /* @__PURE__ */ jsxDEV2("path", {
      d: "m7 4 9 6-9 6Z"
    }, undefined, false, undefined, this) : verb === "agent" ? /* @__PURE__ */ jsxDEV2("path", {
      d: "m10 2 2.3 5.7L18 10l-5.7 2.3L10 18l-2.3-5.7L2 10l5.7-2.3Z"
    }, undefined, false, undefined, this) : verb === "navigate" ? /* @__PURE__ */ jsxDEV2("path", {
      d: "M3 10h13m-5-5 5 5-5 5"
    }, undefined, false, undefined, this) : verb === "refresh" ? /* @__PURE__ */ jsxDEV2(Fragment, {
      children: [
        /* @__PURE__ */ jsxDEV2("path", {
          d: "M16 10a6 6 0 1 1-1.8-4.3"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV2("path", {
          d: "M16 3v4h-4"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this) : /* @__PURE__ */ jsxDEV2(Fragment, {
      children: [
        /* @__PURE__ */ jsxDEV2("circle", {
          cx: "10",
          cy: "10",
          r: "6.5"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV2("circle", {
          cx: "10",
          cy: "10",
          r: "1.8",
          fill: "currentColor"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this)
  }, undefined, false, undefined, this);
}

// src/renderer/builtins/chart/index.tsx
import { useComponentVisibility as useComponentVisibility2 } from "@dash-bored/component";
import { jsxDEV as jsxDEV3 } from "react/jsx-dev-runtime";
function numberProp(props, name, fallback) {
  const value = props[name];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function chartType(props) {
  return props.type === "bar" ? "bar" : "line";
}
function chartTitle(props, fallback) {
  return stringProp(props, ["title"], fallback);
}
function chartColor(series, index) {
  return series.color ?? CHART_COLORS[index % CHART_COLORS.length] ?? "var(--chart-1)";
}
function formatChartValue(value) {
  if (Math.abs(value) >= 1000)
    return `${(value / 1000).toFixed(1)}k`;
  if (Number.isInteger(value))
    return String(value);
  return value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}
function chartPath(values, x, y) {
  const segments = [];
  let segment = [];
  values.forEach((value, index) => {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      if (segment.length > 0)
        segments.push(segment.join(" "));
      segment = [];
      return;
    }
    const command = segment.length === 0 ? "M" : "L";
    segment.push(`${command} ${x(index).toFixed(2)} ${y(value).toFixed(2)}`);
  });
  if (segment.length > 0)
    segments.push(segment.join(" "));
  return segments.join(" ");
}
function ChartSvg({
  data,
  type,
  title
}) {
  const width = 720;
  const height = 280;
  const padding = { top: 18, right: 18, bottom: 42, left: 48 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const values = data.series.flatMap((series) => series.values.filter((value) => typeof value === "number" && Number.isFinite(value)));
  if (values.length === 0) {
    return /* @__PURE__ */ jsxDEV3("div", {
      className: "component-state",
      children: "Waiting for numeric chart values."
    }, undefined, false, undefined, this);
  }
  let min = Math.min(0, ...values);
  let max = Math.max(0, ...values);
  if (min === max) {
    const paddingValue = Math.max(Math.abs(min) * 0.15, 1);
    min -= paddingValue;
    max += paddingValue;
  }
  const x = (index) => data.labels.length <= 1 ? padding.left + plotWidth / 2 : padding.left + index / (data.labels.length - 1) * plotWidth;
  const y = (value) => padding.top + (max - value) / (max - min) * plotHeight;
  const ticks = Array.from({ length: 5 }, (_, index) => {
    const value = max - (max - min) * index / 4;
    return { value, y: y(value) };
  });
  const labelIndexes = data.labels.length <= 8 ? data.labels.map((_, index) => index) : [...new Set([0, Math.floor((data.labels.length - 1) / 2), data.labels.length - 1])];
  const barGroupWidth = plotWidth / Math.max(data.labels.length, 1);
  const barWidth = Math.max(2, Math.min(26, barGroupWidth * 0.72 / Math.max(data.series.length, 1)));
  return /* @__PURE__ */ jsxDEV3("svg", {
    className: "chart__svg",
    viewBox: `0 0 ${width} ${height}`,
    role: "img",
    "aria-label": `${title}, ${data.series.length} series over ${data.labels.length} points`,
    children: [
      /* @__PURE__ */ jsxDEV3("title", {
        children: title
      }, undefined, false, undefined, this),
      ticks.map((tick) => /* @__PURE__ */ jsxDEV3("g", {
        children: [
          /* @__PURE__ */ jsxDEV3("line", {
            className: "chart__grid",
            x1: padding.left,
            x2: width - padding.right,
            y1: tick.y,
            y2: tick.y
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV3("text", {
            className: "chart__axis-label",
            x: padding.left - 9,
            y: tick.y + 3,
            textAnchor: "end",
            children: formatChartValue(tick.value)
          }, undefined, false, undefined, this)
        ]
      }, tick.value, true, undefined, this)),
      /* @__PURE__ */ jsxDEV3("line", {
        className: "chart__axis",
        x1: padding.left,
        x2: width - padding.right,
        y1: padding.top + plotHeight,
        y2: padding.top + plotHeight
      }, undefined, false, undefined, this),
      type === "line" ? data.series.map((series, seriesIndex) => /* @__PURE__ */ jsxDEV3("g", {
        children: [
          /* @__PURE__ */ jsxDEV3("path", {
            className: "chart__line",
            d: chartPath(series.values, x, y),
            stroke: chartColor(series, seriesIndex)
          }, undefined, false, undefined, this),
          series.values.map((value, index) => typeof value === "number" && Number.isFinite(value) ? /* @__PURE__ */ jsxDEV3("circle", {
            className: "chart__point",
            cx: x(index),
            cy: y(value),
            fill: chartColor(series, seriesIndex),
            r: "3",
            children: /* @__PURE__ */ jsxDEV3("title", {
              children: `${data.labels[index]} · ${series.label}: ${formatChartValue(value)}`
            }, undefined, false, undefined, this)
          }, index, false, undefined, this) : null)
        ]
      }, series.label, true, undefined, this)) : data.series.map((series, seriesIndex) => series.values.map((value, index) => {
        if (typeof value !== "number" || !Number.isFinite(value))
          return null;
        const barX = padding.left + index * barGroupWidth + (barGroupWidth - barWidth * data.series.length) / 2 + seriesIndex * barWidth;
        const zeroY = y(0);
        const valueY = y(value);
        return /* @__PURE__ */ jsxDEV3("rect", {
          className: "chart__bar",
          fill: chartColor(series, seriesIndex),
          height: Math.max(Math.abs(zeroY - valueY), 1),
          rx: "2",
          width: Math.max(barWidth - 2, 1),
          x: barX,
          y: Math.min(zeroY, valueY),
          children: /* @__PURE__ */ jsxDEV3("title", {
            children: `${data.labels[index]} · ${series.label}: ${formatChartValue(value)}`
          }, undefined, false, undefined, this)
        }, `${series.label}-${index}`, false, undefined, this);
      })),
      labelIndexes.map((index) => /* @__PURE__ */ jsxDEV3("text", {
        className: "chart__x-label",
        x: x(index),
        y: height - 13,
        textAnchor: index === 0 ? "start" : index === data.labels.length - 1 ? "end" : "middle",
        children: data.labels[index]
      }, index, false, undefined, this))
    ]
  }, undefined, true, undefined, this);
}
function ChartPanel({
  data,
  error,
  loading,
  onRefresh,
  status,
  title,
  type,
  updatedAt
}) {
  return /* @__PURE__ */ jsxDEV3("section", {
    className: "chart",
    "aria-label": title,
    "data-refreshing": loading && data ? true : undefined,
    children: [
      /* @__PURE__ */ jsxDEV3("header", {
        className: "chart__header",
        children: [
          /* @__PURE__ */ jsxDEV3("div", {
            className: "chart__heading",
            children: [
              /* @__PURE__ */ jsxDEV3("strong", {
                children: title
              }, undefined, false, undefined, this),
              status ? /* @__PURE__ */ jsxDEV3("span", {
                children: loading && data ? "Updating…" : status
              }, undefined, false, undefined, this) : null
            ]
          }, undefined, true, undefined, this),
          onRefresh ? /* @__PURE__ */ jsxDEV3("button", {
            className: "button button--quiet button--small chart__refresh",
            type: "button",
            onClick: onRefresh,
            disabled: loading,
            "aria-label": loading ? "Refreshing chart" : "Refresh",
            children: [
              /* @__PURE__ */ jsxDEV3(ActionGlyph, {
                reference: "component:chart:refresh"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV3("span", {
                children: "Refresh"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this) : null
        ]
      }, undefined, true, undefined, this),
      loading && data ? /* @__PURE__ */ jsxDEV3("small", {
        className: "visually-hidden",
        role: "status",
        children: "Updating…"
      }, undefined, false, undefined, this) : null,
      error ? /* @__PURE__ */ jsxDEV3("div", {
        className: "chart__error",
        role: "alert",
        children: error
      }, undefined, false, undefined, this) : null,
      data ? /* @__PURE__ */ jsxDEV3(ChartSvg, {
        data,
        title,
        type
      }, undefined, false, undefined, this) : /* @__PURE__ */ jsxDEV3("div", {
        className: "component-state",
        children: loading ? "Loading chart data…" : "No chart data yet."
      }, undefined, false, undefined, this),
      data ? /* @__PURE__ */ jsxDEV3("footer", {
        className: "chart__footer",
        children: [
          /* @__PURE__ */ jsxDEV3("div", {
            className: "chart__legend",
            children: data.series.map((series, index) => /* @__PURE__ */ jsxDEV3("span", {
              className: "chart__legend-item",
              children: [
                /* @__PURE__ */ jsxDEV3("i", {
                  style: { backgroundColor: chartColor(series, index) }
                }, undefined, false, undefined, this),
                series.label
              ]
            }, series.label, true, undefined, this))
          }, undefined, false, undefined, this),
          updatedAt ? /* @__PURE__ */ jsxDEV3("span", {
            children: [
              "Updated ",
              updatedAt.toLocaleTimeString()
            ]
          }, undefined, true, undefined, this) : null
        ]
      }, undefined, true, undefined, this) : null
    ]
  }, undefined, true, undefined, this);
}
function Chart({ props, host }) {
  const source = props.source && typeof props.source === "object" && !Array.isArray(props.source) ? props.source : null;
  const panelVisible = useComponentVisibility2();
  const { state: sourceState, unavailable, refresh } = useSourceComponent(source, host, {
    label: "Refresh chart",
    withoutSource: "This chart uses static YAML data."
  });
  const sourceValue = source && typeof props.dataPath === "string" ? readChartDataPath(sourceState.value, props.dataPath) : sourceState.value;
  const rawData = source ? sourceValue === undefined ? null : parseSourceChart(sourceValue) : parseChartData({ labels: props.labels, series: props.series });
  const data = rawData ? limitChartData(rawData, numberProp(props, "maxPoints", 60)) : null;
  const shapeError = source && sourceState.value !== undefined && rawData === null ? `Source shape: expected { labels: string[], series: [{ label: string, values: (number | null)[] }] }${typeof props.dataPath === "string" && props.dataPath ? ` at ${props.dataPath}` : ""}.` : undefined;
  const error = unavailable ? `Trust this project to read the source (${unavailable}).` : sourceState.error ?? shapeError;
  const status = source ? !panelVisible ? "Paused while hidden" : source.every ? `Refreshes every ${Math.round(source.every / 1000)}s` : "Source" : chartType(props);
  return /* @__PURE__ */ jsxDEV3(ChartPanel, {
    data,
    error,
    loading: source !== null && sourceState.loading,
    onRefresh: source && !unavailable ? refresh : undefined,
    status,
    title: chartTitle(props, source ? "Chart source" : "Chart"),
    type: chartType(props),
    updatedAt: sourceState.updatedAt ?? null
  }, undefined, false, undefined, this);
}

// src/renderer/builtins/live-chart/index.tsx
import { jsxDEV as jsxDEV4 } from "react/jsx-dev-runtime";
function LiveChart({ props, host }) {
  const endpoint = stringProp(props, ["endpoint"]);
  const resolvedEndpoint = resolveChartEndpoint(endpoint, window.location.href);
  if (!resolvedEndpoint) {
    return /* @__PURE__ */ jsxDEV4("div", {
      className: "component-state component-state--error",
      role: "alert",
      children: "The live chart requires an HTTP(S) endpoint or an app-relative path."
    }, undefined, false, undefined, this);
  }
  const chartProps = {
    title: chartTitle(props, "Live chart"),
    type: props.type,
    maxPoints: numberProp(props, "maxPoints", 60),
    dataPath: stringProp(props, ["dataPath"]),
    source: {
      http: resolvedEndpoint,
      every: numberProp(props, "pollIntervalMs", 5000)
    }
  };
  return /* @__PURE__ */ jsxDEV4(Chart, {
    props: chartProps,
    host
  }, undefined, false, undefined, this);
}
export {
  LiveChart as default
};
