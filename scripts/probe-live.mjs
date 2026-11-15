// Read-only / rejected requests only. Never creates a production lead.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { backendConfig } from "../src/app/config.js";
const html = await (
  await fetch("https://bronservis.ru/", { signal: AbortSignal.timeout(20000) })
).text();
const api = html.match(/API\s*=\s*(['"])(.*?)\1/),
  key = html.match(/KEY\s*=\s*(['"])(.*?)\1/);
assert.ok(api && key, "Landing API configuration is not recognized");
assert.equal(api[2], `${backendConfig.url}/rest/v1/rpc/lead_submit`);
assert.equal(key[2], backendConfig.publishableKey);
const results = [];
for (const [path, body, expected] of [
  ["/auth/v1/health", null, 200],
  ["/rest/v1/rpc/ping", {}, 200],
  ["/rest/v1/rpc/lead_list", {}, 401],
  ["/rest/v1/rpc/lead_submit", { p_lead: {} }, 400],
]) {
  const response = await fetch(backendConfig.url + path, {
    method: body === null ? "GET" : "POST",
    headers: {
      apikey: backendConfig.publishableKey,
      "Content-Type": "application/json",
      Origin: "https://bronservis51-bot.github.io",
    },
    ...(body === null ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(20000),
  });
  const data = await response.json();
  assert.equal(response.status, expected, path);
  if (path.endsWith("/ping")) assert.equal(data, "ok");
  if (path.endsWith("/lead_submit")) assert.equal(data.message, "validation");
  if (path.endsWith("/health")) assert.equal(data.name, "GoTrue");
  results.push({ path, status: response.status });
}
console.log(
  JSON.stringify({
    landingConfiguration: "matches",
    landingSha256: createHash("sha256").update(html).digest("hex"),
    backend: backendConfig.url,
    results,
    productionLeadsCreated: 0,
  }),
);
