export const COLUMNS = [
  ["000", "Изучают"],
  ["010", "Есть помещение"],
  ["001", "Хотят сейчас"],
  ["100", "Есть деньги"],
  ["011", "Помещение + сейчас"],
  ["110", "Деньги + помещение"],
  ["101", "Деньги + сейчас"],
  ["111", "Готовы к открытию"],
  ["in_work", "В работе"],
  ["won", "Договор"],
  ["lost", "Отказ"],
].map(([id, title]) => ({ id, title }));
export const STATUSES = {
  new: "Новая",
  in_work: "В работе",
  call_back: "Перезвонить",
  meeting: "Встреча",
  won: "Договор",
  lost: "Отказ",
};
export const isReadinessColumn = (value) => /^[01]{3}$/.test(value);
export const readiness = (lead) => ({
  money: (lead.funding ?? lead.budget) === "full",
  place: lead.place === "has",
  now: lead.timing === "month",
});
export const readinessKey = (lead) => {
  const r = readiness(lead);
  return `${Number(r.money)}${Number(r.place)}${Number(r.now)}`;
};
export function leadColumn(lead) {
  if (lead.status === "new")
    return isReadinessColumn(lead.pipeline_column)
      ? lead.pipeline_column
      : readinessKey(lead);
  return ["won", "lost"].includes(lead.status) ? lead.status : "in_work";
}
export const stageValue = (lead) =>
  ["call_back", "meeting"].includes(lead.status)
    ? lead.status
    : leadColumn(lead);
export const leadLabel = (lead) =>
  ["call_back", "meeting"].includes(lead.status)
    ? STATUSES[lead.status]
    : COLUMNS.find((c) => c.id === leadColumn(lead))?.title || "Изучают";
export const factors = (lead) => {
  const col = leadColumn(lead);
  return isReadinessColumn(col)
    ? { money: col[0] === "1", place: col[1] === "1", now: col[2] === "1" }
    : readiness(lead);
};
export const phoneDigits = (value) =>
  String(value || "")
    .replace(/\D/g, "")
    .replace(/^8(?=\d{10}$)/, "7");
export const leadDate = (value) => {
  const d = new Date(value);
  return Number.isFinite(d.getTime())
    ? d.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Moscow",
      })
    : "Дата не указана";
};
export function parseContact(value) {
  const text = String(value || "").trim(),
    profile =
      /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9_][A-Za-z0-9_.]{0,29})\/?(?:[?#].*)?$/i.exec(
        text,
      );
  const candidate =
    profile?.[1] ||
    (text.startsWith("@")
      ? text.slice(1)
      : /^[A-Za-z0-9_][A-Za-z0-9_.]{0,29}$/.test(text)
        ? text
        : "");
  const instagram = /^[A-Za-z0-9_][A-Za-z0-9_.]{0,29}$/.test(candidate)
    ? candidate
    : null;
  return { name: instagram ? `@${instagram}` : text, instagram };
}
export function leadInput(values, id) {
  const contact = parseContact(values.lead_contact),
    phone = String(values.phone || "").trim(),
    city = String(values.city || "").trim(),
    note = String(values.note || "").trim(),
    column = values.column;
  if (!contact.name || contact.name.length > 80)
    throw new Error("Укажите Instagram или имя длиной до 80 символов");
  if (String(values.lead_contact).trim().startsWith("@") && !contact.instagram)
    throw new Error(
      "Проверьте ник Instagram: буквы, цифры, точка или подчёркивание, до 30 символов",
    );
  if (
    phone &&
    (phone.length > 30 ||
      !/^[+\d\s().-]+$/.test(phone) ||
      phoneDigits(phone).length < 10 ||
      phoneDigits(phone).length > 15)
  )
    throw new Error(
      "Проверьте телефон: от 10 до 15 цифр, либо оставьте поле пустым",
    );
  if (city && (city.length < 2 || city.length > 80))
    throw new Error("Название города должно содержать от 2 до 80 символов");
  if (note.length > 2000)
    throw new Error("Заметка должна содержать не больше 2000 символов");
  if (
    !["auto", ...COLUMNS.map((c) => c.id), "call_back", "meeting"].includes(
      column,
    )
  )
    throw new Error("Выберите колонку");
  return { ...(id ? { id } : {}), ...contact, phone, city, column, note };
}
export function groupLeads(leads, { query = "", onlyNew = false } = {}) {
  query = query.trim().toLocaleLowerCase("ru");
  const digits = phoneDigits(query),
    phoneQuery = digits.length >= 3 && /^[\d\s+().-]+$/.test(query),
    groups = new Map(COLUMNS.map((c) => [c.id, []]));
  for (const lead of leads) {
    if (lead.deleted_at || (onlyNew && lead.status !== "new")) continue;
    const text =
      `${lead.name} ${lead.instagram || ""} ${lead.city || ""} ${lead.phone || ""}`.toLocaleLowerCase(
        "ru",
      );
    if (
      query &&
      !text.includes(query) &&
      !(phoneQuery && phoneDigits(lead.phone).includes(digits))
    )
      continue;
    groups.get(leadColumn(lead)).push(lead);
  }
  for (const rows of groups.values())
    rows.sort(
      (a, b) =>
        String(b.created_at).localeCompare(String(a.created_at)) ||
        a.id.localeCompare(b.id),
    );
  return groups;
}
export function changeDemoColumn(lead, column) {
  if (column === "auto") {
    lead.status = "new";
    lead.pipeline_column = null;
  } else if (isReadinessColumn(column)) {
    lead.status = "new";
    lead.pipeline_column = column;
  } else {
    lead.status = column;
    lead.pipeline_column = null;
  }
  lead.stage =
    lead.status === "won"
      ? lead.paid
        ? 4
        : 3
      : lead.status === "lost"
        ? 5
        : lead.status === "new"
          ? 0
          : 2;
  lead.updated_at = new Date().toISOString();
  return lead;
}
