import { describe, expect, test } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "yaml";

const root = resolve(import.meta.dirname, "..");
const components = (await readdir(root)).filter((name) =>
  Bun.file(resolve(root, name, "component.yaml")).size > 0,
).sort();

describe("editable source package", () => {
  test("all 17 components ship their actual source entry", async () => {
    expect(components).toHaveLength(17);
    for (const name of components) {
      const directory = resolve(root, name);
      const manifest = parse(await readFile(resolve(directory, "component.yaml"), "utf8"));
      expect(manifest.id).toBe(`core/${name}`);
      expect(manifest.apiVersion).toBe("1.0.0");
      expect(manifest.entry).toBe("./index.tsx");
      expect(manifest.sourceRoot).toBe("..");
      expect(manifest.types).toBeUndefined();
      expect(await Bun.file(resolve(directory, "index.tsx")).exists()).toBe(true);
      expect(await Bun.file(resolve(directory, "index.js")).exists()).toBe(false);
    }
  });

  test("Markdown uses the prepared dependency without installing packages at runtime", async () => {
    const markdown = await readFile(resolve(root, "markdown/index.tsx"), "utf8");
    expect(markdown).toContain('from "../vendor/react-markdown.js"');
    const dependency = await readFile(resolve(root, "vendor/react-markdown.js"), "utf8");
    expect(dependency).toMatch(/from\s*["']react["']/);
    expect(dependency).not.toContain("node_modules/react/cjs/react.production");
    expect(dependency).not.toMatch(/from\s*["'](?:node:|react-markdown["'])/);
    // This browser build initializes a DOM entity decoder at module scope.
    // App integration tests exercise rendering in the real browser.
    expect(dependency).toContain("function Markdown(");
  });
});
