import { TODAY } from "../../shared/demo-clock.js";

export function createFitnessModule({ repository, ui, render }) {
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
  const view = { program: "А" };
  function weekWorkouts() {
    return new Set(
      data.workouts
        .filter((w) => w.date >= "2026-11-09" && w.date <= "2026-11-15")
        .map((w) => w.date),
    ).size;
  }

  const programs = {
    А: [
      {
        name: "Жим лёжа",
        scheme: "3 подхода × 10 повторений",
        weight: "60 кг",
        note: "Пример нагрузки",
      },
      {
        name: "Горизонтальная тяга",
        scheme: "3 подхода × 12 повторений",
        weight: "45 кг",
        note: "Пример нагрузки",
      },
      {
        name: "Жим ногами",
        scheme: "3 подхода × 12 повторений",
        weight: "100 кг",
        note: "Пример нагрузки",
      },
      {
        name: "Подъёмы гантелей в стороны",
        scheme: "3 подхода × 15 повторений",
        weight: "8 кг",
        note: "Пример нагрузки",
      },
    ],
    Б: [
      {
        name: "Тяга верхнего блока",
        scheme: "3 подхода × 12 повторений",
        weight: "52,5 кг",
        note: "Пример нагрузки",
      },
      {
        name: "Румынская тяга",
        scheme: "3 подхода × 10 повторений",
        weight: "50 кг",
        note: "Пример нагрузки",
      },
      {
        name: "Жим гантелей сидя",
        scheme: "3 подхода × 12 повторений",
        weight: "16 кг",
        note: "Пример нагрузки",
      },
      {
        name: "Сгибания рук с гантелями",
        scheme: "3 подхода × 12 повторений",
        weight: "10 кг",
        note: "Пример нагрузки",
      },
    ],
  };

  function fitness() {
    const history = [...data.workouts].sort((a, b) =>
        b.date.localeCompare(a.date),
      ),
      body = history[0]?.body;
    const bench = data.workouts
      .filter((w) => w.exercise === "Жим лёжа")
      .sort((a, b) => a.date.localeCompare(b.date));
    return (
      head(
        "Тренировки",
        "Регулярность, рабочие веса и видимый прогресс.",
        btn("Записать подходы", "add-workout", "plus", "primary"),
        "Сила в последовательности",
      ) +
      `<div class="kpis">${kpi("На этой неделе", `${weekWorkouts()} <small>/ 3</small>`, "уникальные дни тренировок", "calendar")}${kpi("Вес тела", `${body ? body.toLocaleString("ru-RU") : "—"} <small>кг</small>`, "последняя запись в дневнике", "gym")}${kpi("Жим лёжа", `${bench.at(-1)?.weight || 0} <small>кг</small>`, "последняя запись упражнения", "trend")}${kpi("Записей упражнений", String(history.length), "в журнале ноября", "tasks")}</div><div class="week">${[
        "Пн",
        "Вт",
        "Ср",
        "Чт",
        "Пт",
        "Сб",
        "Вс",
      ]
        .map((d, i) => {
          let day = `2026-11-${9 + i < 10 ? "0" : ""}${9 + i}`;
          return `<div class="day ${day === TODAY ? "today" : ""}">${d}<strong>${9 + i}</strong>${data.workouts.some((w) => w.date === day) ? '<i class="dot"></i>' : '<span class="muted">·</span>'}</div>`;
        })
        .join("")}</div>
 <div class="two-col"><div class="stack"><section class="card"><div class="card-title"><h2>Программа тренировок</h2><div class="actions">${["А", "Б"].map((p) => btn(p, "program", "", "small " + (view.program === p ? "primary" : ""), `data-program="${p}"`)).join("")}</div></div><div class="workout-banner"><div><div class="eyebrow">Демонстрационная программа</div><h3>Тренировка ${view.program}</h3><p>Силовая · 4 упражнения</p></div>${icon("gym", 38)}</div>${programs[view.program].map((e, i) => `<div class="exercise"><span class="exercise-number">0${i + 1}</span><div class="exercise-main"><h3>${e.name}</h3><p>${e.scheme}</p></div><div class="exercise-weight">${e.weight}<small>${e.note}</small></div></div>`).join("")}<p class="sim-note">Программа и веса — содержимое примера, а не индивидуальная рекомендация.</p></section><section class="card"><div class="card-title"><h2>Журнал тренировок</h2><span class="label">Ноябрь</span></div><div class="table-wrap"><table><thead><tr><th>Дата</th><th>Упражнение</th><th>Подходы × повторы</th><th>Вес</th></tr></thead><tbody>${history.map((w) => `<tr><td>${date(w.date)}<small>Программа ${esc(w.program)}</small></td><td>${esc(w.exercise)}</td><td>${w.sets} × ${w.reps}</td><td>${w.weight.toLocaleString("ru-RU")} кг</td></tr>`).join("")}</tbody></table></div></section></div><section class="card" style="align-self:start"><div class="card-title"><h2>Рабочий вес</h2>${pill("Жим лёжа")}</div><div class="value">${bench.at(-1)?.weight || 0} <small>кг</small></div><p class="metric-caption">По записям дневника</p>${
   bench.length > 1
     ? lineChart(
         bench.map((w) => w.weight),
         bench.map((w) => date(w.date)),
         { height: 185, unit: "кг" },
       )
     : '<div class="empty">Для графика нужны две записи.</div>'
 }<p class="sim-note">Сравнивайте вес вместе с повторами и подходами — один вес не отражает весь прогресс.</p></section></div>`
    );
  }

  function workoutModal() {
    openModal(
      "Записать тренировку",
      "Запись одного упражнения. Тренировочные дни считаются без повторов.",
      form(
        "workout",
        field("Дата", "date", TODAY, "date", false, "required") +
          selectField("Программа", "program", ["А", "Б"], view.program) +
          selectField(
            "Упражнение",
            "exercise",
            [
              ...new Set(
                Object.values(programs)
                  .flat()
                  .map((e) => e.name),
              ),
            ],
            programs[view.program][0].name,
            true,
          ) +
          field(
            "Рабочий вес, кг",
            "weight",
            60,
            "number",
            false,
            'required min="0" max="1000" step="0.5"',
          ) +
          field(
            "Подходов",
            "sets",
            3,
            "number",
            false,
            'required min="1" max="30"',
          ) +
          field(
            "Повторений",
            "reps",
            10,
            "number",
            false,
            'required min="1" max="200"',
          ) +
          field(
            "Вес тела, кг",
            "body",
            80.2,
            "number",
            false,
            'required min="20" max="400" step="0.1"',
          ),
      ),
    );
  }
  return {
    id: "fitness",
    render: fitness,
    selectors: { weekWorkouts },
    actions: {
      program: (b) => {
        view.program = b.dataset.program;
        render();
      },
      "add-workout": () => workoutModal(),
    },
    forms: {
      workout: ({ values: v }) => {
        if (v.date > TODAY) {
          toast("Укажите дату не позже 12 ноября — это дата примера");
          return;
        }
        data.workouts.push({
          ...v,
          id: uid(),
          weight: Number(v.weight),
          reps: Number(v.reps),
          sets: Number(v.sets),
          body: Number(v.body),
        });
        const ok = save();
        closeModal();
        render();
        if (ok) toast("Тренировка сохранена");
      },
    },
  };
}
