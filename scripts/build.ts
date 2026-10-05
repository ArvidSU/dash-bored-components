import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "yaml";
const root = resolve(import.meta.dirname, "..");
const check = process.argv.includes("--check");
for (const name of (await readdir(root)).sort()) {
  const manifestPath = resolve(root, name, "component.yaml");
  if (!await Bun.file(manifestPath).exists()) continue;
  const manifest = parse(await readFile(manifestPath, "utf8"));
  const result = await Bun.build({
    entrypoints: [resolve(root, "src/renderer/builtins", name, "index.tsx")],
    target: "browser", format: "esm", splitting: false, sourcemap: "none",
    external: ["react", "react/jsx-runtime", "react/jsx-dev-runtime", "@dash-bored/component"],
  });
  if (!result.success) throw new AggregateError(result.logs, `Cannot build ${name}`);
  let javascript = ""; let css = "";
  for (const output of result.outputs) {
    if (output.path.endsWith(".css")) css += await output.text();
    else if (output.path.endsWith(".js")) javascript += await output.text();
    else throw new Error(`Unsupported output ${output.path}`);
  }
  const files = { "index.tsx": (css ? 'import "./component.css";\n' : "") + javascript, "component.css": css };
  for (const [filename, source] of Object.entries(files)) {
    const path = resolve(root, name, filename);
    if (check) {
      if (!await Bun.file(path).exists() || await readFile(path, "utf8") !== source) throw new Error(`${name}/${filename} is stale`);
    } else { await mkdir(resolve(root, name), {recursive: true}); await writeFile(path, source); }
  }
  if (manifest.id !== `core/${name}` || manifest.entry !== "./index.tsx") throw new Error(`Invalid manifest ${name}`);
}
