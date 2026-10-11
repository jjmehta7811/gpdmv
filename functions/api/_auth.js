// Shared sign-in helpers.
//
// The editor password never reaches the browser. The browser posts the password
// once; the server checks it and hands back a signed, expiring cookie. Every
// later write re-verifies that signature, so a stolen cookie dies on its own and
// nobody can forge one without the secret.

const COOKIE = "gpdmv_editor";
const MAX_AGE = 60 * 60 * 12; // 12 hours

function b64url(bytes) {
  let s = "";
  const a = new Uint8Array(bytes);
  for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return b64url(sig);
}

// Constant-time compare, so timing never leaks how much of a guess was right.
function same(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function makeCookie(env) {
  const expires = Date.now() + MAX_AGE * 1000;
  const payload = String(expires);
  const sig = await sign(payload, env.EDITOR_SECRET || env.EDITOR_PASSWORD);
  const token = payload + "." + sig;
  return (
    COOKIE + "=" + token +
    "; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=" + MAX_AGE
  );
}

export async function canEdit(request, env) {
  const raw = request.headers.get("Cookie") || "";
  const hit = raw.split(/;\s*/).find((c) => c.startsWith(COOKIE + "="));
  if (!hit) return false;

  const token = hit.slice(COOKIE.length + 1);
  const dot = token.lastIndexOf(".");
  if (dot < 1) return false;

  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expires = Number(payload);
  if (!Number.isFinite(expires) || expires < Date.now()) return false;

  const expected = await sign(payload, env.EDITOR_SECRET || env.EDITOR_PASSWORD);
  return same(sig, expected);
}

export function checkPassword(given, env) {
  const real = env.EDITOR_PASSWORD;
  if (!real) return false;
  return same(String(given || ""), String(real));
}

export function json(body, status, extraHeaders) {
  const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
  if (extraHeaders) Object.assign(headers, extraHeaders);
  return new Response(JSON.stringify(body), { status: status || 200, headers });
}
