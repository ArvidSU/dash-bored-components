import type { LocalComponentRenderProps } from "@dash-bored/component";
import type { ReactNode } from "react";

export type LiveChartProps = {
  title?: string;
  type?: "line" | "bar";
  maxPoints?: number;
  endpoint: string;
  dataPath?: string;
  pollIntervalMs?: number;
};
declare function LiveChart(input: LocalComponentRenderProps<LiveChartProps>): ReactNode;
export default LiveChart;
