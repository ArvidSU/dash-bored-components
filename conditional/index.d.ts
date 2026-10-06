import type { LocalComponentRenderProps } from "@dash-bored/component";
import type { ReactNode } from "react";

export type ConditionalProps = {
  command: string;
  cwd?: string;
  env?: {
  [key: string]: string;
};
  invert?: boolean;
  pollIntervalMs?: number;
  timeoutMs?: number;
};
declare function Conditional(input: LocalComponentRenderProps<ConditionalProps>): ReactNode;
export default Conditional;
