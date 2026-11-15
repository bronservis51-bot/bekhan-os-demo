export function createToast() {
  let timer;
  return (message) => {
    const node = document.getElementById("toast");
    node.textContent = message;
    node.classList.add("show");
    clearTimeout(timer);
    timer = setTimeout(() => node.classList.remove("show"), 4000);
  };
}
