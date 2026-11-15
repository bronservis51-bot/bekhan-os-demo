import { TODAY } from "../../shared/demo-clock.js";

export function createFinanceModule({ repository, ui, render }) {
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
  const view = { month: "2026-11", simSales: 1 };
  const commit = () => {
    const ok = save();
    closeModal();
    render();
    if (ok) toast("Сохранено в этом браузере");
  };
  const received = (month = "2026-11") =>
    data.transactions
      .filter((t) => t.type === "income" && t.date.startsWith(month))
      .reduce((s, t) => s + t.amount, 0);

  const expenses = (month) =>
    data.transactions
      .filter((t) => t.type === "expense" && t.date.startsWith(month))
      .reduce((s, t) => s + t.amount, 0);

  const forecast = () => received() + 252000;

  function incomeChart() {
    const facts = [320, 385, 460, 510, 540, received() / 1000];
    const plans = [600, 650, 700, 800, 900, 1000];
    return `<svg viewBox="0 0 590 180" class="chart" role="img" aria-label="Доход по месяцам в тысячах рублей: июнь 320, июль 385, август 460, сентябрь 510, октябрь 540, ноябрь ${received() / 1000}. План ноября 1000.">${[0, 1, 2].map((i) => `<text x="0" y="${154 - i * 64}">${i * 500 === 1000 ? "1 млн" : i * 500 === 0 ? "0" : 500 + " тыс."}</text><line class="chart-grid" x1="50" y1="${150 - i * 64}" x2="585" y2="${150 - i * 64}"/>`).join("")}${facts
      .map((v, i) => {
        let x = 76 + i * 90;
        return `<rect x="${x}" y="${150 - plans[i] * 0.128}" width="29" height="${plans[i] * 0.128}" rx="5" fill="#e8eddf"/><rect x="${x}" y="${150 - v * 0.128}" width="29" height="${v * 0.128}" rx="5" fill="${i === 5 ? "#214e40" : "#b6cf8e"}"/>${i === 5 ? `<text x="${x + 14}" y="${142 - v * 0.128}" text-anchor="middle" style="fill:#345a43;font-size:10px">${Math.round(v)} тыс.</text>` : ""}`;
      })
      .join(
        "",
      )}</svg><div class="chart-labels" style="padding-left:50px"><span>Июн</span><span>Июл</span><span>Авг</span><span>Сен</span><span>Окт</span><span>Ноя</span></div>`;
  }

  function finance() {
    const income = received(view.month),
      out = expenses(view.month),
      sources = ["Грозный", "Ингушетия", "Франшизы", "Прибыль отдела"];
    const tx = data.transactions
      .filter((t) => t.date.startsWith(view.month))
      .sort((a, b) => b.date.localeCompare(a.date));
    return (
      head(
        "Личные финансы",
        "Полученные деньги, планы и прогноз — по отдельности.",
        `<select class="inline-select" id="finance-month" aria-label="Месяц финансов"><option value="2026-11" ${view.month === "2026-11" ? "selected" : ""}>Ноябрь 2026</option><option value="2026-10" ${view.month === "2026-10" ? "selected" : ""}>Октябрь 2026</option></select>${btn("Операция", "add-transaction", "plus", "primary")}`,
        "Деньги и возможности",
      ) +
      `<div class="kpis">${kpi("Полученный доход", rub(income), "сумма поступлений", "wallet")}${kpi("Расходы", rub(out), "включая ремонт", "money")}${kpi("Остаток на конец периода", rub(320000 + data.transactions.filter((t) => t.date <= `${view.month}-31`).reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0)), "с учётом начальных 320 000 ₽", "wallet")}${kpi("До цели по доходу", rub(Math.max(0, 1000000 - income)), "цель: 1 000 000 ₽ / месяц", "target")}</div>
 <div class="two-col"><div class="stack"><section class="card"><div class="card-title"><h2>Источники дохода</h2>${pill("Факт")}</div>${sources
   .map((s, i) => {
     const amount = tx
       .filter((t) => t.category === s && t.type === "income")
       .reduce((a, t) => a + t.amount, 0);
     return `<div class="source-row"><div class="source-icon">${icon(["store", "store", "handshake", "trend"][i], 17)}</div><div class="source-text"><b>${s}</b><small>${s === "Прибыль отдела" ? "10% прибыли отдела · допущение" : "Личный доход · пример"}</small></div><div class="source-amount">${rub(amount)}<small>${income ? Math.round((amount / income) * 100) : 0}% от поступлений</small></div></div>`;
   })
   .join(
     "",
   )}</section><section class="card"><div class="card-title"><h2>История операций</h2><span class="label">${tx.length} операций</span></div><div class="table-wrap"><table><thead><tr><th>Дата</th><th>Категория / комментарий</th><th>Сумма</th></tr></thead><tbody>${tx.map((t) => `<tr><td>${date(t.date)}</td><td><strong>${esc(t.category)}</strong><small>${esc(t.note)}</small></td><td class="${t.type === "income" ? "up" : "down"}">${t.type === "income" ? "+" : "−"}${rub(t.amount)}</td></tr>`).join("")}</tbody></table></div></section></div><div class="stack"><section class="card"><div class="card-title"><h2>Прогноз на ноябрь</h2>${pill("Оценка", "orange")}</div><p class="label">При сохранении текущих условий</p><div class="forecast-value" id="forecast-result">${rub(forecast() + view.simSales * 120000)}</div><p class="metric-caption">Получено ${rub(received())} + ожидается 252 000 ₽<br>+ дополнительные продажи из сценария</p><label class="slider-label" for="sales-slider">Ещё продаж франшизы <b id="sales-number">${view.simSales}</b></label><input type="range" id="sales-slider" min="0" max="3" step="1" value="${view.simSales}" aria-label="Дополнительные продажи франшизы"><div class="chart-labels"><span>0</span><span>1</span><span>2</span><span>3</span></div><div class="balance-row total"><span>До миллиона</span><span id="forecast-gap">${rub(Math.max(0, 1000000 - forecast() - view.simSales * 120000))}</span></div><p class="sim-note">Допущение: личное вознаграждение 120 000 ₽ за дополнительную продажу. Прогноз не увеличивает факт или остаток денег.</p></section><section class="card"><div class="card-title"><h2>Ожидаемые поступления</h2><span class="label">Ноябрь</span></div><div class="balance-row"><span>Доход от точек</span><b>190 000 ₽</b></div><div class="balance-row"><span>Прибыль отдела</span><b>62 000 ₽</b></div><div class="balance-row total"><span>Итого ожидается</span><span>252 000 ₽</span></div><p class="sim-note">Демонстрационный план. Не подтверждённые поступления.</p></section></div></div>`
    );
  }

  function transactionModal() {
    openModal(
      "Новая операция",
      "Факт поступления или расхода — без прогнозных сумм.",
      form(
        "transaction",
        selectField(
          "Тип",
          "type",
          [
            ["income", "Поступление"],
            ["expense", "Расход"],
          ],
          "income",
        ) +
          field(
            "Сумма, ₽",
            "amount",
            "",
            "number",
            false,
            'required min="1" max="1000000000" step="1"',
          ) +
          selectField(
            "Категория",
            "category",
            ["Грозный", "Ингушетия", "Франшизы", "Прибыль отдела"],
            "Грозный",
          ) +
          field("Дата", "date", `${view.month}-12`, "date", false, "required") +
          field("Комментарий", "note", "", "text", true, 'maxlength="200"'),
      ),
    );
  }
  return {
    id: "finance",
    render: finance,
    selectors: { received, expenses, forecast, incomeChart },
    actions: {
      "add-transaction": () => {
        transactionModal();
        const f = document.querySelector('[data-form="transaction"]');
        f.elements.type.addEventListener("change", (e) => {
          f.elements.category.innerHTML = (
            e.target.value === "income"
              ? ["Грозный", "Ингушетия", "Франшизы", "Прибыль отдела"]
              : ["Личные расходы", "Ремонт", "Транспорт", "Другое"]
          )
            .map((s) => `<option>${s}</option>`)
            .join("");
        });
      },
    },
    forms: {
      transaction: ({ values: v }) => {
        if (v.date > TODAY) {
          toast("Укажите дату не позже 12 ноября — это дата примера");
          return;
        }
        data.transactions.push({ ...v, amount: Number(v.amount), id: uid() });
        commit();
      },
    },
    bind() {
      document
        .getElementById("finance-month")
        ?.addEventListener("change", (e) => {
          view.month = e.target.value;
          render();
        });
      document
        .getElementById("sales-slider")
        ?.addEventListener("input", (e) => {
          view.simSales = Number(e.target.value);
          document.getElementById("sales-number").textContent = view.simSales;
          document.getElementById("forecast-result").textContent = rub(
            forecast() + view.simSales * 120000,
          );
          document.getElementById("forecast-gap").textContent = rub(
            Math.max(0, 1000000 - forecast() - view.simSales * 120000),
          );
        });
      document
        .querySelector('[data-form="transaction"] [name="type"]')
        ?.addEventListener("change", (e) => {
          e.target.form.elements.category.innerHTML = (
            e.target.value === "income"
              ? ["Грозный", "Ингушетия", "Франшизы", "Прибыль отдела"]
              : ["Личные расходы", "Ремонт", "Транспорт", "Другое"]
          )
            .map((s) => `<option>${s}</option>`)
            .join("");
        });
    },
  };
}
