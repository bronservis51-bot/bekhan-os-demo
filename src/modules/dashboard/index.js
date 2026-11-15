import { TODAY } from "../../shared/demo-clock.js";

export function createDashboardModule({
  repository,
  ui,
  render,
  received,
  expenses,
  forecast,
  incomeChart,
  sumNetwork,
  problemPoints,
  overdueTasks,
  taskRow,
  weekWorkouts,
  demoLeads,
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
  const activeLeads = () => demoLeads.active();
  const paidLeads = () => demoLeads.paid();
  const overdueDeals = () =>
    activeLeads().filter((d) => !d.due || d.due < TODAY);

  function attentionItems() {
    return [
      ...overdueDeals().map((d) => ({
        title: `${d.name} · ${d.city}`,
        detail: d.due
          ? `Следующий контакт просрочен: ${date(d.due)}.`
          : "Дата следующего контакта не назначена.",
        rule: "Активная сделка + пустая дата или дата раньше сегодня",
        action: "demo-deal",
        id: d.id,
      })),
      ...overdueTasks().map((t) => ({
        title: t.title,
        detail: `Срок ${date(t.due)} · ${t.owner}`,
        rule: "Задача не выполнена + срок раньше сегодня",
        action: "edit-task",
        id: t.id,
      })),
      ...problemPoints().map((n) => ({
        title: n.name,
        detail: `Рентабельность ${((n.profit / n.revenue) * 100).toLocaleString("ru-RU", { maximumFractionDigits: 1 })}%, выполнение плана ${Math.round((n.revenue / n.plan) * 100)}%.`,
        rule:
          (n.profit / n.revenue) * 100 < n.marginNorm - 5
            ? `Рентабельность ниже ${n.marginNorm - 5}%: ориентир ${n.marginNorm}% минус 5 п. п.`
            : "Три последовательных снижения недельной выручки",
        action: "point",
        id: n.id,
      })),
    ];
  }

  function reviewBrief() {
    return `Данные приложения BEKHAN OS. Демосценарий: 12 ноября 2026. Все суммы и записи — примеры.\n\nПолучено за ноябрь: ${rub(received())}. Цель: 1 000 000 ₽. Расходы ноября: ${rub(expenses("2026-11"))}.\nБазовый прогноз: ${rub(forecast())}, включая ожидаемые 252 000 ₽. Прогноз не является полученными деньгами.\n\nТочки: выручка ${rub(sumNetwork("revenue"))}, план ${rub(sumNetwork("plan"))}, чистая прибыль ${rub(sumNetwork("profit"))}.\n\nПроверки:\n${
      attentionItems()
        .map((i) => `- ${i.title}: ${i.detail} Правило: ${i.rule}.`)
        .join("\n") || "Отклонений по заданным правилам нет."
    }\n\nПроанализируй только приведённые данные. Отдели факты от гипотез. Не утверждай причины отклонений без доказательств. Укажи, каких данных не хватает для решения.`;
  }

  function home() {
    const income = received(),
      rev = sumNetwork("revenue"),
      plan = sumNetwork("plan"),
      sales = paidLeads().length;
    const taskList = data.tasks
      .filter((t) => t.due === TODAY && !t.done)
      .slice(0, 3);
    return (
      head(
        "Центр управления",
        "Всё важное — в одном месте. Сегодня, 12 ноября.",
        btn("Новая задача", "add-task", "plus", "primary"),
        "Четверг, 12 ноября 2026",
      ) +
      `<div class="kpis">${kpi("Доход в ноябре", rub(income), "из 1 000 000 ₽", "wallet", `${Math.round(income / 10000)}% цели`)}${kpi("Продажи франшиз", `${sales} <small>/ 3</small>`, "до цели месяца", "handshake", `Ещё ${Math.max(0, 3 - sales)}`, "gray")}${kpi("План сети", `${((rev / plan) * 100).toLocaleString("ru-RU", { maximumFractionDigits: 1 })}<small> %</small>`, `${short(rev)} из ${short(plan)} ₽`, "store", "На контроле", "orange")}${kpi("Контент-план", `${data.content.filter((c) => c.status === "Опубликован").length} <small>/ ${data.content.length}</small>`, "материалов опубликовано", "brand", "Ручной план", "gray")}</div>
 <div class="hero-grid"><section class="card income-card"><div class="card-title"><h2>Путь к миллиону</h2><span class="label">2026 год</span></div><div class="income-numbers"><div class="value">${rub(income)}</div>${pill("Получено в ноябре")}</div><div class="legend"><span><i></i>Полученный доход</span><span><i class="light"></i>План месяца</span></div><div class="chart-wrap">${incomeChart()}</div><div class="chart-note">Ноябрь не завершён · прогноз ${rub(forecast())} показан отдельно в финансах</div></section><section class="card focus-card"><div class="focus-tag">${icon("flag", 15)}Требуют внимания</div><h2>${attentionItems().length ? `${attentionItems().length} сигналов<br>для проверки` : "Просрочек<br>и отклонений нет"}</h2><p>Контакты без актуальной даты: ${overdueDeals().length}. Просроченные задачи: ${overdueTasks().length}. Точки с отклонениями: ${problemPoints().length}.</p><div class="focus-bottom">Автоматические проверки по датам и порогам</div>${btn("Проверить записи", "summary", "arrow", "lime")}</section></div>
 <div class="middle-grid"><section class="card"><div class="card-title"><h2>Три главных дела</h2><a class="link" href="#/tasks">Все задачи ${icon("arrow", 13)}</a></div>${taskList.length ? taskList.map((t) => taskRow(t)).join("") : `<div class="empty">Приоритеты дня закрыты. Добавьте задачу или посмотрите план на неделю.</div>`}</section><section class="card"><div class="card-title"><h2>Сегодня в фокусе</h2><span class="label">12 ноя</span></div><div class="timeline"><div class="event"><span class="event-time">10:00</span><div class="event-content"><h3>Сверка показателей сети</h3><p>Грозный · Ингушетия · Гудермес</p></div></div><div class="event"><span class="event-time">14:00</span><div class="event-content current"><h3>Созвон с покупателем франшизы</h3><p>Нальчик · финансовая модель</p></div></div><div class="event"><span class="event-time">19:00</span><div class="event-content"><h3>Время для себя</h3><p>Тренировка по программе А</p></div></div></div></section></div>
 <div class="bottom-grid"><a class="card mini-card" href="#/goals"><div class="mini-head"><h3>${icon("house", 16)}Ремонт</h3>${icon("arrow", 13)}</div><div class="mini-metric"><strong>${Math.round((data.goals[1].saved / data.goals[1].target) * 100)}%</strong><span>бюджета профинансировано</span></div>${progress(data.goals[1].saved, data.goals[1].target)}<p class="muted">Осталось выделить ${rub(Math.max(0, data.goals[1].target - data.goals[1].saved))}</p></a><a class="card mini-card" href="#/goals"><div class="mini-head"><h3>${icon("car", 17)}Mercedes-Benz GLE</h3>${icon("arrow", 13)}</div><div class="mini-metric"><strong>${(data.goals[0].saved / 1000000).toLocaleString("ru-RU")} млн</strong><span>из ${short(data.goals[0].target)} ₽</span></div>${progress(data.goals[0].saved, data.goals[0].target)}<p class="muted">Накопления на доплату · отдельная цель</p></a><a class="card mini-card" href="#/fitness"><div class="mini-head"><h3>${icon("gym", 17)}Тренировки</h3>${icon("arrow", 13)}</div><div class="mini-metric"><strong>${weekWorkouts()} <span>/ 3</span></strong><span>на этой неделе</span></div>${progress(weekWorkouts(), 3)}<p class="muted">Регулярность важнее идеального плана</p></a></div>`
    );
  }

  function summaryModal() {
    const items = attentionItems();
    openModal(
      "Требуют внимания",
      "Проверки обновляются из записей приложения.",
      `<div class="notice">${icon("info", 15)}Сигналы вычисляются по датам и числовым порогам. Очерёдность решений определяет директор. В демо используется дата 12 ноября 2026.</div><div class="result-list">${items.map((item) => `<div class="result-item"><h3>${esc(item.title)}</h3><p>${esc(item.detail)}</p><p class="small muted">Правило: ${esc(item.rule)}</p><div class="actions" style="margin-top:12px">${btn("Открыть запись", item.action, "arrow", "small", `data-id="${item.id}"`)}</div></div>`).join("") || '<div class="empty">По заданным правилам нет записей для проверки.</div>'}</div><p class="sim-note">Условия настроены один раз в коде. Сообщения собираются по шаблонам при изменении данных. Причины отклонений проверяются отдельно.</p><div class="form-actions">${btn("Сводка для ChatGPT", "copy-brief", "download", "primary")}</div>`,
    );
  }

  function notifications() {
    summaryModal();
  }

  function copyBrief() {
    const text = reviewBrief();
    const fallback = () =>
      openModal(
        "Сводка для ChatGPT",
        "Скопируйте текст и вставьте в выбранный чат. Сайт ничего не отправляет.",
        `<label class="field">Текст сводки<textarea readonly rows="14" style="min-height:300px">${esc(text)}</textarea></label><div class="form-actions">${btn("Закрыть", "close")}</div>`,
      );
    if (!navigator.clipboard?.writeText) {
      fallback();
      return;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => toast("Сводка скопирована. Вставьте её в ChatGPT."))
      .catch(fallback);
  }
  return {
    id: "home",
    render: home,
    actions: { summary: summaryModal, notifications, "copy-brief": copyBrief },
    selectors: { attentionItems },
  };
}
