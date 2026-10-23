import { readdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
for (const name of (await readdir(root)).sort()) {
  if (!await Bun.file(resolve(root, name, "component.yaml")).exists()) continue;
  const result = Bun.spawnSync([
    "sh", resolve(root, "dash-bored.sh"), "component", "check", name,
    "--source-project", "tsconfig.json",
  ], { cwd: root, stdout: "inherit", stderr: "inherit" });
  if (result.exitCode !== 0) process.exit(result.exitCode);
}
