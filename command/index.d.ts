import type { LocalComponentRenderProps } from "@dash-bored/component";
import type { ReactNode } from "react";

export type CommandProps = {
  label: string;
  command: string;
  cwd?: string;
  env?: {
  [key: string]: string;
};
};
declare function Command(input: LocalComponentRenderProps<CommandProps>): ReactNode;
export default Command;
