import { TODAY } from "../../shared/demo-clock.js";

export function createGoalsModule({
  repository,
  ui,
  render,
  received,
  taskModal,
}) {
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

  function goalSaved(g) {
    return g.id === "g3" ? received() : g.saved;
  }

  function goals() {
    return (
      head(
        "Цели и проекты",
        "Большие планы становятся понятными через следующий шаг.",
        btn("Новая цель", "add-goal", "plus", "primary"),
        "Личная стратегия",
      ) +
      `<div class="three-col">${data.goals
        .map((g) => {
          const saved = goalSaved(g);
          return `<article class="card goal-card"><div class="goal-illustration">${icon(g.type, 70)}</div><div class="eyebrow">${g.id === "g3" ? "Целевой доход" : g.type === "house" ? "Личный проект" : "Финансовая цель"}</div><h2>${esc(g.title)}</h2><p>Ориентир: ${date(g.deadline)} ${g.deadline.slice(0, 4)}</p><div class="value">${rub(saved)} <small>/ ${short(g.target)}</small></div>${progress(saved, g.target)}<div class="goal-stats"><span>${Math.round((saved / g.target) * 100)}% цели</span><span>${g.id === "g3" ? "Получено за ноябрь" : `Осталось ${rub(Math.max(0, g.target - saved))}`}</span></div>${btn("Открыть цель", "goal", "arrow", "", `data-id="${g.id}"`)}</article>`;
        })
        .join(
          "",
        )}</div><section class="card section-gap"><div class="card-title"><h2>Проекты на стадии исследования</h2>${pill("Без обязательств", "gray")}</div><div class="source-row"><div class="source-icon">${icon("spark", 17)}</div><div class="source-text"><b>Собственный бизнес</b><small>Собрать гипотезы, проверить спрос и только потом выделить бюджет.</small></div>${btn("Добавить задачу", "research-task", "plus", "small")}</div><p class="sim-note">Накопления и выделенный бюджет целей ведутся независимо от операций. Автоматического списания денег в этом прототипе нет.</p></section>`
    );
  }

  function goalModal(id = "") {
    const g = data.goals.find((g) => g.id === id) || {
      title: "",
      type: "target",
      target: 1000000,
      saved: 0,
      deadline: "2027-06-01",
      note: "",
      steps: [],
    };
    openModal(
      id ? g.title : "Новая цель",
      "Цель, бюджет и конкретные этапы.",
      form(
        "goal",
        field(
          "Название",
          "title",
          g.title,
          "text",
          true,
          'required maxlength="100"',
        ) +
          field(
            "Цель, ₽",
            "target",
            g.target,
            "number",
            false,
            `required min="1" max="1000000000" ${g.id === "g3" ? "readonly" : ""}`,
          ) +
          (g.id === "g3"
            ? `<div class="field">Получено за ноябрь<input value="${rub(received())}" disabled><small>Из раздела «Финансы»</small></div>`
            : field(
                "Накоплено / выделено, ₽",
                "saved",
                g.saved,
                "number",
                false,
                'required min="0" max="1000000000"',
              )) +
          field(
            "Ориентир по сроку",
            "deadline",
            g.deadline,
            "date",
            true,
            "required",
          ) +
          textField("Допущения и комментарий", "note", g.note),
        id,
      ) +
        (g.id === "g3"
          ? `<div class="notice section-gap">${icon("info", 14)}Цель достигнута в 0 месяцах подряд. Получено за октябрь 540 000 ₽, за ноябрь ${rub(received())}. Ноябрь не завершён.</div>`
          : "") +
        (id
          ? `<div class="separated"><h3>Этапы проекта</h3>${g.steps.map((s, i) => `<div class="project-step"><button class="check" aria-pressed="${s.done}" aria-label="Этап: ${esc(s.name)}" data-action="goal-step" data-id="${g.id}" data-step="${i}">${s.done ? icon("check", 12) : ""}</button>${esc(s.name)}</div>`).join("")}${btn("Добавить этап", "add-step", "plus", "small", `data-id="${g.id}"`)}</div>`
          : ""),
    );
  }
  return {
    id: "goals",
    render: goals,
    selectors: { items: () => structuredClone(data.goals) },
    actions: {
      goal: (b) => goalModal(b.dataset.id),
      "add-goal": () => goalModal(),
      "goal-step": (b) => {
        const g = data.goals.find((g) => g.id === b.dataset.id);
        g.steps[Number(b.dataset.step)].done =
          !g.steps[Number(b.dataset.step)].done;
        save();
        goalModal(g.id);
      },
      "add-step": (b) =>
        openModal(
          "Новый этап",
          "Конкретный результат внутри цели.",
          form(
            "step",
            field(
              "Название этапа",
              "name",
              "",
              "text",
              true,
              'required maxlength="120"',
            ),
            b.dataset.id,
          ),
        ),
      "research-task": () =>
        taskModal("", {
          title: "Проверить гипотезу собственного бизнеса",
          module: "goals",
        }),
    },
    forms: {
      goal: ({ values: v, id }) => {
        const existing = data.goals.find((g) => g.id === id),
          record = {
            ...v,
            id: id || uid(),
            type: existing?.type || "target",
            target: Number(v.target),
            saved: Number(v.saved || 0),
            steps: existing?.steps || [],
          };
        if (existing) Object.assign(existing, record);
        else data.goals.push(record);
        const ok = save();
        closeModal();
        render();
        if (ok) toast("Цель сохранена");
      },
      step: ({ values: v, id }) => {
        data.goals
          .find((g) => g.id === id)
          .steps.push({ name: v.name, done: false });
        save();
        goalModal(id);
      },
    },
  };
}
