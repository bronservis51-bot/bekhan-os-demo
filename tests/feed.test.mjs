import test from "node:test";
import assert from "node:assert/strict";
import { createLeadFeed } from "../src/modules/crm/feed.js";
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { resolve, reject, promise };
};
test("late response after account reset cannot restore former contacts", async () => {
  const d = deferred(),
    feed = createLeadFeed({ repository: { list: () => d.promise } });
  const p = feed.refresh();
  feed.reset();
  d.resolve([{ id: "private" }]);
  await p;
  assert.deepEqual(feed.getState().items, []);
  assert.equal(feed.getState().lastSuccess, null);
});
test("stale list response cannot undo a confirmed mutation", async () => {
  const d = deferred(),
    feed = createLeadFeed({ repository: { list: () => d.promise } });
  const p = feed.refresh();
  feed.apply({ id: "a", status: "won", updated_at: "2026-01-02" });
  d.resolve([{ id: "a", status: "new", updated_at: "2026-01-01" }]);
  await p;
  assert.equal(feed.getState().items[0].status, "won");
});
test("network failure retains the dated last successful list and surfaces failure", async () => {
  let fail = false;
  const feed = createLeadFeed({
    repository: {
      list: async () => {
        if (fail) throw new Error("Нет связи");
        return [{ id: "a" }];
      },
    },
    now: () => "verified-time",
  });
  await feed.refresh();
  fail = true;
  await feed.refresh();
  assert.equal(feed.getState().status, "error");
  assert.equal(feed.getState().error, "Нет связи");
  assert.equal(feed.getState().lastSuccess, "verified-time");
  assert.equal(feed.getState().items.length, 1);
});
test("access loss clears contacts and notifies the auth boundary", async () => {
  let fail = false,
    lost = 0;
  const feed = createLeadFeed({
    repository: {
      list: async () => {
        if (fail)
          throw Object.assign(new Error("Отозван доступ"), {
            code: "forbidden",
          });
        return [{ id: "a" }];
      },
    },
    onAccessLost: () => lost++,
  });
  await feed.refresh();
  fail = true;
  await feed.refresh();
  assert.equal(lost, 1);
  assert.deepEqual(feed.getState().items, []);
  assert.equal(feed.getState().lastSuccess, null);
});
test("delete and restore move the same UUID rather than copying records", () => {
  const feed = createLeadFeed({ repository: {} });
  feed.apply({ id: "a", updated_at: "1" });
  feed.apply({ id: "a", updated_at: "2", deleted_at: "2" });
  assert.equal(feed.getState().items.length, 0);
  assert.equal(feed.getState().trashItems.length, 1);
  feed.apply({ id: "a", updated_at: "3", deleted_at: null });
  assert.equal(feed.getState().trashItems.length, 0);
  assert.equal(feed.getState().items.length, 1);
});
