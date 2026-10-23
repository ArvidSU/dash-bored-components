import type { ProcessSnapshot } from "@dash-bored/component";

export interface TerminalSurfaceProps {
  process?: ProcessSnapshot;
  onWrite?: (input: string) => Promise<ProcessSnapshot>;
  onResize?: (cols: number, rows: number) => Promise<ProcessSnapshot>;
  scrollToLatest?: number;
  label?: string;
}
