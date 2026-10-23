import type { ThemeTokens } from "@dash-bored/component";

export function terminalTheme(tokens: ThemeTokens): Record<string, string> {
  return Object.fromEntries(Object.entries(tokens).filter(([key]) => key.startsWith("terminal-")).map(([key, value]) => [key === "terminal-selection" ? "selectionBackground" : key.slice(9), value]));
}
