import { TODAY } from "../../shared/demo-clock.js";

export function createTasksModule({ repository, ui, render, navigation }) {
  const data = repository.state;
  const save = () => repository.save();
  const {
    icon,
    esc,
    num,
    rub,
    short,
    date,
    uid,
    progress,
    pill,
    btn,
    head,
    kpi,
    lineChart,
    field,
    selectField,
    textField,
    form,
    openModal,
    closeModal,
    toast,
  } = ui;
  const { pages, moduleName, getPage } = navigation;
  const view = { taskFilter: "today" };
  const overdueTasks = () => data.tasks.filter((t) => !t.done && t.due < TODAY);

  function taskRow(t, edit = false) {
    return `<div class="task-row ${t.done ? "done" : ""}"><button class="check" data-action="toggle-task" data-id="${t.id}" aria-label="${t.done ? "Вернуть задачу" : "Выполнить задачу"}: ${esc(t.title)}" aria-pressed="${t.done}">${t.done ? icon("check", 12) : ""}</button><div class="task-body"><span class="task-name">${esc(t.title)}</span><div class="task-meta"><span>${esc(moduleName(t.module))}</span><span>·</span><span class="${t.due < TODAY && !t.done ? "down" : ""}">${t.due === TODAY ? "Сегодня" : date(t.due)}</span>${edit ? `<span>· ${esc(t.owner)}</span>` : ""}</div></div>${edit ? `<button class="icon-button" data-action="edit-task" data-id="${t.id}" aria-label="Изменить задачу: ${esc(t.title)}">${icon("chevron", 12)}</button>` : pill(t.priority === "Высокий" ? "Приоритет" : "В работе", t.priority === "Высокий" ? "orange" : "gray")}</div>`;
  }

  function tasks() {
    const filtered = data.tasks
      .filter(
        (t) =>
          view.taskFilter === "all" ||
          (view.taskFilter === "done"
            ? t.done
            : view.taskFilter === "week"
              ? t.due >= "2026-11-09" && t.due <= "2026-11-15" && !t.done
              : t.due <= TODAY && !t.done),
      )
      .sort((a, b) => a.due.localeCompare(b.due));
    return (
      head(
        "Задачи",
        "Главное — знать следующий шаг и доводить его до конца.",
        btn("Новая задача", "add-task", "plus", "primary"),
        "Фокус и исполнение",
      ) +
      `<div class="tabs">${[
        ["today", "Сегодня и просрочено"],
        ["week", "На неделю"],
        ["all", "Все задачи"],
        ["done", "Выполнено"],
      ]
        .map(
          ([id, title]) =>
            `<button class="tab ${view.taskFilter === id ? "active" : ""}" data-action="task-filter" data-filter="${id}">${title}</button>`,
        )
        .join(
          "",
        )}</div><div class="two-col"><section class="card"><div class="card-title"><h2>${view.taskFilter === "done" ? "Завершённые задачи" : "План действий"}</h2><span class="label">${filtered.length} задач</span></div>${filtered.map((t) => taskRow(t, true)).join("") || '<div class="empty">Здесь пока нет задач.</div>'}</section><section class="card" style="align-self:start"><div class="card-title"><h2>Ритм недели</h2>${icon("target", 18)}</div><div class="value">${data.tasks.filter((t) => t.done).length} <small>/ ${data.tasks.length}</small></div><p class="metric-caption">задач выполнено в демонстрационном плане</p>${progress(data.tasks.filter((t) => t.done).length, data.tasks.length || 1)}<div class="separated"><p class="label">Просрочено</p><div class="value" style="font-size:25px;margin-top:6px">${data.tasks.filter((t) => !t.done && t.due < TODAY).length}</div><p class="sim-note">Сроки сравниваются с датой демосценария: 12 ноября 2026.</p></div></section></div>`
    );
  }

  function taskModal(id = "", defaults = {}) {
    const t = data.tasks.find((t) => t.id === id) || {
      title: "",
      module: getPage() === "home" ? "crm" : getPage(),
      due: TODAY,
      priority: "Обычный",
      owner: "Бекхан",
      ...defaults,
    };
    openModal(
      id ? "Изменить задачу" : "Новая задача",
      "Один конкретный следующий шаг.",
      form(
        "task",
        field(
          "Задача",
          "title",
          t.title,
          "text",
          true,
          'required maxlength="160"',
        ) +
          selectField(
            "Направление",
            "module",
            pages
              .filter((p) => !["home", "tasks"].includes(p[0]))
              .map((p) => [p[0], p[2]]),
            t.module,
          ) +
          field("Срок", "due", t.due, "date", false, "required") +
          selectField(
            "Приоритет",
            "priority",
            ["Обычный", "Высокий"],
            t.priority,
          ) +
          field(
            "Ответственный",
            "owner",
            t.owner,
            "text",
            false,
            'required maxlength="80"',
          ),
        id,
      ),
    );
  }
  return {
    id: "tasks",
    render: tasks,
    selectors: {
      overdueTasks,
      taskRow,
      items: () => structuredClone(data.tasks),
    },
    open: taskModal,
    actions: {
      "add-task": () => taskModal(),
      "edit-task": (b) => taskModal(b.dataset.id),
      "toggle-task": (b) => {
        const t = data.tasks.find((t) => t.id === b.dataset.id);
        if (!t) return;
        t.done = !t.done;
        const ok = save();
        render();
        if (ok)
          toast(t.done ? "Задача выполнена" : "Задача возвращена в работу");
      },
      "task-filter": (b) => {
        view.taskFilter = b.dataset.filter;
        render();
      },
    },
    forms: {
      task: ({ values: v, id }) => {
        const existing = data.tasks.find((t) => t.id === id),
          record = { ...v, id: id || uid(), done: existing?.done || false };
        if (existing) Object.assign(existing, record);
        else data.tasks.push(record);
        const ok = save();
        closeModal();
        render();
        if (ok) toast("Задача сохранена в браузере");
      },
    },
  };
}
