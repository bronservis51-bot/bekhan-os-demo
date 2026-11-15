export const pages = [
  ["home", "home", "Центр управления"],
  ["finance", "wallet", "Личные финансы"],
  ["crm", "handshake", "Заявки"],
  ["network", "store", "Бронь Сервис"],
  ["brand", "brand", "Личный бренд"],
  ["goals", "target", "Цели и проекты"],
  ["fitness", "gym", "Тренировки"],
  ["tasks", "tasks", "Задачи"],
];
export const moduleName = (k) =>
  pages.find((p) => p[0] === k)?.[2] || "Центр управления";
export const getPage = () =>
  location.hash.replace("#/", "").split("?")[0] || "home";
