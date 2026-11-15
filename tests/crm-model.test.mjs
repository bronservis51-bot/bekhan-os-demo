import test from "node:test";
import assert from "node:assert/strict";
import {
  COLUMNS,
  readinessKey,
  leadColumn,
  leadInput,
  groupLeads,
  changeDemoColumn,
} from "../src/modules/crm/model.js";
import { normalizeLead } from "../src/modules/crm/demo-model.js";
import { createLeadView } from "../src/modules/crm/view.js";
import * as ui from "../src/shared/ui.js";
test("readiness combinations retain the original order and full funding requirement", () => {
  assert.deepEqual(
    COLUMNS.map((x) => x.id),
    [
      "000",
      "010",
      "001",
      "100",
      "011",
      "110",
      "101",
      "111",
      "in_work",
      "won",
      "lost",
    ],
  );
  for (let i = 0; i < 8; i++) {
    const bits = i.toString(2).padStart(3, "0");
    assert.equal(
      readinessKey({
        budget: bits[0] === "1" ? "full" : "partial",
        place: bits[1] === "1" ? "has" : "options",
        timing: bits[2] === "1" ? "month" : "quarter",
      }),
      bits,
    );
  }
  assert.equal(leadColumn({ status: "meeting" }), "in_work");
  assert.equal(
    leadColumn({ status: "new", pipeline_column: "101", budget: "none" }),
    "101",
  );
});
test("manual move does not rewrite questionnaire or declare payment", () => {
  const d = {
    status: "new",
    funding: "full",
    place: "has",
    timing: "month",
    paid: false,
  };
  changeDemoColumn(d, "000");
  assert.equal(leadColumn(d), "000");
  changeDemoColumn(d, "auto");
  assert.equal(leadColumn(d), "111");
  changeDemoColumn(d, "won");
  assert.equal(d.paid, false);
  assert.equal(d.funding, "full");
});
test("legacy migration retains IDs, amounts, history and deletion state", () => {
  const input = {
    id: "d7",
    stage: 4,
    budget: 1300000,
    history: ["existing"],
    source: "Сайт",
    deleted_at: "2026-11-12T10:00:00Z",
  };
  const out = normalizeLead(input);
  assert.equal(out.id, input.id);
  assert.equal(out.budget, input.budget);
  assert.equal(out.paid, true);
  assert.deepEqual(out.history, input.history);
  assert.equal(out.deleted_at, input.deleted_at);
  assert.equal(normalizeLead(out).status, "won");
});
test("quick form matches server validation and never sends unsupported demo fields", () => {
  const value = leadInput({
    lead_contact: "https://instagram.com/demo_name/",
    column: "111",
    note: " Test ",
    phone: "",
    paid: "on",
    budget: 100,
  });
  assert.deepEqual(value, {
    name: "@demo_name",
    instagram: "demo_name",
    column: "111",
    note: "Test",
    phone: "",
    city: "",
  });
  assert.throws(() => leadInput({ lead_contact: "@.bad", column: "000" }));
  assert.throws(() =>
    leadInput({ lead_contact: "Тест", column: "000", phone: "12345" }),
  );
  assert.throws(() =>
    leadInput({ lead_contact: "Тест", column: "000", city: "А" }),
  );
});
test("search normalizes phones, hides deleted, and only-new never includes work statuses", () => {
  const rows = [
    {
      id: "a",
      name: "Тест",
      phone: "+7 (999) 111-22-33",
      status: "new",
      created_at: "2026-01-01",
    },
    {
      id: "b",
      name: "Тест",
      phone: "",
      status: "meeting",
      created_at: "2026-01-02",
    },
    {
      id: "c",
      name: "Тест",
      status: "new",
      deleted_at: "2026-01-01",
      created_at: "2026-01-01",
    },
  ];
  assert.deepEqual(
    [...groupLeads(rows, { query: "8 (999) 111-22-33" }).values()]
      .flat()
      .map((x) => x.id),
    ["a"],
  );
  assert.deepEqual(
    [...groupLeads(rows, { onlyNew: true }).values()].flat().map((x) => x.id),
    ["a"],
  );
});
test("UI escapes contact, note and questionnaire input; failed read is not an empty queue", () => {
  const view = createLeadView(ui),
    lead = {
      id: "safe",
      name: "<img src=x onerror=alert(1)>",
      status: "new",
      note: "<script>bad</script>",
      comment: "<bad>",
      source: "<url>",
      created_at: "2026-01-01",
    };
  const html = view.board([lead], {});
  assert.ok(!html.includes("<img src=x"));
  assert.ok(html.includes("&lt;script&gt;"));
  const form = view.editor(lead);
  assert.ok(form.includes("&lt;url&gt;"));
  const page = view.page({
    items: [],
    trashItems: [],
    view: {},
    feed: { status: "error", error: "Network failed", lastSuccess: null },
    auth: { status: "signed-in", profile: {} },
    demo: false,
  });
  assert.ok(page.includes("Не удалось загрузить очередь"));
  assert.ok(!page.includes("Нет заявок"));
});
