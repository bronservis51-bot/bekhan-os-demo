// Public client configuration verified against the deployed bronservis.ru form.
// One database, two authorized interfaces. There is no second landing receiver.
export function validateBackendConfig(config) {
  const url = new URL(config.url);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error("Invalid backend URL");
  const key = config.publishableKey;
  let role = "";
  try {
    role =
      JSON.parse(
        atob((key.split(".")[1] || "").replace(/-/g, "+").replace(/_/g, "/")),
      ).role || "";
  } catch {}
  if (
    typeof key !== "string" ||
    (!key.startsWith("sb_publishable_") && role !== "anon")
  )
    throw new Error("Only public API keys are allowed");
  return Object.freeze({ ...config, url: url.origin });
}
