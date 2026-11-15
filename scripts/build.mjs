import { build } from "esbuild";
import { backendConfig } from "../src/app/config.js";
import {
  mkdir,
  rm,
  readFile,
  writeFile,
  readdir,
  copyFile,
} from "node:fs/promises";
import path from "node:path";
const root = path.resolve(import.meta.dirname, ".."),
  dist = path.join(root, "dist");
await rm(dist, { recursive: true, force: true });
await mkdir(path.join(dist, "assets"), { recursive: true });
const result = await build({
  absWorkingDir: root,
  entryPoints: ["src/app/main.js"],
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["es2022"],
  outdir: "dist/assets",
  entryNames: "app-[hash]",
  assetNames: "asset-[hash]",
  minify: true,
  metafile: true,
  legalComments: "none",
  charset: "utf8",
});
const outputs = Object.keys(result.metafile.outputs),
  js = outputs.find((x) => x.endsWith(".js")),
  css = outputs.find((x) => x.endsWith(".css"));
const html = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#183d37"><meta name="referrer" content="no-referrer"><meta name="robots" content="noindex,nofollow"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' ${backendConfig.url}; object-src 'none'; base-uri 'self'; form-action 'none'"><title>BEKHAN OS</title><meta name="description" content="Личное пространство директора и CRM Бронь Сервис"><link rel="icon" href="./icon.svg" type="image/svg+xml"><link rel="stylesheet" href="./${css.replace("dist/", "")}"><script type="module" src="./${js.replace("dist/", "")}"></script></head><body><a class="skip" href="#content">К содержимому</a><div id="app"></div><dialog id="modal" aria-labelledby="modal-title"></dialog><div id="toast" role="status" aria-live="polite"></div><noscript>Для работы приложения включите JavaScript.</noscript></body></html>`;
await writeFile(path.join(dist, "index.html"), html);
await copyFile(path.join(root, "icon.svg"), path.join(dist, "icon.svg"));
await writeFile(path.join(dist, ".nojekyll"), "");
// GitHub Pages currently serves main:/, so commit this exact build beside sources.
await mkdir(path.join(root, "assets"), { recursive: true });
for (const name of await readdir(path.join(dist, "assets")))
  await copyFile(
    path.join(dist, "assets", name),
    path.join(root, "assets", name),
  );
await writeFile(path.join(root, "index.html"), html);
console.log(
  JSON.stringify({
    js: js.replace("dist/", ""),
    css: css.replace("dist/", ""),
    modules: Object.keys(result.metafile.inputs).filter((x) =>
      x.startsWith("src/"),
    ).length,
  }),
);
// Include redistribution notices for the SDK and its runtime dependencies.
const lock = JSON.parse(
  await readFile(path.join(root, "package-lock.json"), "utf8"),
);
const notices = [];
for (const [location, metadata] of Object.entries(lock.packages)) {
  if (!location || metadata.dev) continue;
  const directory = path.join(root, location),
    pkg = JSON.parse(
      await readFile(path.join(directory, "package.json"), "utf8"),
    );
  const names = (await readdir(directory)).filter((name) =>
    /^licen[sc]e(?:[.-]|$)|^copyright/i.test(name),
  );
  for (const name of names) {
    const content = await readFile(path.join(directory, name), "utf8").catch(
      () => null,
    );
    if (content)
      notices.push(
        `${pkg.name} ${pkg.version}\n${"=".repeat(60)}\n${content.replace(/\r\n?/g, "\n")}`,
      );
  }
}
await writeFile(
  path.join(dist, "third-party-notices.txt"),
  notices.join("\n\n"),
);
await copyFile(
  path.join(dist, "third-party-notices.txt"),
  path.join(root, "third-party-notices.txt"),
);
