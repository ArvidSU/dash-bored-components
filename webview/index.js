import "./component.css";
// src/renderer/builtins/webview/index.tsx
import { Fragment, useEffect, useState } from "react";

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

// src/renderer/builtins/webview/index.tsx
import { jsxDEV as jsxDEV2 } from "react/jsx-dev-runtime";
function Webview({ props, host: componentHost }) {
  const url = stringProp(props, ["url", "src"]);
  const [generation, setGeneration] = useState(0);
  useEffect(() => componentHost.actions.register({
    id: "reload",
    label: "Reload embedded page",
    enabled: Boolean(componentHost.webview),
    disabledReason: "Trust this project to embed its configured page.",
    confirmation: { title: "Reload embedded page?", message: "The page will reopen at its configured URL. Unsaved page state may be lost." },
    run: () => setGeneration((value) => value + 1)
  }), [componentHost.actions, componentHost.webview]);
  if (!componentHost.webview) {
    return /* @__PURE__ */ jsxDEV2(CapabilityGate, {
      title: "Embedded page",
      children: "Trust this project to load its configured web page."
    }, undefined, false, undefined, this);
  }
  return /* @__PURE__ */ jsxDEV2(Fragment, {
    children: componentHost.webview.render({ url })
  }, generation, false, undefined, this);
}
export {
  Webview as default
};
