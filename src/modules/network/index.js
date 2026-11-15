import { TODAY } from "../../shared/demo-clock.js";

export function createNetworkModule({ repository, ui, render, taskModal }) {
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
  const view = { region: "Все регионы" };
  const sumNetwork = (key) => data.network.reduce((s, n) => s + n[key], 0);

  const problemPoints = () =>
    data.network.filter(
      (n) =>
        (n.profit / n.revenue) * 100 < n.marginNorm - 5 ||
        n.weekly.every((v, i, a) => i === 0 || v < a[i - 1]),
    );

  function network() {
    const rows = data.network.filter(
      (n) => view.region === "Все регионы" || n.region === view.region,
    );
    const rev = rows.reduce((s, n) => s + n.revenue, 0),
      plan = rows.reduce((s, n) => s + n.plan, 0),
      profit = rows.reduce((s, n) => s + n.profit, 0);
    return (
      head(
        "Бронь Сервис",
        "Показатели точек, ответственные и сигналы отклонений.",
        `<select class="inline-select" id="network-region" aria-label="Регион сети">${["Все регионы", "Грозный", "Ингушетия", "Гудермес"].map((r) => `<option ${view.region === r ? "selected" : ""}>${r}</option>`).join("")}</select>`,
        "Управление сетью",
      ) +
      `<div class="notice">${icon("info", 14)}Демонстрационный срез из 7 точек. Все суммы и ответственные вымышлены; это не отчёт по действующей сети.</div><div class="kpis">${kpi("Выручка", rub(rev), "выбранный регион", "store")}${kpi("Выполнение плана", `${Math.round((rev / plan) * 100)}<small> %</small>`, `${rub(plan)} — план`, "target")}${kpi("Чистая прибыль", rub(profit), "управленческий показатель", "wallet")}${kpi("Рентабельность", `${((profit / rev) * 100).toLocaleString("ru-RU", { maximumFractionDigits: 1 })}<small> %</small>`, "прибыль / выручка", "trend")}</div>
 <section class="card"><div class="card-title"><h2>Точки под управлением</h2><span class="label">Ноябрь 2026 · демонстрация</span></div><div class="table-wrap"><table><thead><tr><th>Точка / регион</th><th>Выручка</th><th>План</th><th>Чистая прибыль</th><th>Рентабельность</th><th>Динамика</th><th>Статус</th><th></th></tr></thead><tbody>${rows.map((n) => `<tr><td><strong>${esc(n.name)}</strong><small>${n.region} · ${n.manager}</small></td><td>${rub(n.revenue)}</td><td>${Math.round((n.revenue / n.plan) * 100)}%${progress(n.revenue, n.plan)}</td><td>${rub(n.profit)}</td><td>${((n.profit / n.revenue) * 100).toLocaleString("ru-RU", { maximumFractionDigits: 1 })}%</td><td class="${n.trend >= 0 ? "up" : "down"}">${n.trend > 0 ? "+" : ""}${n.trend}%</td><td>${problemPoints().includes(n) ? pill("Проверить", "orange") : pill("В норме")}</td><td><button class="icon-button" data-action="point" data-id="${n.id}" aria-label="Открыть точку ${esc(n.name)}">${icon("arrow", 14)}</button></td></tr>`).join("")}</tbody></table></div></section>
 <div class="two-col section-gap"><section class="card"><div class="card-title"><h2>Требуют внимания</h2>${pill("Проверка по правилам", "orange")}</div>${
   rows
     .filter((n) => problemPoints().includes(n))
     .map(
       (n) =>
         `<div class="alert-row"><div class="alert-icon">${icon("flag", 16)}</div><div><h3>${esc(n.name)}</h3><p>${esc(n.issue || "Выявлено отклонение показателей")}</p>${btn("Разобрать показатели", "point", "", "small", `data-id="${n.id}"`)}</div></div>`,
     )
     .join("") ||
   '<div class="empty">В выбранном регионе отклонений по заданным правилам нет.</div>'
 }<p class="sim-note">Сигнал: рентабельность более чем на 5 п. п. ниже ориентира 24% или 3 последовательных снижения недельной выручки.</p></section><section class="card"><div class="card-title"><h2>Выручка по регионам</h2><span class="label">Текущий срез</span></div>${[
   "Грозный",
   "Ингушетия",
   "Гудермес",
 ]
   .filter((r) => view.region === "Все регионы" || r === view.region)
   .map((r) => {
     const v = data.network
       .filter((n) => n.region === r)
       .reduce((s, n) => s + n.revenue, 0);
     return `<div class="bar-row"><span>${r}</span><div class="bar-track"><span style="width:${(v / 1696000) * 100}%"></span></div><span>${(v / 1000000).toLocaleString("ru-RU", { maximumFractionDigits: 2 })}м</span></div>`;
   })
   .join(
     "",
   )}<p class="sim-note">Динамика в таблице — отдельное демонстрационное сравнение с прошлым сопоставимым периодом.</p></section></div>`
    );
  }

  function pointModal(id) {
    const n = data.network.find((n) => n.id === id);
    if (!n) return;
    openModal(
      n.name,
      `${n.region} · ${n.manager}`,
      `<div class="detail-meta">${pill(`План ${Math.round((n.revenue / n.plan) * 100)}%`)}${pill(`Рентабельность ${((n.profit / n.revenue) * 100).toFixed(1)}%`, problemPoints().includes(n) ? "orange" : "")}</div><div class="balance-row"><span>Выручка / план</span><b>${rub(n.revenue)} / ${rub(n.plan)}</b></div><div class="balance-row"><span>Чистая прибыль</span><b>${rub(n.profit)}</b></div><h3 class="section-gap">Недельная выручка · тыс. ₽</h3>${lineChart(n.weekly, ["Неделя 1", "Неделя 2", "Неделя 3", "Неделя 4"])}<div class="answer"><strong>${problemPoints().includes(n) ? "Повод для проверки" : "Отклонений по заданным правилам нет"}</strong>${esc(n.issue || "Продолжайте отслеживать выручку и прибыль.")}</div><div class="form-actions">${btn("Создать задачу по точке", "point-task", "plus", "primary", `data-id="${n.id}"`)}</div>`,
    );
  }
  return {
    id: "network",
    render: network,
    selectors: {
      sumNetwork,
      problemPoints,
      items: () => structuredClone(data.network),
    },
    actions: {
      point: (b) => pointModal(b.dataset.id),
      "point-task": (b) => {
        const n = data.network.find((n) => n.id === b.dataset.id);
        if (n)
          taskModal("", {
            title: `Разобрать показатели: ${n.name}`,
            module: "network",
            owner: n.manager,
            priority: "Высокий",
          });
      },
    },
    bind() {
      document
        .getElementById("network-region")
        ?.addEventListener("change", (e) => {
          view.region = e.target.value;
          render();
        });
    },
  };
}
