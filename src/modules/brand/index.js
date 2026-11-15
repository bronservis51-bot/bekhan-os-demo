import { TODAY } from "../../shared/demo-clock.js";

export function createBrandModule({
  repository,
  ui,
  render,
  demoLeads,
  navigation,
  leadLabel,
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
  const view = { contentFilter: "Все статусы" };
  const liveLeads = () => demoLeads.items();
  function publicationUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" &&
        [
          "instagram.com",
          "www.instagram.com",
          "instagr.am",
          "www.instagr.am",
        ].includes(url.hostname) &&
        !url.username &&
        !url.password
        ? url.href
        : "";
    } catch {
      return "";
    }
  }

  function brand() {
    const published = data.content.filter((c) => c.status === "Опубликован");
    const leads = liveLeads().filter((d) => d.source === "Instagram");
    const content = data.content.filter(
      (c) =>
        view.contentFilter === "Все статусы" || c.status === view.contentFilter,
    );
    return (
      head(
        "Личный бренд",
        "Идеи, даты и статусы публикаций в одном плане.",
        btn("Идея контента", "add-content", "plus", "primary"),
        "Простой контент-план",
      ) +
      `<div class="kpis">${kpi("В работе", String(data.content.length - published.length), "материалов до публикации", "tasks")}${kpi("Опубликовано", String(published.length), "отмечено в контент-плане", "check")}${kpi("Обращения из Instagram", String(leads.length), "в примере CRM", "users")}${kpi("Оплаты из Instagram", String(leads.filter((d) => d.paid).length), "в примере CRM", "handshake")}</div>
 <div class="notice">${icon("info", 15)}План ведётся вручную: тема, дата, статус и необязательная ссылка. Публикация открывается в Instagram. Просмотры, подписчики и видеопревью не загружаются.</div>
 <div class="control-row"><h2>Контент-план</h2><div class="filter"><select id="content-filter" aria-label="Статус контента">${["Все статусы", "Идея", "Сценарий", "На съёмке", "Опубликован"].map((status) => `<option ${status === view.contentFilter ? "selected" : ""}>${status}</option>`).join("")}</select></div></div>
 <div class="content-grid">${
   content
     .map((c) => {
       const linked = liveLeads().filter((d) => d.content === c.id),
         url = publicationUrl(c.url);
       return `<article class="card content-card"><div class="content-body"><div class="mini-head">${pill(c.status, c.status === "Опубликован" ? "" : c.status === "На съёмке" ? "orange" : "gray")}<span>${esc(c.format)}</span></div><h3>${esc(c.title)}</h3><div class="content-meta"><span>${date(c.date)}</span><span>${linked.length} связанных обращений</span></div><div class="actions" style="margin-top:14px">${btn("Изменить запись", "content", "", "small", `data-id="${c.id}"`)}${url ? `<a class="btn small" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${icon("link", 13)}Открыть публикацию</a>` : ""}</div></div></article>`;
     })
     .join("") ||
   '<div class="card empty full-width">В этом статусе материалов пока нет.</div>'
 }</div>
 <section class="card section-gap"><div class="card-title"><h2>Обращения и оплаты</h2>${btn("Открыть в CRM", "brand-crm", "arrow", "small")}</div><div class="balance-row"><span>Источник «Instagram»</span><b>${leads.length} обращений</b></div><div class="balance-row"><span>Из них на этапе оплаты</span><b>${leads.filter((d) => d.paid).length}</b></div><p class="sim-note">Источник и связь с публикацией указываются в карточке сделки вручную, когда они известны. Это пример учёта; автоматического отслеживания зрителей и переходов нет.</p></section>`
    );
  }

  function contentModal(id = "") {
    const c = data.content.find((c) => c.id === id) || {
      title: "",
      status: "Идея",
      date: "2026-11-16",
      format: "Reels",
      url: "",
    };
    const leads = id ? liveLeads().filter((d) => d.content === id) : [];
    openModal(
      id ? "Материал контент-плана" : "Новая идея",
      "Ручная запись. По ссылке открывается сама публикация.",
      form(
        "content",
        field(
          "Название / тема",
          "title",
          c.title,
          "text",
          true,
          'required maxlength="160"',
        ) +
          selectField(
            "Статус",
            "status",
            ["Идея", "Сценарий", "На съёмке", "Опубликован"],
            c.status,
          ) +
          selectField(
            "Формат",
            "format",
            ["Reels", "Карусель", "Stories"],
            c.format,
          ) +
          field("Дата публикации", "date", c.date, "date", true, "required") +
          field(
            "Ссылка на публикацию (необязательно)",
            "url",
            c.url || "",
            "url",
            true,
            'placeholder="https://www.instagram.com/reel/…" maxlength="500"',
          ),
        id,
      ) +
        (id
          ? `<div class="separated"><h3>Связанные вручную обращения · ${leads.length}</h3>${leads.map((d) => `<button class="search-result" data-action="demo-deal" data-id="${d.id}">${icon("handshake", 16)}<span><b>${esc(d.name)}</b><small>${esc(d.city)} · ${leadLabel(d)}</small></span></button>`).join("") || '<p class="sim-note">Привязка к этому материалу не указана.</p>'}</div>`
          : ""),
    );
  }
  return {
    id: "brand",
    render: brand,
    selectors: { items: () => structuredClone(data.content) },
    actions: {
      "add-content": () => contentModal(),
      content: (b) => contentModal(b.dataset.id),
      "brand-crm": () => navigation.go("crm/demo"),
    },
    forms: {
      content: ({ values: v, id }) => {
        if (v.url?.trim() && !publicationUrl(v.url.trim())) {
          toast("Укажите HTTPS-ссылку Instagram или оставьте поле пустым");
          return;
        }
        const existing = data.content.find((c) => c.id === id),
          record = {
            ...v,
            id: id || uid(),
            url: publicationUrl(v.url?.trim()),
          };
        if (existing) Object.assign(existing, record);
        else data.content.push(record);
        const ok = save();
        closeModal();
        render();
        if (ok) toast("Запись сохранена в браузере");
      },
    },
    bind() {
      document
        .getElementById("content-filter")
        ?.addEventListener("change", (e) => {
          view.contentFilter = e.target.value;
          render();
        });
    },
  };
}
