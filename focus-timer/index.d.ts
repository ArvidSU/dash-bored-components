import type { LocalComponentRenderProps } from "@dash-bored/component";
import type { ReactNode } from "react";

export type FocusTimerProps = {
  title?: string;
  focusMinutes?: number;
  breakMinutes?: number;
};
declare function FocusTimer(input: LocalComponentRenderProps<FocusTimerProps>): ReactNode;
export default FocusTimer;
