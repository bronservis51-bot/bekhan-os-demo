const icons = {
  home: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  wallet:
    '<path d="M20 8V5a2 2 0 0 0-2-2H6a3 3 0 0 0 0 6h14v12H6a3 3 0 0 1-3-3V6"/><path d="M20 12h-5v5h5"/><path d="M17 14.5h.01"/>',
  handshake:
    '<path d="m3 10 4-5 5 1 5-1 4 5-5 8-4 3-5-3-4-8Z"/><path d="m7 5 5 1-4 6 3 1 4-4 6 5M7 16l6 4M10 13l6 5"/>',
  store:
    '<path d="M3 9h18l-2-6H5L3 9Z"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M5 12v9h14v-9M10 21v-6h5v6"/>',
  brand:
    '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
  target:
    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  gym: '<path d="M6 5v14M3 8v8M18 5v14M21 8v8M6 12h12"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  tasks:
    '<rect x="4" y="3" width="16" height="18" rx="3"/><path d="m7 9 1 1 2-2m3 1h4m-10 6 1 1 2-2m3 1h4"/>',
  settings:
    '<path d="m9 3-1 3-3 1-2 5 2 5 3 1 1 3h6l1-3 3-1 2-5-2-5-3-1-1-3H9Z"/><circle cx="12" cy="12" r="3"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M9 21h6"/>',
  spark:
    '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/>',
  trend: '<path d="m3 17 6-6 4 4 8-10m-6 0h6v6"/>',
  calendar:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6m10-6v6M3 11h18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  flag: '<path d="M5 22V3m0 1c5-5 9 5 14 0v11c-5 5-9-5-14 0"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.01"/>',
  car: '<path d="m3 12 2-7h14l2 7v7H3v-7Zm0 0h18M7 16h1m8 0h1M5 19v3m14-3v3"/>',
  house: '<path d="m2 10 10-8 10 8M5 8v13h14V8M9 21v-8h6v8"/>',
  play: '<path d="m9 5 11 7-11 7V5Z"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  reset: '<path d="M3 9a9 9 0 1 1 1 9M3 3v6h6"/>',
  users:
    '<circle cx="9" cy="7" r="4"/><path d="M2 21v-3a7 7 0 0 1 14 0v3m1-18a4 4 0 0 1 0 8m2 3a7 7 0 0 1 3 7"/>',
  link: '<path d="m10 13 4-4m-5 7-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0 10a4 4 0 0 0 6 0l5-5a4 4 0 0 0-6-6l-2 2"/>',
  phone:
    '<path d="M5 3h4l2 5-3 2a14 14 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A18 18 0 0 1 3 5a2 2 0 0 1 2-2Z"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
  money:
    '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/>',
};

const icon = (name, size = 18) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.home}</svg>`;

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

const num = (n) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n);

const rub = (n) => `${num(n)} ₽`;

const short = (n) =>
  n >= 1000000
    ? `${(n / 1000000).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} млн`
    : `${Math.round(n / 1000)} тыс.`;

const date = (d) =>
  new Date(`${d}T12:00:00`)
    .toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
    .replace(".", "");

const uid = () =>
  crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const progress = (v, total) =>
  `<div class="tiny-progress"><span style="width:${Math.max(0, Math.min(100, (v / total) * 100))}%"></span></div>`;

const pill = (text, tone = "") =>
  `<span class="pill ${tone}">${esc(text)}</span>`;

const btn = (text, action, ico = "", className = "", extra = "") =>
  `<button type="button" class="btn ${className}" data-action="${action}" ${extra}>${ico ? icon(ico, 14) : ""}${text}</button>`;

function head(title, sub, action = "", eyebrow = "Личное пространство") {
  return `<div class="page-head"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p class="subtitle">${sub}</p></div>${action ? `<div class="actions">${action}</div>` : ""}</div>`;
}

function kpi(label, value, note, ico = "trend", p = "", tone = "") {
  return `<article class="card kpi"><div class="kpi-label">${label}<span class="kpi-icon">${icon(ico, 17)}</span></div><div class="value">${value}</div><div class="kpi-bottom">${p ? pill(p, tone) : ""}<span>${note}</span></div></article>`;
}

function lineChart(
  values,
  labels,
  { goal = 0, height = 170, unit = "тыс. ₽" } = {},
) {
  const w = 590,
    h = height,
    pad = 24,
    max = Math.max(...values, goal) * 1.15;
  const points = values.map((v, i) => [
    pad + (i * (w - pad * 2)) / (values.length - 1),
    h - 24 - (v / max) * (h - 45),
  ]);
  const line = points
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  return `<svg class="chart" role="img" aria-label="${esc(labels.map((l, i) => `${l}: ${values[i]} ${unit}`).join("; "))}" viewBox="0 0 ${w} ${h}">${[0.25, 0.5, 0.75].map((r) => `<line class="chart-grid" x1="24" y1="${h - 24 - r * (h - 45)}" x2="566" y2="${h - 24 - r * (h - 45)}"/>`).join("")}${goal ? `<line x1="24" y1="${h - 24 - (goal / max) * (h - 45)}" x2="566" y2="${h - 24 - (goal / max) * (h - 45)}" stroke="#ccd7bd" stroke-dasharray="4 5"/>` : ""}<path d="${line} L${w - pad},${h - 24} L24,${h - 24}Z" fill="#e8f1da" opacity=".65"/><path d="${line}" fill="none" stroke="#87aa60" stroke-width="2.5" stroke-linejoin="round"/>${points.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i === points.length - 1 ? 4 : 2.5}" fill="${i === points.length - 1 ? "#1e5448" : "#9dbf76"}" stroke="white" stroke-width="2"/>`).join("")}</svg><div class="chart-labels">${labels.map((l) => `<span>${esc(l)}</span>`).join("")}</div>`;
}

function field(
  title,
  name,
  value = "",
  type = "text",
  full = false,
  extra = "",
) {
  return `<label class="field ${full ? "full" : ""}">${title}<input name="${name}" type="${type}" value="${esc(value)}" ${extra}></label>`;
}

function selectField(title, name, options, value, full = false) {
  return `<label class="field ${full ? "full" : ""}">${title}<select name="${name}">${options
    .map((o) => {
      let val = Array.isArray(o) ? o[0] : o,
        label = Array.isArray(o) ? o[1] : o;
      return `<option value="${esc(val)}" ${String(val) === String(value) ? "selected" : ""}>${esc(label)}</option>`;
    })
    .join("")}</select></label>`;
}

function textField(title, name, value = "", full = true, extra = "") {
  return `<label class="field ${full ? "full" : ""}">${title}<textarea name="${name}" maxlength="2000" ${extra}>${esc(value)}</textarea></label>`;
}

function form(type, body, id = "", button = "Сохранить") {
  return `<form data-form="${type}" data-id="${esc(id)}"><div class="form-grid">${body}</div><div class="form-actions">${btn("Отмена", "close")}<button type="submit" class="btn primary">${button}</button></div></form>`;
}

export {
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
};
