import { useEffect, useState, type ReactNode } from "react";
import "./webview.css";
import type { ComponentRendererProps } from "../shared/types";
import { CapabilityGate, stringProp } from "../shared/shared";

export default function Webview({ props, host }: ComponentRendererProps): ReactNode {
  const url = stringProp(props, ["url", "src"]);
  const title = stringProp(props, ["title"], url);
  const [generation, setGeneration] = useState(0);
  useEffect(() => host.actions.register({
    id: "reload", label: "Reload embedded page", enabled: Boolean(host.webview),
    disabledReason: "Trust this project to embed its configured page.",
    confirmation: { title: "Reload embedded page?", message: "The page will reopen at its configured URL. Unsaved page state may be lost." },
    run: () => setGeneration((value) => value + 1),
  }), [host.actions, host.webview]);
  if (!host.webview) return <CapabilityGate title="Embedded page">Trust this project to load its configured web page.</CapabilityGate>;
  return <section className="webview-shell">
    <header className="webview-shell__header">
      <span className="webview-shell__url" title={url}>{title}</span>
      <button className="button button--quiet" type="button" onClick={() => setGeneration((value) => value + 1)}>Reload</button>
    </header>
    <div className="webview-shell__surface">
      {host.webview.render({ url, style: { width: "100%", height: "100%" }, reloadKey: generation })}
    </div>
  </section>;
}
