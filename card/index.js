import "./component.css";
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

// src/renderer/builtins/card/index.tsx
import { jsxDEV as jsxDEV2 } from "react/jsx-dev-runtime";
function Card({ props, children }) {
  const title = stringProp(props, ["title"]);
  const description = stringProp(props, ["description"]);
  return /* @__PURE__ */ jsxDEV2("section", {
    className: "card",
    children: [
      title || description ? /* @__PURE__ */ jsxDEV2("header", {
        className: "card__header",
        children: [
          title ? /* @__PURE__ */ jsxDEV2("h2", {
            children: title
          }, undefined, false, undefined, this) : null,
          description ? /* @__PURE__ */ jsxDEV2("p", {
            children: description
          }, undefined, false, undefined, this) : null
        ]
      }, undefined, true, undefined, this) : null,
      /* @__PURE__ */ jsxDEV2("div", {
        className: "card__body",
        children: childSurface(children)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
export {
  Card as default
};
