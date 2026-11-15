// Cross-module search composes public read models. Nothing is persisted here.
export function createSearch({ ui, navigation, entries }) {
  const { openModal, esc, icon } = ui;
  function results(query) {
    const q = query.toLowerCase().trim(),
      items = [
        ...navigation.pages.map(([id, ico, title]) => ({
          id,
          ico,
          title,
          sub: "Раздел",
          action: "navigate",
        })),
        ...entries(),
      ].filter((x) => `${x.title} ${x.sub}`.toLowerCase().includes(q));
    const node = document.getElementById("search-results");
    if (node)
      node.innerHTML =
        items
          .slice(0, q ? 25 : 8)
          .map(
            (x) =>
              `<button class="search-result" data-action="${esc(x.action)}" data-id="${esc(x.id)}">${icon(x.ico, 17)}<span><b>${esc(x.title)}</b><small>${esc(x.sub)}</small></span></button>`,
          )
          .join("") || '<div class="empty">Ничего не найдено.</div>';
  }
  function open() {
    openModal(
      "Поиск по пространству",
      "Разделы и доступные записи.",
      `<input id="global-search" aria-label="Глобальный поиск" placeholder="Например: Гудермес, франшиза, ремонт…" autocomplete="off"><div class="search-results" id="search-results"></div>`,
    );
    results("");
    document
      .getElementById("global-search")
      .addEventListener("input", (e) => results(e.target.value));
  }
  return { open };
}
