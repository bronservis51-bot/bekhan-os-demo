import test from "node:test";
import assert from "node:assert/strict";
import { createLeadRepository } from "../src/integrations/bron-leads/repository.js";
import { validateBackendConfig } from "../src/integrations/bron-leads/config.js";
import {
  createAuthStorage,
  toBackendError,
} from "../src/integrations/bron-leads/client.js";
import { createAuthService } from "../src/integrations/bron-leads/auth.js";
const memory = () => {
  const m = new Map();
  return {
    get length() {
      return m.size;
    },
    key: (i) => [...m.keys()][i],
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => m.set(k, v),
    removeItem: (k) => m.delete(k),
  };
};
test("existing RPC names, concurrency tokens and creation key are preserved exactly", async () => {
  const calls = [],
    repo = createLeadRepository({
      rpc: async (name, args) => {
        calls.push({ name, args });
        return name.endsWith("list") ? [] : { id: "a", updated_at: "2" };
      },
    }),
    lead = { id: "a", updated_at: "old" };
  await repo.list();
  await repo.list({ trash: true });
  await repo.move(lead, "111");
  await repo.save(
    { name: "Example", column: "000" },
    { expected: "old", operation: "same-key" },
  );
  await repo.setDeleted(lead, true);
  assert.deepEqual(
    calls.map((x) => x.name),
    [
      "lead_list",
      "lead_trash_list",
      "lead_move",
      "lead_save",
      "lead_set_deleted",
    ],
  );
  assert.deepEqual(calls[2].args, {
    p_id: "a",
    p_column: "111",
    p_expected_updated_at: "old",
  });
  assert.equal(calls[3].args.p_operation, "same-key");
  assert.equal(calls[4].args.p_expected_updated_at, "old");
  assert.ok(!calls.some((x) => x.name === "lead_submit"));
});
test("client config rejects secrets and non-HTTPS origins", () => {
  const anon = "x." + btoa(JSON.stringify({ role: "anon" })) + ".x";
  assert.equal(
    validateBackendConfig({ url: "https://example.test", publishableKey: anon })
      .url,
    "https://example.test",
  );
  assert.throws(() =>
    validateBackendConfig({ url: "http://example.test", publishableKey: anon }),
  );
  assert.throws(() =>
    validateBackendConfig({
      url: "https://example.test",
      publishableKey: "sb_secret_bad",
    }),
  );
  assert.throws(() =>
    validateBackendConfig({
      url: "https://example.test",
      publishableKey:
        "x." + btoa(JSON.stringify({ role: "service_role" })) + ".x",
    }),
  );
});
test("own session storage never changes the old app session or demo data", () => {
  const local = memory(),
    session = memory();
  local.setItem("sb-old-auth-token", "keep");
  local.setItem("bekhan-os-demo-v1", "demo");
  const s = createAuthStorage({ localStorage: local, sessionStorage: session });
  s.setItem("bekhan-os-auth-v1", "own");
  assert.equal(session.getItem("bekhan-os-auth-v1"), "own");
  s.clear();
  assert.equal(session.getItem("bekhan-os-auth-v1"), null);
  assert.equal(local.getItem("sb-old-auth-token"), "keep");
  assert.equal(local.getItem("bekhan-os-demo-v1"), "demo");
});
test("conflict and authorization errors remain distinguishable to UI", () => {
  assert.equal(
    toBackendError({ message: "version-conflict" }).code,
    "version-conflict",
  );
  assert.equal(toBackendError({ code: "42501" }).code, "forbidden");
  assert.equal(toBackendError({ name: "AbortError" }).code, "network");
});
test("auth uses server assignments, not user metadata, and logout is local", async () => {
  let scope,
    allow = false,
    callback;
  const backend = {
    rpc: async () => ({
      user: { id: "a", full_name: "Example" },
      assignments: allow ? [{ permissions: ["org.manage"] }] : [],
    }),
    client: {
      auth: {
        onAuthStateChange: (fn) => (
          (callback = fn),
          { data: { subscription: { unsubscribe() {} } } }
        ),
        getSession: async () => ({ data: { session: null } }),
        signInWithPassword: async () => ({
          data: { user: { user_metadata: { role: "manager" } } },
        }),
        signOut: async (arg) => {
          scope = arg.scope;
          callback("SIGNED_OUT");
        },
      },
    },
  };
  const auth = createAuthService({
    backend,
    storage: { setRemember() {}, clear() {} },
  });
  await auth.start();
  await assert.rejects(auth.signIn("a@example.test", "password"), {
    code: "forbidden",
  });
  assert.equal(auth.getState().status, "signed-out");
  allow = true;
  await auth.signIn("a@example.test", "password");
  assert.equal(auth.getState().status, "signed-in");
  await auth.signOut();
  assert.equal(scope, "local");
  assert.equal(auth.getState().profile, null);
  auth.destroy();
});
