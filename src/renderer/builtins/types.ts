import type { ReactNode } from "react";
import type { LocalComponentRenderProps } from "@dash-bored/component";

export type ComponentRendererProps<Props = Record<string, unknown>> = LocalComponentRenderProps<Props>;

export type PackagedComponent = (props: ComponentRendererProps) => ReactNode;
