export function createModal({ icon, esc, toast }) {
  const node = document.getElementById("modal");
  let initial = "",
    busy = false;
  const snapshot = () => {
    const f = node.querySelector("form");
    return f ? JSON.stringify([...new FormData(f)]) : "";
  };
  const dirty = () => node.open && snapshot() !== initial;
  const canLeave = () => {
    if (busy) {
      toast("Дождитесь результата отправки");
      return false;
    }
    return !dirty() || window.confirm("Закрыть без сохранения изменений?");
  };
  const closeModal = () => {
    node.close();
    initial = "";
  };
  const openModal = (title, sub, body) => {
    node.innerHTML = `<div class="modal-head"><div><h2 id="modal-title">${esc(title)}</h2>${sub ? `<p>${esc(sub)}</p>` : ""}</div><button class="icon-button" data-action="close" aria-label="Закрыть окно">${icon("close", 16)}</button></div>${body}`;
    if (!node.open) node.showModal();
    initial = snapshot();
    node.querySelector("input,textarea,select,button")?.focus();
  };
  const attemptCloseModal = () => {
    if (!canLeave()) return false;
    closeModal();
    return true;
  };
  node.addEventListener("cancel", (e) => {
    e.preventDefault();
    attemptCloseModal();
  });
  node.addEventListener("click", (e) => {
    if (e.target !== node) return;
    const r = node.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      attemptCloseModal();
  });
  window.addEventListener("beforeunload", (e) => {
    if (busy || dirty()) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
  return {
    openModal,
    closeModal,
    attemptCloseModal,
    canLeave,
    dirty,
    isBusy: () => busy,
    markClean: () => {
      initial = snapshot();
    },
    setBusy(value) {
      busy = value;
      node.setAttribute("aria-busy", String(value));
      const f = node.querySelector("form");
      if (f) f.inert = value;
      node
        .querySelectorAll(".form-actions button,.modal-head button")
        .forEach((b) => (b.disabled = value));
    },
  };
}
