import type { LocalComponentRenderProps } from "@dash-bored/component";
import type { ReactNode } from "react";

export type SetupAgentProps = Record<string, unknown>;
declare function SetupAgent(input: LocalComponentRenderProps<SetupAgentProps>): ReactNode;
export default SetupAgent;
