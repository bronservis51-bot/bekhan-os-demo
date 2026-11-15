export function createSettingsModule({ ui, workspace, connection }) {
  const { head, btn, icon, pill, esc, openModal, closeModal, toast } = ui;
  function render() {
    return (
      head(
        "Настройки",
        "Рабочая CRM и локальные примеры остальных разделов.",
        "",
        "BEKHAN OS",
      ) +
      `<div class="two-col"><div class="stack"><section class="card"><div class="card-title"><h2>CRM франшизы</h2>${pill("Подключена")}</div><p>Заявки с bronservis.ru читаются из той же базы, что в приложении франшизы. Отправка с лендинга не изменена.</p><p class="sim-note">${connection.profile() ? `Вход выполнен: ${esc(connection.profile().name)}` : "Для рабочих заявок войдите с существующей учётной записью менеджера."}</p><div class="actions section-gap"><a class="btn primary" href="#/crm">Открыть рабочую CRM</a><a class="btn" href="#/crm/demo">Демонстрация</a></div><p class="sim-note">Изменение статуса, заметки и корзины общее для двух интерфейсов. Рабочие заявки не входят в экспорт примера или сводку ChatGPT.</p></section><section class="card"><h2>Остальные разделы</h2><p class="sim-note">Финансы, задачи, сеть, цели, контент и тренировки пока работают с демонстрационными данными этого браузера. Между устройствами они не синхронизируются. Их серверное подключение — отдельный этап.</p><div class="settings-row"><div><h3>Экспорт примера</h3><p>Только локальные демонстрационные записи, без рабочих заявок и сессий.</p></div>${btn("Экспорт", "export", "download", "small")}</div><div class="settings-row"><div><h3>Сбросить пример</h3><p>Сброс не затронет рабочую CRM и приложение франшизы.</p></div>${btn("Сбросить", "reset", "reset", "small danger")}</div></section><section class="card"><h2>Сводка для ChatGPT</h2><p class="sim-note">Копируется пример данных остальных разделов. Рабочие контакты клиентов в сводку не добавляются. Сайт ничего не отправляет в ChatGPT.</p><div class="actions section-gap">${btn("Скопировать сводку", "copy-brief", "download", "small")}</div></section></div><div class="stack"><section class="card"><h2>Поддержка и обновления</h2><p class="sim-note">Заявки автоматически обновляются раз в 30 секунд при открытой CRM и при возврате на вкладку. При сетевом сбое показывается ошибка и время последнего успешного чтения; запись подтверждает сервер.</p><p class="sim-note">Если карточку уже изменили в другом приложении, новая запись не затрёт её: появится сообщение о конфликте. Скопируйте свой текст и откройте актуальную карточку.</p></section><section class="card"><h2>Подключение</h2><div class="balance-row"><span>Источник</span><strong>api.bronservis.ru</strong></div><div class="balance-row"><span>Вход</span><strong>Учётная запись франшизы</strong></div><div class="balance-row"><span>Новая база</span><strong>Не создавалась</strong></div><p class="sim-note">Лендинг, существующее приложение и их настройки не изменены. Новый интерфейс использует действующие серверные права.</p></section></div></div>`
    );
  }
  return {
    id: "settings",
    render,
    actions: {
      export: () => {
        const blob = new Blob(
            [
              JSON.stringify(
                {
                  exportedAt: new Date().toISOString(),
                  demo: true,
                  ...workspace.snapshot(),
                },
                null,
                2,
              ),
            ],
            { type: "application/json" },
          ),
          url = URL.createObjectURL(blob),
          link = document.createElement("a");
        link.href = url;
        link.download = "bekhan-os-demo.json";
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast("Экспорт примера скачан");
      },
      reset: () =>
        openModal(
          "Вернуть исходный пример?",
          "Рабочие заявки не изменятся.",
          `<p class="sim-note">Локальные демонстрационные изменения будут заменены. При необходимости сначала скачайте экспорт.</p><div class="form-actions">${btn("Отмена", "close")}${btn("Сбросить пример", "confirm-reset", "reset", "primary")}</div>`,
        ),
      "confirm-reset": () => {
        const ok = workspace.reset();
        closeModal();
        connection.render();
        if (ok) toast("Пример восстановлен. Рабочая CRM не изменена.");
      },
    },
  };
}
