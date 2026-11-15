// Same public identifier mapping as bron-franchise/src/platform/login.ts.
// This is an identifier conversion, not an account or permission grant.
export function loginEmail(value) {
  const login = value.trim().toLowerCase();
  if (login.includes("@")) return login;
  if (/^[+\d\s()-]+$/.test(login)) {
    let digits = login.replace(/\D/g, "");
    if (/^8\d{10}$/.test(digits)) digits = `7${digits.slice(1)}`;
    if (/^9\d{9}$/.test(digits)) digits = `7${digits}`;
    if (digits.length < 10 || digits.length > 15)
      throw new Error("Неверный логин");
    return `${digits}@staff.bron.local`;
  }
  if (!/^[a-z][a-z0-9._-]{1,39}$/.test(login))
    throw new Error("Неверный логин");
  return `${login}@access.bron.local`;
}
