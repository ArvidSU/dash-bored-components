import TerminalSurfaceView from "./TerminalSurfaceView";
import type { TerminalSurfaceProps } from "./terminal-types";

export function TerminalSurface(props: TerminalSurfaceProps) {
  return <TerminalSurfaceView {...props} />;
}
