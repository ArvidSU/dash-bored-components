declare module "@dash-bored/component" {
 export function useComponentVisibility(): boolean;
 export function trackActivity<T>(work: Promise<T>): Promise<T>;
 export const TerminalSurface: import("react").ComponentType<import("./shared/contracts").TerminalSurfaceProps>;
}
