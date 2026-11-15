import { BackendError } from "./client.js";
import { loginEmail } from "./login.js";
export function createAuthService({ backend, storage }) {
  let state = { status: "loading", profile: null, error: "" },
    generation = 0,
    loading = null;
  const listeners = new Set();
  const emit = () => listeners.forEach((fn) => fn(state));
  const clear = () => {
    generation++;
    state = { status: "signed-out", profile: null, error: "" };
    emit();
  };
  async function loadProfile() {
    if (loading?.epoch === generation) return loading.promise;
    const epoch = generation;
    const promise = (async () => {
      const me = await backend.rpc("me");
      if (epoch !== generation) return;
      if (
        !me?.user?.id ||
        !me.assignments?.some((a) => a.permissions?.includes("org.manage"))
      )
        throw new BackendError(
          "forbidden",
          "Доступ к CRM есть только у действующей учётной записи с правами менеджера.",
        );
      state = {
        status: "signed-in",
        profile: { id: me.user.id, name: me.user.full_name },
        error: "",
      };
      emit();
    })().finally(() => {
      if (loading?.epoch === epoch) loading = null;
    });
    loading = { epoch, promise };
    return promise;
  }
  const subscription = backend.client.auth.onAuthStateChange(
    (event, session) => {
      if (event === "SIGNED_OUT") {
        clear();
        return;
      }
      if (
        event === "TOKEN_REFRESHED" &&
        session &&
        state.status === "signed-in"
      ) {
        const refreshEpoch = generation;
        setTimeout(() => {
          if (refreshEpoch !== generation) return;
          void loadProfile().catch((e) => {
            if (
              refreshEpoch === generation &&
              (e.code === "unauthenticated" || e.code === "forbidden")
            )
              clear();
          });
        }, 0);
      }
    },
  );
  return {
    getState: () => state,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    async start() {
      try {
        const { data, error } = await backend.client.auth.getSession();
        if (error) throw error;
        if (data.session) await loadProfile();
        else clear();
      } catch (e) {
        clear();
        state.error = e.message || "Проверка входа не удалась";
        emit();
      }
    },
    async signIn(email, password, remember = false) {
      storage?.setRemember(remember);
      generation++;
      const loginEpoch = generation;
      state = { status: "loading", profile: null, error: "" };
      emit();
      try {
        const { error } = await backend.client.auth.signInWithPassword({
          email: loginEmail(email),
          password,
        });
        if (error)
          throw new BackendError(
            "login",
            "Вход не выполнен. Проверьте почту, пароль и соединение.",
          );
        if (loginEpoch !== generation)
          throw new BackendError(
            "unauthenticated",
            "Вход отменён. Повторите вход.",
          );
        await loadProfile();
      } catch (e) {
        if (loginEpoch === generation) {
          clear();
          storage?.clear();
          state.error = e.message;
          emit();
        }
        throw e;
      }
    },
    async signOut() {
      clear();
      const logoutEpoch = generation;
      storage?.clear();
      try {
        await backend.client.auth.signOut({ scope: "local" });
      } finally {
        if (generation === logoutEpoch) {
          clear();
          storage?.clear();
        }
      }
    },
    invalidate(message = "") {
      clear();
      storage?.clear();
      state.error = message;
      emit();
    },
    destroy() {
      subscription.data.subscription.unsubscribe();
      listeners.clear();
    },
  };
}
