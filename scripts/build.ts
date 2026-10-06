import { readdir, readFile, mkdir, unlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "yaml";
const root = resolve(import.meta.dirname, "..");
const check = process.argv.includes("--check");

function toType(schema: Record<string, any>): string {
  if (Array.isArray(schema.enum)) return schema.enum.map((value) => JSON.stringify(value)).join(" | ");
  if ("const" in schema) return JSON.stringify(schema.const);
  if (Array.isArray(schema.allOf)) return schema.allOf.map((item) => toType(item)).join(" & ");

  const type = Array.isArray(schema.type) ? schema.type.filter((value: string) => value !== "null") : schema.type;
  const nullable = Array.isArray(schema.type) && schema.type.includes("null");
  let result: string;
  if (type === "object" || schema.properties) {
    const properties = schema.properties ?? {};
    result = objectType(properties, new Set<string>(schema.required ?? []), schema.additionalProperties);
    for (const keyword of ["anyOf", "oneOf"] as const) {
      if (!Array.isArray(schema[keyword])) continue;
      const alternatives = schema[keyword] as Record<string, any>[];
      const choices = alternatives.map((alternative, index) => {
        const excluded = keyword === "oneOf"
          ? alternatives.flatMap((other, otherIndex) => otherIndex === index ? [] : other.required ?? [])
          : [];
        return constraintType(alternative, properties, excluded);
      });
      result = `(${result}) & (${choices.join(" | ")})`;
    }
  } else if (Array.isArray(type)) {
    result = type.map((value: string) => toType({ ...schema, type: value })).join(" | ");
  } else if (Array.isArray(schema.oneOf ?? schema.anyOf)) {
    result = (schema.oneOf ?? schema.anyOf).map((item: Record<string, any>) => toType(item)).join(" | ");
  } else if (type === "array") {
    const item = schema.items ? toType(schema.items) : "unknown";
    result = `(${item})[]`;
  } else if (type === "string") result = "string";
  else if (type === "number" || type === "integer") result = "number";
  else if (type === "boolean") result = "boolean";
  else if (type === "null") result = "null";
  else result = "unknown";
  return nullable ? `${result} | null` : result;
}

function objectType(properties: Record<string, Record<string, any>>, required: Set<string>, additional: unknown): string {
  const fields = Object.entries(properties).map(([name, value]) => {
    const key = /^[A-Za-z_$][\w$]*$/.test(name) ? name : JSON.stringify(name);
    return `  ${key}${required.has(name) ? "" : "?"}: ${toType(value)};`;
  });
  if (additional && additional !== true && typeof additional === "object") {
    fields.push(`  [key: string]: ${toType(additional as Record<string, any>)};`);
  } else if (additional === true) fields.push("  [key: string]: unknown;");
  return fields.length ? `{
${fields.join("\n")}
}` : "Record<string, unknown>";
}

function constraintType(constraint: Record<string, any>, properties: Record<string, Record<string, any>>, alsoExclude: string[] = []): string {
  const required = new Set<string>(constraint.required ?? []);
  const forbidden = new Set<string>(alsoExclude);
  for (const name of constraint.not?.required ?? []) forbidden.add(name);
  for (const key of ["anyOf", "oneOf"] as const) {
    for (const branch of constraint.not?.[key] ?? []) for (const name of branch.required ?? []) forbidden.add(name);
  }
  const fields: string[] = [];
  for (const name of required) {
    const key = /^[A-Za-z_$][\w$]*$/.test(name) ? name : JSON.stringify(name);
    fields.push(`  ${key}: ${properties[name] ? toType(properties[name]!) : "unknown"};`);
  }
  for (const name of forbidden) {
    if (required.has(name)) continue;
    const key = /^[A-Za-z_$][\w$]*$/.test(name) ? name : JSON.stringify(name);
    fields.push(`  ${key}?: never;`);
  }
  return fields.length ? `{
${fields.join("\n")}
}` : "Record<string, unknown>";
}

function declaration(name: string, propsSchema: Record<string, any>): string {
  const props = toType(propsSchema);
  return `import type { LocalComponentRenderProps } from "@dash-bored/component";\nimport type { ReactNode } from "react";\n\nexport type ${pascal(name)}Props = ${props};\ndeclare function ${pascal(name)}(input: LocalComponentRenderProps<${pascal(name)}Props>): ReactNode;\nexport default ${pascal(name)};\n`;
}

function pascal(value: string): string {
  return value.split(/[^A-Za-z0-9]+/).filter(Boolean).map((part) => part[0]!.toUpperCase() + part.slice(1)).join("");
}

for (const name of (await readdir(root)).sort()) {
  const manifestPath = resolve(root, name, "component.yaml");
  if (!await Bun.file(manifestPath).exists()) continue;
  const manifest = parse(await readFile(manifestPath, "utf8"));
  if (manifest.id !== `core/${name}` || manifest.schemaVersion !== 3 || manifest.apiVersion !== "1.0.0" || manifest.entry !== "./index.js" || manifest.types !== "./index.d.ts") {
    throw new Error(`Invalid API 1.0.0 manifest ${name}`);
  }
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
  const files = {
    "index.js": (css ? 'import "./component.css";\n' : "") + javascript,
    "component.css": css,
    "index.d.ts": declaration(name, manifest.propsSchema),
  };
  for (const [filename, source] of Object.entries(files)) {
    const path = resolve(root, name, filename);
    if (check) {
      if (!await Bun.file(path).exists() || await readFile(path, "utf8") !== source) throw new Error(`${name}/${filename} is stale`);
    } else { await mkdir(resolve(root, name), {recursive: true}); await writeFile(path, source); }
  }
  const legacyEntry = resolve(root, name, "index.tsx");
  if (check && await Bun.file(legacyEntry).exists()) throw new Error(`${name}/index.tsx is a stale generated entry`);
  if (!check) await unlink(legacyEntry).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
}
