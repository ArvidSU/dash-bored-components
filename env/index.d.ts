import type { LocalComponentRenderProps } from "@dash-bored/component";
import type { ReactNode } from "react";

export type EnvProps = {
  path: string;
};
declare function Env(input: LocalComponentRenderProps<EnvProps>): ReactNode;
export default Env;
