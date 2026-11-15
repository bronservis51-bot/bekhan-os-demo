import test from "node:test";
import assert from "node:assert/strict";
import * as primitives from "../src/shared/ui.js";
import { seed } from "../src/app/demo-seed.js";
import {
  createDemoWorkspace,
  DEMO_STORAGE_KEY,
} from "../src/platform/demo-store.js";
import { createFinanceModule } from "../src/modules/finance/index.js";
import { createTasksModule } from "../src/modules/tasks/index.js";
import { createNetworkModule } from "../src/modules/network/index.js";
import { createBrandModule } from "../src/modules/brand/index.js";
import { createGoalsModule } from "../src/modules/goals/index.js";
import { createFitnessModule } from "../src/modules/fitness/index.js";
import { createDashboardModule } from "../src/modules/dashboard/index.js";
import { normalizeLead } from "../src/modules/crm/demo-model.js";
import { leadLabel } from "../src/modules/crm/model.js";
const setup = () => {
  let saved = null;
  const storage = {
    getItem: () => saved,
    setItem: (key, value) => {
      assert.equal(key, DEMO_STORAGE_KEY);
      saved = value;
    },
  };
  const workspace = createDemoWorkspace({
    seed,
    storage,
    normalize: (value) => ({ ...value, deals: value.deals.map(normalizeLead) }),
  });
  const ui = { ...primitives, openModal() {}, closeModal() {}, toast() {} },
    navigation = {
      getPage: () => "home",
      moduleName: (k) => k,
      pages: [],
      go() {},
    };
  const core = { ui, render() {} };
  const finance = createFinanceModule({
      ...core,
      repository: workspace.repository(["transactions"]),
    }),
    tasks = createTasksModule({
      ...core,
      navigation,
      repository: workspace.repository(["tasks"]),
    }),
    network = createNetworkModule({
      ...core,
      repository: workspace.repository(["network"]),
      taskModal: tasks.open,
    }),
    demoRepo = workspace.repository(["deals"]),
    demoLeads = {
      items: () => demoRepo.state.deals,
      active: () =>
        demoRepo.state.deals.filter((x) => !["won", "lost"].includes(x.status)),
      paid: () => demoRepo.state.deals.filter((x) => x.paid),
    },
    brand = createBrandModule({
      ...core,
      repository: workspace.repository(["content"]),
      navigation,
      demoLeads,
      leadLabel,
    }),
    goals = createGoalsModule({
      ...core,
      repository: workspace.repository(["goals"]),
      received: finance.selectors.received,
      taskModal: tasks.open,
    }),
    fitness = createFitnessModule({
      ...core,
      repository: workspace.repository(["workouts"]),
    }),
    dashboard = createDashboardModule({
      ...core,
      repository: {
        state: {
          tasks: tasks.selectors.items(),
          goals: goals.selectors.items(),
          content: brand.selectors.items(),
        },
      },
      ...finance.selectors,
      ...network.selectors,
      ...tasks.selectors,
      ...fitness.selectors,
      demoLeads,
    });
  return {
    workspace,
    modules: [finance, tasks, network, brand, goals, fitness, dashboard],
  };
};
test("all existing feature renders survive the module split with original demo calculations", () => {
  const { modules } = setup();
  for (const module of modules) {
    const html = module.render();
    assert.ok(html.length > 100, module.id);
    assert.ok(!/NaN|undefined/.test(html), module.id);
  }
  assert.equal(modules[0].selectors.received(), 428000);
  assert.equal(modules[0].selectors.expenses("2026-11"), 135500);
});
test("old browser records persist and module projections survive demo reset", () => {
  const original = structuredClone(seed);
  original.tasks[0].title = "Existing user edit";
  const storage = {
    getItem: (key) =>
      key === DEMO_STORAGE_KEY ? JSON.stringify(original) : null,
    setItem() {},
  };
  const workspace = createDemoWorkspace({ seed, storage });
  const tasks = workspace.repository(["tasks"]);
  assert.equal(tasks.state.tasks[0].title, "Existing user edit");
  assert.equal(tasks.state.transactions, undefined);
  workspace.reset();
  assert.equal(tasks.state.tasks[0].title, seed.tasks[0].title);
  assert.equal(workspace.snapshot().deals.length, 9);
});
