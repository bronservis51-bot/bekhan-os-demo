import {
  COLUMNS,
  leadColumn,
  leadLabel,
  leadInput,
  groupLeads,
  changeDemoColumn,
} from "./model.js";
import { createLeadFeed } from "./feed.js";
import { createLeadView } from "./view.js";
import { normalizeLead } from "./demo-model.js";
export function createCrmModule({
  repository,
  demoRepository,
  auth,
  ui,
  navigation,
  render,
}) {
  const view = { query: "", onlyNew: false, trash: false };
  const templates = createLeadView(ui);
  let demo = false,
    busy = false,
    opened = null,
    operation = null,
    attempt = null,
    dragged = null,
    lastUser = null,
    loginEmail = "";
  const current = () => navigation.getPage().split("/")[0] === "crm";
  const allowed = () => auth.getState().status === "signed-in";
  const localItems = () => demoRepository.state.deals;
  const items = () =>
    demo ? localItems().filter((x) => !x.deleted_at) : feed.getState().items;
  const trashItems = () =>
    demo
      ? localItems().filter((x) => x.deleted_at)
      : feed.getState().trashItems;
  const find = (id) => [...items(), ...trashItems()].find((x) => x.id === id);
  const jump = (id) => {
    const board = document.getElementById("lead-board"),
      col = document.getElementById(`lead-column-${id}`);
    if (board && col)
      board.scrollTo({ left: col.offsetLeft, behavior: "instant" });
  };
  const updateStatus = () => {
    const node = document.getElementById("crm-sync-status");
    if (node) node.innerHTML = templates.status(feed.getState(), demo);
  };
  function updateBoard(force = false) {
    if (!current()) return;
    updateStatus();
    const board = document.getElementById("lead-board");
    if (!board || view.trash) {
      render();
      return;
    }
    if (!force && document.activeElement?.matches("[data-lead-move]")) return;
    const left = board.scrollLeft;
    board.innerHTML = templates.board(items(), view, busy);
    board.scrollLeft = left;
    const empty = document.getElementById("lead-filter-empty");
    if (empty)
      empty.hidden = [...groupLeads(items(), view).values()].some(
        (x) => x.length,
      );
    const select = document.getElementById("lead-jump");
    if (select) select.innerHTML = templates.jumpOptions(items(), view);
  }
  const feed = createLeadFeed({
    repository,
    onChange: () => {
      if (current() && !demo) updateBoard();
    },
    onAccessLost: (error) => {
      auth.invalidate(error.message);
      ui.toast(error.message);
    },
  });
  async function refresh() {
    if (demo) {
      updateBoard(true);
      ui.toast("Демонстрационные записи из этого браузера");
      return;
    }
    if (allowed()) await feed.refresh({ trash: view.trash });
  }
  function page() {
    const next = navigation.getPage() === "crm/demo";
    if (next !== demo) {
      demo = next;
      view.trash = false;
      view.query = "";
      view.onlyNew = false;
    }
    return templates.page({
      items: items(),
      trashItems: trashItems(),
      view,
      feed: demo ? { status: "ready", lastSuccess: null } : feed.getState(),
      auth: auth.getState(),
      demo,
      busy,
    });
  }
  function editor(id = "", column = "000") {
    if (!current()) {
      navigation.go("crm", () => editor(id, column));
      return;
    }
    if (!demo && !allowed()) {
      ui.toast("Сначала войдите в рабочую CRM");
      return;
    }
    if (busy) {
      ui.toast("Дождитесь результата отправки");
      return;
    }
    const lead = id ? items().find((x) => x.id === id) : null;
    if (id && !lead) {
      ui.toast("Заявка недоступна. Обновите список или проверьте корзину.");
      return;
    }
    opened = lead ? structuredClone(lead) : null;
    operation = crypto.randomUUID();
    attempt = null;
    ui.openModal(
      lead ? "Заявка" : "Новая заявка",
      "",
      templates.editor(opened, { column, demo }),
    );
    document.querySelector('#modal [name="lead_contact"]')?.focus();
  }
  function showError(error) {
    const message = error.message || "Не удалось подтвердить изменение";
    const node = document.getElementById("lead-form-error");
    if (node) node.textContent = message;
    else ui.toast(message);
    if (["unauthenticated", "forbidden"].includes(error.code))
      auth.invalidate(message);
  }
  async function write(command, onSuccess) {
    if (busy) return;
    const asDemo = demo,
      generation = feed.generation();
    if (!asDemo && !allowed()) return;
    busy = true;
    ui.setBusy(true);
    if (current()) updateBoard(true);
    try {
      const record = await command();
      if (!asDemo && (generation !== feed.generation() || !allowed())) return;
      if (asDemo) {
        const i = localItems().findIndex((x) => x.id === record.id);
        if (i >= 0) Object.assign(localItems()[i], record);
        else localItems().unshift(record);
        if (!demoRepository.save())
          ui.toast("Изменение примера осталось только в памяти");
      } else feed.apply(record);
      onSuccess?.(record);
    } catch (error) {
      if (asDemo || generation === feed.generation()) showError(error);
    } finally {
      busy = false;
      ui.setBusy(false);
      if (current()) updateBoard(true);
    }
  }
  async function saveForm({ form, values }) {
    let input;
    try {
      input = leadInput(values, form.dataset.id || null);
    } catch (error) {
      showError(error);
      return;
    }
    if (
      !opened &&
      attempt &&
      JSON.stringify(input) !== JSON.stringify(attempt)
    ) {
      showError(
        new Error(
          "Предыдущая отправка не подтверждена. Повторите её с теми же данными или сначала проверьте список.",
        ),
      );
      return;
    }
    if (!opened) attempt = structuredClone(input);
    const expected = opened?.updated_at ?? null;
    await write(
      async () =>
        demo
          ? changeDemoColumn(
              normalizeLead({
                ...opened,
                id: opened?.id || operation,
                ...input,
                paid: values.paid === "on",
                created_at: opened?.created_at || new Date().toISOString(),
                deleted_at: null,
              }),
              input.column,
            )
          : repository.save(input, {
              expected,
              operation: opened ? null : operation,
            }),
      (record) => {
        attempt = null;
        ui.closeModal();
        view.query = "";
        view.onlyNew = false;
        view.trash = false;
        render();
        requestAnimationFrame(() => jump(leadColumn(record)));
        ui.toast(
          demo ? "Заявка примера сохранена" : "Заявка сохранена в общей CRM",
        );
      },
    );
  }
  async function move(id, column) {
    const lead = items().find((x) => x.id === id);
    if (!lead) return;
    await write(
      () =>
        demo
          ? changeDemoColumn(structuredClone(lead), column)
          : repository.move(lead, column),
      (record) => {
        ui.toast(demo ? "Карточка примера перемещена" : "Колонка сохранена");
        requestAnimationFrame(() => jump(leadColumn(record)));
      },
    );
  }
  function deleteDialog(id) {
    const lead = opened?.id === id ? opened : find(id);
    if (!lead) return;
    opened = structuredClone(lead);
    ui.openModal(
      "Удалить заявку?",
      "",
      `<p><strong>${ui.esc(lead.name)}</strong></p><p class="sim-note">${demo ? "Карточка примера исчезнет из канбана." : "Заявка попадёт в общую корзину и исчезнет из активных заявок в обоих приложениях."} Её можно восстановить. Несохранённые изменения формы не применятся.</p><div class="form-actions">${ui.btn("Назад", "deal", "", "", `data-id="${ui.esc(id)}"`)}${ui.btn("Удалить", "lead-delete-confirm", "trash", "primary", `data-id="${ui.esc(id)}"`)}</div><p class="crm-error" id="lead-form-error" role="alert"></p>`,
    );
  }
  function restoreDialog(id) {
    const lead = find(id);
    if (!lead) return;
    opened = structuredClone(lead);
    ui.openModal(
      "Восстановить заявку?",
      "",
      `<p><strong>${ui.esc(lead.name)}</strong></p><p class="sim-note">Заявка вернётся в колонку «${ui.esc(leadLabel(lead))}»${demo ? "" : " в обоих приложениях"}.</p><div class="form-actions">${ui.btn("Отмена", "close")}${ui.btn("Восстановить", "lead-restore-confirm", "reset", "primary", `data-id="${ui.esc(id)}"`)}</div><p class="crm-error" id="lead-form-error" role="alert"></p>`,
    );
  }
  async function setDeleted(deleted) {
    if (!opened) return;
    const record = structuredClone(opened);
    await write(
      () =>
        demo
          ? Promise.resolve({
              ...record,
              deleted_at: deleted ? new Date().toISOString() : null,
              updated_at: new Date().toISOString(),
            })
          : repository.setDeleted(record, deleted),
      () => {
        ui.closeModal();
        render();
        ui.toast(
          deleted ? "Заявка перемещена в корзину" : "Заявка восстановлена",
        );
      },
    );
  }
  auth.subscribe((state) => {
    if (state.status === "signed-in") {
      if (lastUser !== state.profile.id) {
        lastUser = state.profile.id;
        feed.reset();
        void feed.refresh();
      }
      if (current() && !demo) render();
    } else if (state.status === "signed-out") {
      lastUser = null;
      opened = null;
      operation = null;
      attempt = null;
      feed.reset();
      if (document.getElementById("modal").open) ui.closeModal();
      if (current() && !demo) render();
    } else if (current() && !demo) {
      const submit = document.querySelector(
        '[data-form="crm-login"] button[type="submit"]',
      );
      if (submit) {
        submit.disabled = true;
        submit.textContent = "Проверяем вход…";
      } else render();
    }
  });
  const poll = setInterval(() => {
    if (
      current() &&
      !demo &&
      allowed() &&
      document.visibilityState === "visible" &&
      !busy
    )
      void refresh();
  }, 30000);
  const onVisible = () => {
    if (
      document.visibilityState === "visible" &&
      current() &&
      !demo &&
      allowed() &&
      !busy
    )
      void refresh();
  };
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("online", onVisible);
  return {
    id: "crm",
    render: page,
    selectors: {
      searchEntries: () =>
        current() && demo
          ? localItems().filter((x) => !x.deleted_at)
          : allowed()
            ? feed.getState().items
            : [],
      isWorking: () => !demo && allowed(),
      profile: () => auth.getState().profile,
    },
    open: editor,
    openDemo(id) {
      navigation.go("crm/demo", () => editor(id));
    },
    actions: {
      "add-deal": (b) => editor("", b.dataset.column || "000"),
      deal: (b) => editor(b.dataset.id),
      "lead-trash": () => {
        if (busy) return;
        view.trash = !view.trash;
        render();
        void refresh();
      },
      "lead-refresh": refresh,
      "lead-delete": (b) => deleteDialog(b.dataset.id),
      "lead-delete-confirm": () => setDeleted(true),
      "lead-restore": (b) => restoreDialog(b.dataset.id),
      "lead-restore-confirm": () => setDeleted(false),
      "crm-logout": async () => {
        if (!ui.canLeave()) return;
        try {
          await auth.signOut();
        } catch {
          ui.toast("Выход выполнен на этом устройстве");
        }
      },
    },
    forms: {
      lead: saveForm,
      "crm-login": async ({ form, values: v }) => {
        loginEmail = v.email;
        try {
          await auth.signIn(v.email, v.password, v.remember === "on");
        } catch (error) {
          const node = document.getElementById("crm-login-error");
          if (node) node.textContent = error.message;
          const email = document.querySelector(
            '[data-form="crm-login"] [name="email"]',
          );
          if (email) email.value = loginEmail;
        } finally {
          const password = form.querySelector('[name="password"]');
          if (password) password.value = "";
        }
      },
    },
    bind() {
      document.getElementById("deal-search")?.addEventListener("input", (e) => {
        view.query = e.target.value;
        updateBoard(true);
      });
      document
        .getElementById("lead-only-new")
        ?.addEventListener("change", (e) => {
          view.onlyNew = e.target.checked;
          updateBoard(true);
        });
      document.getElementById("lead-jump")?.addEventListener("change", (e) => {
        jump(e.target.value);
        e.target.value = "";
      });
      if (
        !demo &&
        allowed() &&
        feed.getState().status === "idle" &&
        !feed.getState().refreshing
      )
        queueMicrotask(() => void refresh());
    },
    change(event) {
      if (event.target.dataset.leadMove)
        void move(event.target.dataset.leadMove, event.target.value);
    },
    drag(event) {
      if (!current() || busy || (!demo && !allowed())) return;
      const tile = event.target.closest(".lead-tile"),
        column = event.target.closest("[data-lead-column]");
      if (event.type === "dragstart" && tile) {
        dragged = tile.dataset.id;
        event.dataTransfer.setData("text/plain", dragged);
        event.dataTransfer.effectAllowed = "move";
        tile.classList.add("dragging");
      }
      if (event.type === "dragover" && column && dragged) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        document
          .querySelectorAll(".pipeline-column.drag-over")
          .forEach((x) => x.classList.remove("drag-over"));
        column.classList.add("drag-over");
      }
      if (
        event.type === "dragleave" &&
        column &&
        !column.contains(event.relatedTarget)
      )
        column.classList.remove("drag-over");
      if (event.type === "drop" && column && dragged) {
        event.preventDefault();
        const id = dragged;
        dragged = null;
        void move(id, column.dataset.leadColumn);
      }
      if (event.type === "dragend") {
        dragged = null;
        document
          .querySelectorAll(".drag-over,.dragging")
          .forEach((x) => x.classList.remove("drag-over", "dragging"));
      }
    },
    destroy() {
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onVisible);
    },
  };
}
