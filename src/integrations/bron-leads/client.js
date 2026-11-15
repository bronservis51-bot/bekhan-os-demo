import { createClient } from "@supabase/supabase-js";
export class BackendError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "BackendError";
    this.code = code;
  }
}
export function toBackendError(error) {
  const message = error?.message || "",
    code = error?.code || "";
  if (message === "version-conflict")
    return new BackendError(
      "version-conflict",
      "Заявка изменена в другом окне. Скопируйте свой текст, обновите список и откройте карточку заново.",
    );
  if (message === "idempotency-conflict")
    return new BackendError(
      "idempotency-conflict",
      "Результат предыдущего создания уже изменился. Обновите список; новую копию заявки создавать не нужно.",
    );
  if (
    message === "unauthenticated" ||
    ["PGRST301", "PGRST303"].includes(code) ||
    error?.status === 401
  )
    return new BackendError(
      "unauthenticated",
      "Сессия недействительна. Войдите снова.",
    );
  if (message === "forbidden" || code === "42501" || error?.status === 403)
    return new BackendError(
      "forbidden",
      "У этой учётной записи нет доступа к заявкам. Нужны действующие права менеджера.",
    );
  if (message === "validation")
    return new BackendError(
      "validation",
      error.details || "Проверьте заполненные поля.",
    );
  if (message === "not-found")
    return new BackendError("not-found", "Заявка не найдена. Обновите список.");
  if (message === "transition-not-allowed")
    return new BackendError(
      "transition-not-allowed",
      "Заявка находится в корзине. Сначала восстановите её.",
    );
  if (
    error?.name === "AbortError" ||
    /fetch|network|load failed|timeout/i.test(message)
  )
    return new BackendError(
      "network",
      "Нет ответа сервера. Изменения не подтверждены. Проверьте связь и повторите отправку этой же формы.",
    );
  return new BackendError(
    "unavailable",
    "Не удалось получить подтверждение сервера. Проверьте связь и повторите действие.",
  );
}
export function createAuthStorage({ sessionStorage, localStorage }) {
  const preference = "bekhan-os-remember-v1";
  let remember = false;
  const memory = new Map();
  try {
    remember = localStorage?.getItem(preference) === "yes";
  } catch {}
  const selected = () => (remember ? localStorage : sessionStorage);
  return {
    getItem(key) {
      try {
        return selected()?.getItem(key) ?? memory.get(key) ?? null;
      } catch {
        return memory.get(key) ?? null;
      }
    },
    setItem(key, value) {
      memory.set(key, value);
      try {
        selected()?.setItem(key, value);
      } catch {}
    },
    removeItem(key) {
      memory.delete(key);
      for (const storage of [sessionStorage, localStorage])
        try {
          storage?.removeItem(key);
        } catch {}
    },
    setRemember(value) {
      for (const storage of [sessionStorage, localStorage])
        try {
          for (let i = storage.length - 1; i >= 0; i--) {
            const key = storage.key(i);
            if (key?.startsWith("bekhan-os-auth-v1")) storage.removeItem(key);
          }
        } catch {}
      memory.clear();
      remember = !!value;
      try {
        if (remember) localStorage?.setItem(preference, "yes");
        else localStorage?.removeItem(preference);
      } catch {}
    },
    clear() {
      for (const storage of [sessionStorage, localStorage])
        try {
          for (let i = storage.length - 1; i >= 0; i--) {
            const key = storage.key(i);
            if (key?.startsWith("bekhan-os-auth-v1")) storage.removeItem(key);
          }
        } catch {}
      memory.clear();
    },
  };
}
export function createBackend(
  config,
  { storage, fetchImpl = globalThis.fetch } = {},
) {
  const fetchWithTimeout = async (input, init = {}) => {
    const ctrl = new AbortController(),
      abort = () => ctrl.abort();
    const timer = setTimeout(abort, 20000);
    init.signal?.addEventListener("abort", abort, { once: true });
    if (init.signal?.aborted) abort();
    try {
      return await fetchImpl(input, {
        ...init,
        signal: ctrl.signal,
        cache: "no-store",
        credentials: "omit",
      });
    } finally {
      clearTimeout(timer);
      init.signal?.removeEventListener("abort", abort);
    }
  };
  const client = createClient(config.url, config.publishableKey, {
    auth: {
      storageKey: "bekhan-os-auth-v1",
      storage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
    global: { fetch: fetchWithTimeout },
  });
  return {
    client,
    async rpc(name, args = {}) {
      try {
        const result = await client.rpc(name, args);
        if (result.error) throw result.error;
        return result.data;
      } catch (error) {
        throw toBackendError(error);
      }
    },
  };
}
