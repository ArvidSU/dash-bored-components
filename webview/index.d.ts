import type { LocalComponentRenderProps } from "@dash-bored/component";
import type { ReactNode } from "react";

export type WebviewProps = {
  url: string;
};
declare function Webview(input: LocalComponentRenderProps<WebviewProps>): ReactNode;
export default Webview;
