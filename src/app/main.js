import "../shared/styles.css";
import "../modules/crm/styles.css";
import "../shared/auth.css";
import * as primitives from "../shared/ui.js";
import { createToast } from "../platform/toast.js";
import { createModal } from "../platform/modal.js";
import { createDemoWorkspace } from "../platform/demo-store.js";
import {
  createBackend,
  createAuthStorage,
} from "../integrations/bron-leads/client.js";
import { createAuthService } from "../integrations/bron-leads/auth.js";
import { createLeadRepository } from "../integrations/bron-leads/repository.js";
import { createCrmModule } from "../modules/crm/index.js";
import { normalizeLead } from "../modules/crm/demo-model.js";
import { leadLabel } from "../modules/crm/model.js";
import { createFinanceModule } from "../modules/finance/index.js";
import { createTasksModule } from "../modules/tasks/index.js";
import { createNetworkModule } from "../modules/network/index.js";
import { createBrandModule } from "../modules/brand/index.js";
import { createGoalsModule } from "../modules/goals/index.js";
import { createFitnessModule } from "../modules/fitness/index.js";
import { createDashboardModule } from "../modules/dashboard/index.js";
import { createSettingsModule } from "../modules/settings/index.js";
import { backendConfig } from "./config.js";
import { seed } from "./demo-seed.js";
import { pages, moduleName, getPage } from "./routes.js";
import { createShell } from "./shell.js";
import { createSearch } from "./search.js";
const toast = createToast(),
  modal = createModal({ ...primitives, toast }),
  ui = { ...primitives, ...modal, toast };
let browserStorage, sessionStorageRef;
try {
  browserStorage = localStorage;
} catch {}
try {
  sessionStorageRef = sessionStorage;
} catch {}
const workspace = createDemoWorkspace({
  seed,
  storage: browserStorage,
  normalize: (value) => ({ ...value, deals: value.deals.map(normalizeLead) }),
  onFailure: () =>
    toast(
      "Хранение примера недоступно. Изменения останутся только до закрытия страницы.",
    ),
});
const authStorage = createAuthStorage({
  sessionStorage: sessionStorageRef,
  localStorage: browserStorage,
});
const backend = createBackend(backendConfig, { storage: authStorage }),
  auth = createAuthService({ backend, storage: authStorage });
let afterNavigation = null;
const navigation = {
  pages,
  moduleName,
  getPage,
  go(page, after = null) {
    afterNavigation = after;
    if (getPage() === page) render();
    else location.hash = `/${page}`;
    document.querySelector(".sidebar")?.classList.remove("open");
  },
};
const repo = (keys) => workspace.repository(keys);
const demoRepo = repo(["deals"]),
  demoLeads = {
    items: () =>
      structuredClone(demoRepo.state.deals.filter((x) => !x.deleted_at)),
    active: () =>
      demoLeads.items().filter((x) => !["won", "lost"].includes(x.status)),
    paid: () => demoLeads.items().filter((x) => x.paid),
  };
const finance = createFinanceModule({
  repository: repo(["transactions"]),
  ui,
  render,
});
const tasks = createTasksModule({
  repository: repo(["tasks"]),
  ui,
  render,
  navigation,
});
const network = createNetworkModule({
  repository: repo(["network"]),
  ui,
  render,
  taskModal: tasks.open,
});
const brand = createBrandModule({
  repository: repo(["content"]),
  ui,
  render,
  demoLeads,
  navigation,
  leadLabel,
});
const goals = createGoalsModule({
  repository: repo(["goals"]),
  ui,
  render,
  received: finance.selectors.received,
  taskModal: tasks.open,
});
const fitness = createFitnessModule({
  repository: repo(["workouts"]),
  ui,
  render,
});
const crm = createCrmModule({
  repository: createLeadRepository(backend),
  demoRepository: demoRepo,
  auth,
  ui,
  navigation,
  render,
});
const dashboardRepository = {
  state: {
    get tasks() {
      return tasks.selectors.items();
    },
    get content() {
      return brand.selectors.items();
    },
    get goals() {
      return goals.selectors.items();
    },
  },
  save() {
    throw new Error("Dashboard is read-only");
  },
};
const dashboard = createDashboardModule({
  repository: dashboardRepository,
  ui,
  render,
  ...finance.selectors,
  ...network.selectors,
  ...tasks.selectors,
  ...fitness.selectors,
  demoLeads,
});
const settings = createSettingsModule({
  ui,
  workspace,
  connection: { ...crm.selectors, render },
});
const modules = [
    dashboard,
    finance,
    crm,
    network,
    brand,
    goals,
    fitness,
    tasks,
    settings,
  ],
  registry = new Map(modules.map((x) => [x.id, x]));
const actions = new Map(),
  forms = new Map();
for (const module of modules) {
  for (const [key, handler] of Object.entries(module.actions || {})) {
    if (actions.has(key)) throw new Error(`Duplicate action: ${key}`);
    actions.set(key, handler);
  }
  for (const [key, handler] of Object.entries(module.forms || {})) {
    if (forms.has(key)) throw new Error(`Duplicate form: ${key}`);
    forms.set(key, handler);
  }
}
const shell = createShell({
  ui,
  navigation,
  crm: crm.selectors,
  taskCount: () => tasks.selectors.items().filter((x) => !x.done).length,
});
const search = createSearch({
  ui,
  navigation,
  entries: () => [
    ...tasks.selectors
      .items()
      .map((x) => ({
        title: x.title,
        sub: `Задача · ${x.owner}`,
        action: "edit-task",
        id: x.id,
        ico: "tasks",
      })),
    ...crm.selectors
      .searchEntries()
      .map((x) => ({
        title: `${x.name} · ${x.city || ""}`,
        sub: `Заявка · ${leadLabel(x)}`,
        action: "deal",
        id: x.id,
        ico: "handshake",
      })),
    ...goals.selectors
      .items()
      .map((x) => ({
        title: x.title,
        sub: "Цель · пример",
        action: "goal",
        id: x.id,
        ico: x.type,
      })),
    ...network.selectors
      .items()
      .map((x) => ({
        title: `${x.name} · ${x.region}`,
        sub: "Точка · пример",
        action: "point",
        id: x.id,
        ico: "store",
      })),
    ...brand.selectors
      .items()
      .map((x) => ({
        title: x.title,
        sub: "Контент · пример",
        action: "content",
        id: x.id,
        ico: "brand",
      })),
  ],
});
function render() {
  const page = getPage().split("/")[0],
    module = registry.get(page);
  if (!module) {
    location.hash = "/home";
    return;
  }
  document.title = `${moduleName(page) === "Центр управления" && page === "settings" ? "Настройки" : moduleName(page)} — BEKHAN OS`;
  const content = module.render();
  document.getElementById("app").innerHTML = shell.shell(page);
  document.getElementById("content").innerHTML = content + shell.foot();
  module.bind?.();
  const after = afterNavigation;
  afterNavigation = null;
  after?.();
}
const dispatch = async (handler, ...args) => {
  try {
    await handler(...args);
  } catch (error) {
    toast(error?.message || "Действие не выполнено");
  }
};
document.addEventListener("click", (event) => {
  if (event.target.closest(".skip")) {
    event.preventDefault();
    document.getElementById("content")?.focus();
    return;
  }
  if (event.target.closest('a[href^="#/"]')) {
    if (!modal.canLeave()) {
      event.preventDefault();
      return;
    }
    modal.closeModal();
  }
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action,
    id = button.dataset.id;
  if (
    document.getElementById("modal").open &&
    ![
      "close",
      "menu",
      "lead-delete",
      "lead-delete-confirm",
      "lead-restore-confirm",
    ].includes(action) &&
    !modal.canLeave()
  )
    return;
  if (action === "menu") {
    const sidebar = document.querySelector(".sidebar");
    sidebar.classList.toggle("open");
    document
      .querySelector(".mobile-menu")
      ?.setAttribute(
        "aria-expanded",
        String(sidebar.classList.contains("open")),
      );
    return;
  }
  if (action === "close") {
    modal.attemptCloseModal();
    return;
  }
  if (action === "navigate") {
    modal.closeModal();
    navigation.go(id);
    return;
  }
  if (action === "settings") {
    modal.closeModal();
    navigation.go("settings");
    return;
  }
  if (action === "search") {
    search.open();
    return;
  }
  if (action === "demo-deal") {
    modal.closeModal();
    crm.openDemo(id);
    return;
  }
  const handler = actions.get(action);
  if (handler) void dispatch(handler, button, event);
});
document.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-form]");
  if (!form) return;
  event.preventDefault();
  if (modal.isBusy()) return;
  const values = Object.fromEntries(new FormData(form));
  if (
    Object.values(values).some((x) => typeof x === "string" && x.length > 2500)
  ) {
    toast("Слишком длинная запись");
    return;
  }
  const handler = forms.get(form.dataset.form);
  if (handler) void dispatch(handler, { form, values, id: form.dataset.id });
});
document.addEventListener("change", (event) => crm.change(event));
for (const type of ["dragstart", "dragover", "dragleave", "drop", "dragend"])
  document.addEventListener(type, (event) => crm.drag(event));
document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    if (modal.canLeave()) search.open();
  }
  if (event.key === "Escape") {
    document.querySelector(".sidebar")?.classList.remove("open");
    document
      .querySelector(".mobile-menu")
      ?.setAttribute("aria-expanded", "false");
  }
});
window.addEventListener("hashchange", (event) => {
  if (!modal.canLeave()) {
    history.replaceState(null, "", new URL(event.oldURL).hash);
    return;
  }
  modal.closeModal();
  render();
  window.scrollTo({ top: 0, behavior: "instant" });
});
render();
void auth.start();
