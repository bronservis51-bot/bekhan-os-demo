import test from "node:test";
import assert from "node:assert/strict";
import { createCrmModule } from "../src/modules/crm/index.js";
import * as primitives from "../src/shared/ui.js";
import { createDemoWorkspace } from "../src/platform/demo-store.js";
import { seed } from "../src/app/demo-seed.js";
import { normalizeLead } from "../src/modules/crm/demo-model.js";
function setup(repository) {
  const modal = { open: false };
  globalThis.document = {
    visibilityState: "visible",
    activeElement: null,
    addEventListener() {},
    removeEventListener() {},
    getElementById: (id) => (id === "modal" ? modal : null),
    querySelector: () => null,
  };
  globalThis.window = { addEventListener() {}, removeEventListener() {} };
  globalThis.requestAnimationFrame = (fn) => fn();
  let state = { status: "signed-in", profile: { id: "user-a", name: "Demo" } },
    listener;
  const auth = {
      getState: () => state,
      subscribe(fn) {
        listener = fn;
      },
      invalidate() {
        state = { status: "signed-out", profile: null };
        listener?.(state);
      },
    },
    ui = {
      ...primitives,
      openModal() {
        modal.open = true;
      },
      closeModal() {
        modal.open = false;
      },
      setBusy() {},
      toast() {},
      canLeave: () => true,
    };
  const workspace = createDemoWorkspace({
    seed,
    normalize: (value) => ({ ...value, deals: value.deals.map(normalizeLead) }),
  });
  const module = createCrmModule({
    repository,
    demoRepository: workspace.repository(["deals"]),
    auth,
    ui,
    navigation: { getPage: () => "crm", go() {} },
    render() {},
  });
  module.render();
  return { module, auth, workspace };
}
const values = {
  lead_contact: "Тестовая заявка",
  phone: "",
  city: "",
  column: "000",
  note: "First draft",
};
test("a retry after a lost response retains its UUID and exact input; changed data is blocked", async () => {
  const calls = [];
  let fail = true;
  const { module } = setup({
    list: async () => [],
    save: async (input, options) => {
      calls.push({ input, options });
      if (fail)
        throw Object.assign(new Error("No response"), { code: "network" });
      return {
        ...input,
        id: options.operation,
        updated_at: "server-time",
        created_at: "server-time",
        status: "new",
      };
    },
  });
  try {
    module.open();
    await module.forms.lead({ form: { dataset: { id: "" } }, values });
    await module.forms.lead({
      form: { dataset: { id: "" } },
      values: { ...values, note: "Changed draft" },
    });
    assert.equal(calls.length, 1);
    fail = false;
    await module.forms.lead({ form: { dataset: { id: "" } }, values });
    assert.equal(calls.length, 2);
    assert.equal(calls[0].options.operation, calls[1].options.operation);
    assert.deepEqual(calls[0].input, calls[1].input);
  } finally {
    module.destroy();
  }
});
test("background refresh does not change the edit version; conflict keeps the server row and draft separate", async () => {
  let row = {
      id: "a",
      name: "Тест",
      status: "new",
      updated_at: "version-1",
      created_at: "2026-01-01",
      note: "Old",
    },
    sent;
  const { module } = setup({
    list: async () => [structuredClone(row)],
    save: async (input, options) => {
      sent = { input, options };
      throw Object.assign(new Error("version conflict"), {
        code: "version-conflict",
      });
    },
  });
  try {
    await module.actions["lead-refresh"]();
    module.open("a");
    row = { ...row, note: "Other app edit", updated_at: "version-2" };
    await module.actions["lead-refresh"]();
    await module.forms.lead({ form: { dataset: { id: "a" } }, values });
    assert.equal(sent.options.expected, "version-1");
    assert.equal(sent.input.note, "First draft");
    assert.equal(module.selectors.searchEntries()[0].note, "Other app edit");
  } finally {
    module.destroy();
  }
});
test("signed-out commands cannot write and real records never enter demo persistence", async () => {
  let writes = 0;
  const { module, auth, workspace } = setup({
    list: async () => [
      {
        id: "real",
        name: "Private real contact",
        status: "new",
        updated_at: "1",
        created_at: "2026-01-01",
      },
    ],
    save: async () => {
      writes++;
    },
  });
  try {
    await module.actions["lead-refresh"]();
    assert.equal(module.selectors.searchEntries().length, 1);
    assert.ok(
      !JSON.stringify(workspace.snapshot()).includes("Private real contact"),
    );
    auth.invalidate();
    await module.forms.lead({ form: { dataset: { id: "" } }, values });
    assert.equal(writes, 0);
    assert.deepEqual(module.selectors.searchEntries(), []);
  } finally {
    module.destroy();
  }
});
