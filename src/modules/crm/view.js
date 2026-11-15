import {
  COLUMNS,
  STATUSES,
  leadColumn,
  leadLabel,
  factors,
  isReadinessColumn,
  stageValue,
  leadDate,
  phoneDigits,
  groupLeads,
} from "./model.js";
export function createLeadView(ui) {
  const { icon, esc, btn, head, pill, field, selectField, textField, form } =
    ui;
  const factorChips = (value) =>
    `<div class="lead-factors">${[
      ["money", "Деньги", "wallet"],
      ["place", "Помещение", "store"],
      ["now", "Сейчас", "clock"],
    ]
      .map(
        ([key, title, ico]) =>
          `<span class="${value[key] ? "yes" : "no"}" title="${title}: ${value[key] ? "да" : "не подтверждено"}">${icon(ico, 12)}${title}${value[key] ? icon("check", 11) : ""}<span class="screen-reader">: ${value[key] ? "да" : "не подтверждено"}</span></span>`,
      )
      .join("")}</div>`;
  const options = (value) =>
    `<option value="auto" ${value === "auto" ? "selected" : ""}>По анкете — автоматически</option>${[...COLUMNS, { id: "call_back", title: "Перезвонить" }, { id: "meeting", title: "Встреча" }].map((c) => `<option value="${c.id}" ${value === c.id ? "selected" : ""}>${c.title}</option>`).join("")}`;
  function tile(lead, busy = false) {
    const phone = phoneDigits(lead.phone),
      instagram = /^[A-Za-z0-9_][A-Za-z0-9_.]{0,29}$/.test(lead.instagram || "")
        ? lead.instagram
        : null;
    return `<article class="lead-tile" draggable="${!busy}" data-id="${esc(lead.id)}" aria-label="Заявка: ${esc(lead.name)}"><div class="lead-tile-top"><span>${esc(lead.city || "Город не указан")}</span><span class="lead-grip" title="Перетащить карточку">${icon("menu", 14)}</span></div><button type="button" class="lead-open" data-action="deal" data-id="${esc(lead.id)}"><strong>${esc(lead.name)}</strong>${icon("arrow", 16)}</button>${factorChips(factors(lead))}<div class="lead-tile-foot">${instagram ? `<a href="https://www.instagram.com/${encodeURIComponent(instagram)}/" target="_blank" rel="noopener noreferrer">${icon("brand", 13)}Открыть профиль</a>` : ""}${phone ? `<a href="tel:+${phone}">${icon("phone", 13)}${esc(lead.phone)}</a>` : ""}<span>${leadDate(lead.created_at)}</span></div>${lead.note || lead.comment ? `<p class="lead-note">${esc(lead.note || lead.comment)}</p>` : ""}${["call_back", "meeting"].includes(lead.status) ? pill(STATUSES[lead.status], "orange") : ""}<label class="screen-reader" for="lead-stage-${esc(lead.id)}">Переместить заявку ${esc(lead.name)}</label><select class="lead-stage-select" id="lead-stage-${esc(lead.id)}" data-lead-move="${esc(lead.id)}" ${busy ? "disabled" : ""}>${options(stageValue(lead))}</select></article>`;
  }
  function board(items, view, busy = false) {
    const groups = groupLeads(items, view);
    return COLUMNS.map(
      (c) =>
        `<section class="pipeline-column ${c.id === "111" ? "ready" : ""} stage-${c.id}" data-lead-column="${c.id}" id="lead-column-${c.id}" aria-labelledby="lead-heading-${c.id}"><header class="pipeline-column-head"><div><h2 id="lead-heading-${c.id}">${c.title}</h2><span class="pipeline-count">${groups.get(c.id).length}</span><button type="button" class="lead-add-column" data-action="add-deal" data-column="${c.id}" aria-label="Добавить заявку: ${c.title}" ${busy ? "disabled" : ""}>${icon("plus", 16)}</button></div>${isReadinessColumn(c.id) ? factorChips({ money: c.id[0] === "1", place: c.id[1] === "1", now: c.id[2] === "1" }) : '<span class="lead-column-spacer"></span>'}</header><div class="pipeline-cards">${
          groups
            .get(c.id)
            .map((x) => tile(x, busy))
            .join("") || '<div class="pipeline-empty">Нет заявок</div>'
        }</div></section>`,
    ).join("");
  }
  const jumpOptions = (items, view) => {
    const groups = groupLeads(items, view);
    return (
      '<option value="" disabled selected>К колонке…</option>' +
      COLUMNS.map(
        (c) =>
          `<option value="${c.id}">${c.title} (${groups.get(c.id).length})</option>`,
      ).join("")
    );
  };
  function login(auth) {
    const loading = auth.status === "loading";
    return (
      head(
        "Заявки",
        "Рабочая CRM с теми же заявками, что в приложении франшизы.",
        "",
        "Франшизная CRM",
      ) +
      `<section class="card crm-login"><div class="crm-login-icon">${icon("handshake", 26)}</div><h2>Вход в рабочую CRM</h2><p class="sim-note">Используйте логин или почту и пароль от приложения франшизы. Доступ проверяется по вашей действующей учётной записи.</p><form data-form="crm-login"><div class="form-grid">${field("Логин или электронная почта", "email", "", "text", true, 'required autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="254"')}${field("Пароль", "password", "", "password", true, 'required autocomplete="current-password" maxlength="256"')}<label class="lead-only-new full-width"><input name="remember" type="checkbox">Запомнить на этом устройстве</label></div><p id="crm-login-error" class="crm-error" role="alert">${esc(auth.error || "")}</p><button type="submit" class="btn primary" ${loading ? "disabled" : ""}>${loading ? "Проверяем вход…" : "Войти"}</button></form><div class="crm-login-demo"><a href="#/crm/demo" class="link">Посмотреть демонстрацию CRM</a></div></section>`
    );
  }
  function status(feed, demo) {
    if (demo) return '<span class="pill gray">Демонстрационные заявки</span>';
    if (feed.error)
      return `<span class="crm-error">${esc(feed.error)}</span>${btn("Повторить", "lead-refresh", "reset", "small")}`;
    if (feed.refreshing)
      return '<span class="muted small">Обновляем заявки…</span>';
    return `<span class="small muted">${feed.lastSuccess ? `Обновлено ${leadDate(feed.lastSuccess)}` : "Загружаем заявки…"}</span>`;
  }
  function page({ items, trashItems, view, feed, auth, demo, busy }) {
    if (!demo && auth.status !== "signed-in") return login(auth);
    const actions =
      btn(
        view.trash ? "К заявкам" : "Корзина",
        "lead-trash",
        view.trash ? "arrow" : "trash",
      ) +
      btn(
        '<span class="screen-reader">Обновить заявки</span>',
        "lead-refresh",
        "reset",
        "",
        'aria-label="Обновить заявки" title="Обновить заявки"',
      ) +
      (!view.trash ? btn("Добавить", "add-deal", "plus", "primary") : "");
    const title = head(
      view.trash ? "Корзина заявок" : "Заявки",
      demo
        ? "Пример готовности к открытию: деньги, помещение и срок."
        : "Заявки с bronservis.ru · общая очередь с приложением франшизы",
      actions,
      demo ? "Демонстрация CRM" : "Рабочая CRM",
    );
    const mode = `<div class="crm-modebar"><div id="crm-sync-status" role="status">${status(feed, demo)}</div><div class="actions">${demo ? '<a href="#/crm" class="link">К рабочей CRM</a>' : `<span class="small muted">${esc(auth.profile?.name || "")}</span>${btn("Выйти", "crm-logout", "", "small")}`}</div></div>`;
    if (view.trash)
      return `<div class="leads-workspace">${title}${mode}<div class="lead-trash-list" id="lead-trash-list">${trashItems.map((x) => `<article class="card lead-trash-item"><div><h2>${esc(x.name)}</h2><p class="muted small">Удалена ${leadDate(x.deleted_at)}</p>${x.note ? `<p class="lead-note">${esc(x.note)}</p>` : ""}</div>${btn("Восстановить", "lead-restore", "reset", "small", `data-id="${esc(x.id)}"`)}</article>`).join("") || `<div class="card empty">${feed.refreshing ? "Загружаем корзину…" : feed.error ? "Корзина не загружена. Повторите обновление." : "В корзине нет заявок."}</div>`}</div></div>`;
    const groups = groupLeads(items, view),
      count = [...groups.values()].flat().length;
    if (!demo && feed.status === "idle" && !feed.lastSuccess)
      return `<div class="leads-workspace">${title}${mode}<div class="card empty">${feed.error ? "Заявки не загружены." : "Загружаем заявки…"}</div></div>`;
    if (!demo && feed.status === "error" && !feed.lastSuccess)
      return `<div class="leads-workspace">${title}${mode}<div class="card empty">Не удалось загрузить очередь. Повторите обновление.</div></div>`;
    return `<div class="leads-workspace">${title}${mode}<div class="pipeline-tools"><label class="pipeline-search">${icon("search", 18)}<input id="deal-search" aria-label="Поиск заявок" placeholder="Instagram, имя, город, телефон" value="${esc(view.query)}" autocomplete="off"></label><label class="lead-only-new"><input id="lead-only-new" type="checkbox" ${view.onlyNew ? "checked" : ""}>Только новые</label><div class="pipeline-jump"><select id="lead-jump" aria-label="Перейти к колонке">${jumpOptions(items, view)}</select></div></div><p class="lead-filter-empty muted small" id="lead-filter-empty" ${count ? "hidden" : ""}>По выбранным условиям заявок нет.</p><div class="pipeline-board" id="lead-board" role="region" aria-label="Канбан заявок. Прокручивается горизонтально" tabindex="0">${board(items, view, busy)}</div><p class="pipeline-help">${demo ? "Изменения примера сохраняются только в этом браузере." : "Изменения статуса, заметки и корзины видны и в прежнем приложении. Автообновление — каждые 30 секунд и при возврате на вкладку."}</p></div>`;
  }
  const ANSWERS = {
    budget: {
      full: "Есть вся сумма",
      partial: "Есть часть суммы",
      none: "Пока нет суммы",
    },
    timing: {
      month: "В ближайший месяц",
      quarter: "Через 1–3 месяца",
      half: "Через 3–6 месяцев",
      research: "Пока изучает",
    },
    manage: {
      self: "Будет управлять сам",
      manager: "Наймёт управляющего",
      undecided: "Пока не решил",
    },
    experience: {
      business: "Есть свой бизнес",
      some: "Есть опыт в продажах / управлении",
      none: "Первый бизнес",
    },
    place: {
      has: "Есть место с потоком",
      options: "Есть варианты",
      help: "Нужна помощь с поиском",
    },
  };
  function editor(lead, { column = "000", demo = false } = {}) {
    const existing = !!lead?.id,
      contact = lead?.instagram ? `@${lead.instagram}` : lead?.name || "";
    const primary =
      field(
        "Instagram или имя *",
        "lead_contact",
        contact,
        "text",
        true,
        'required maxlength="100" placeholder="@nik или имя" autocomplete="off" autocapitalize="none" spellcheck="false"',
      ) +
      `<label class="field full">Колонка<select name="column">${options(existing ? stageValue(lead) : column)}</select></label>` +
      textField(
        "Заметка",
        "note",
        lead?.note || "",
        true,
        'placeholder="О чём договорились"',
      );
    const extra = `<details class="lead-extra full-width"><summary>Дополнительно</summary><div class="form-grid">${field("Телефон", "phone", lead?.phone || "", "tel", false, 'maxlength="30" placeholder="Необязательно"')}${field("Город", "city", lead?.city || "", "text", false, 'maxlength="80" placeholder="Необязательно"')}${demo ? `<label class="lead-only-new full-width"><input name="paid" type="checkbox" ${lead?.paid ? "checked" : ""}>Оплата получена — только в примере</label>` : ""}${
      existing
        ? `<div class="full-width crm-questionnaire"><h3>Ответы из анкеты</h3>${[
            ["budget", "Деньги"],
            ["place", "Помещение"],
            ["timing", "Срок открытия"],
            ["manage", "Управление"],
            ["experience", "Опыт"],
          ]
            .map(
              ([key, title]) =>
                `<div class="balance-row"><span>${title}</span><strong>${esc(ANSWERS[key]?.[key === "budget" ? (lead.funding ?? lead.budget) : lead[key]] || "Не указано")}</strong></div>`,
            )
            .join(
              "",
            )}${lead.comment ? `<p class="sim-note"><strong>Комментарий:</strong> ${esc(lead.comment)}</p>` : ""}<p class="small muted">Источник: ${esc(lead.source || "Не указан")}<br>Создана ${leadDate(lead.created_at)}</p>${lead.updated_by_name ? `<p class="small muted">Изменил(а): ${esc(lead.updated_by_name)}</p>` : ""}</div>`
        : ""
    }</div></details>`;
    return (
      form(
        "lead",
        primary + extra,
        lead?.id || "",
        existing ? "Сохранить" : "Добавить",
      ) +
      `<p class="crm-error" id="lead-form-error" role="alert"></p>${existing ? `<div class="lead-delete-area">${btn("Удалить заявку", "lead-delete", "trash", "small danger", `data-id="${esc(lead.id)}"`)}</div>` : ""}`
    );
  }
  return { page, board, jumpOptions, editor, status };
}
