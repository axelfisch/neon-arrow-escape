// Test-only loader: execute the actual TypeScript game modules with Node 22+.
import fs from "node:fs";
import ts from "typescript";

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && context.parentURL) {
    const url = new URL(specifier, context.parentURL);
    for (const suffix of ["", ".ts", ".tsx", ".json"]) {
      const candidate = new URL(url.href + suffix);
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile())
        return { url: candidate.href, shortCircuit: true };
    }
  }
  return nextResolve(specifier, context);
}
export async function load(url, context, nextLoad) {
  if (url.endsWith(".json"))
    return {
      format: "module",
      source: `export default ${fs.readFileSync(new URL(url), "utf8")}`,
      shortCircuit: true,
    };
  if (/\.tsx?$/.test(url))
    return {
      format: "module",
      shortCircuit: true,
      source: ts.transpileModule(fs.readFileSync(new URL(url), "utf8"), {
        compilerOptions: {
          target: ts.ScriptTarget.ES2022,
          module: ts.ModuleKind.ESNext,
          jsx: ts.JsxEmit.ReactJSX,
        },
      }).outputText,
    };
  return nextLoad(url, context);
}
