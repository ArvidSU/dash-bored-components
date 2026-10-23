import { expect, test } from "bun:test";
import { resolve } from "node:path";
import { parse } from "yaml";

const root = resolve(import.meta.dirname, "..");

test("package templates are portable and legacy references resolve to shipped manifests", async () => {
  const descriptor = parse(await Bun.file(resolve(root, "package.yaml")).text());
  expect(descriptor.schemaVersion).toBe(1);
  expect(descriptor.templates.filter((item: any) => item.role === "starter")).toHaveLength(1);
  expect(descriptor.templates.filter((item: any) => item.role === "tutorial")).toHaveLength(1);
  for (const item of descriptor.templates) {
    const text = await Bun.file(resolve(root, item.path)).text();
    expect(text).not.toContain("./components/external/core/");
    expect(text).toContain("${package}/");
    const data = parse(text);
    if (item.role) expect(data.schemaVersion).toBe(4);
    else expect(data.component).toBe("${package}/group");
  }
  const mappings = Object.entries(descriptor.migrations.references);
  expect(mappings).toHaveLength(17);
  for (const [previous, path] of mappings) {
    const manifest = parse(await Bun.file(resolve(root, path as string, "component.yaml")).text());
    expect(previous).toBe(`@dash-bored/${manifest.id.split("/")[1]}`);
    expect(manifest.apiVersion).toBe("2.0.0");
  }
});


test("starter setup requests dashboard-scoped validation and repair", async () => {
  const starter = parse(await Bun.file(resolve(root, "templates/starter.yaml")).text());
  const nodes: any[] = [];
  const visit = (value: unknown): void => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) { value.forEach(visit); return; }
    const object = value as Record<string, unknown>;
    if (object.id === "setup-dashboard-with-agent") nodes.push(object);
    Object.values(object).forEach(visit);
  };
  visit(starter.root);
  expect(nodes).toHaveLength(1);
  expect(nodes[0].props.action).toMatchObject({ run: "agent:prompt", with: { template: "dashboard" } });
});
