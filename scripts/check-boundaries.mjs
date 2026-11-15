import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "..");
let count = 0;
const errors = [];
async function walk(dir) {
  for (const entry of await readdir(path.join(root, dir), {
    withFileTypes: true,
  })) {
    const file = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(file);
      continue;
    }
    if (!file.endsWith(".js")) continue;
    count++;
    const source = await readFile(path.join(root, file), "utf8");
    for (const match of source.matchAll(
      /(?:import|export)\s[^;]*?from\s*['"]([^'"]+)['"]/g,
    )) {
      const dependency = match[1],
        target = dependency.startsWith(".")
          ? path.posix.normalize(
              path.posix.join(path.posix.dirname(file), dependency),
            )
          : dependency;
      const owner = file.match(/^src\/modules\/([^/]+)/)?.[1],
        other = target.match(/^src\/modules\/([^/]+)/)?.[1];
      if (owner && other && owner !== other)
        errors.push(`${file}: cross-feature import ${dependency}`);
      if (
        file.startsWith("src/shared/") &&
        target.startsWith("src/") &&
        !target.startsWith("src/shared/")
      )
        errors.push(`${file}: shared depends on ${dependency}`);
      if (file.startsWith("src/platform/") && target.startsWith("src/modules/"))
        errors.push(`${file}: platform depends on a feature`);
      if (
        owner &&
        (/^@supabase\//.test(dependency) ||
          target.startsWith("src/integrations/") ||
          target.startsWith("src/platform/"))
      )
        errors.push(`${file}: feature bypasses its injected port`);
    }
    if (
      file.startsWith("src/modules/") &&
      /\b(?:fetch|createClient)\s*\(|\b(?:localStorage|sessionStorage)\b|\/rest\/v1\//.test(
        source,
      )
    )
      errors.push(`${file}: infrastructure leaked into feature`);
    if (/sb_secret_|"role"\s*:\s*"service_role"/.test(source))
      errors.push(`${file}: secret-looking client configuration`);
  }
}
await walk("src");
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Module boundaries passed (${count} source files)`);
