// Session-scoped memory. Generation fences prevent late responses crossing accounts.
export function createLeadFeed({
  repository,
  onChange = () => {},
  onAccessLost = () => {},
  now = () => new Date().toISOString(),
}) {
  let epoch = 0,
    request = 0,
    inFlight = null;
  let state = {
    items: [],
    trashItems: [],
    status: "idle",
    refreshing: false,
    error: "",
    lastSuccess: null,
  };
  const emit = () => onChange(state);
  return {
    getState: () => state,
    reset() {
      epoch++;
      request++;
      inFlight = null;
      state = {
        items: [],
        trashItems: [],
        status: "idle",
        refreshing: false,
        error: "",
        lastSuccess: null,
      };
      emit();
    },
    async refresh({ trash = false } = {}) {
      if (inFlight?.trash === trash) return inFlight.promise;
      const generation = epoch,
        sequence = ++request;
      state = { ...state, refreshing: true, error: "" };
      emit();
      const promise = (async () => {
        try {
          const rows = await repository.list({ trash });
          if (generation !== epoch || sequence !== request) return;
          state = {
            ...state,
            [trash ? "trashItems" : "items"]: rows,
            status: "ready",
            refreshing: false,
            error: "",
            lastSuccess: now(),
          };
          emit();
        } catch (e) {
          if (generation !== epoch || sequence !== request) return;
          if (["unauthenticated", "forbidden"].includes(e.code)) {
            state = {
              items: [],
              trashItems: [],
              status: "error",
              refreshing: false,
              error: e.message,
              lastSuccess: null,
            };
            emit();
            onAccessLost(e);
            return;
          }
          state = {
            ...state,
            status: "error",
            refreshing: false,
            error: e.message || "Список не загружен",
          };
          emit();
        } finally {
          if (generation === epoch && sequence === request) inFlight = null;
        }
      })();
      inFlight = { trash, promise };
      return promise;
    },
    apply(record) {
      if (!record?.id || !record.updated_at)
        throw new Error(
          "Сервер вернул неполное подтверждение. Обновите список.",
        );
      request++;
      inFlight = null;
      state = {
        ...state,
        status: "ready",
        refreshing: false,
        error: "",
        items: state.items.filter((x) => x.id !== record.id),
        trashItems: state.trashItems.filter((x) => x.id !== record.id),
      };
      state[record.deleted_at ? "trashItems" : "items"].unshift(record);
      emit();
    },
    generation: () => epoch,
  };
}
