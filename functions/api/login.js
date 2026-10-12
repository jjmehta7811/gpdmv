import { checkPassword, makeCookie, json } from "./_auth.js";
import { record } from "./_audit.js";

// Simple throttle so the password cannot be guessed by brute force.
// One KV counter per IP, 10 tries per 15 minutes.
const WINDOW = 15 * 60;
const LIMIT = 10;

export async function onRequestPost({ request, env }) {
  if (!env.EDITOR_PASSWORD) {
    return json({ error: "Editor password is not configured." }, 500);
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const key = "throttle:" + ip;

  let tries = 0;
  try {
    tries = Number(await env.CALENDAR.get(key)) || 0;
  } catch (e) { /* storage hiccup must not lock the owner out */ }

  if (tries >= LIMIT) {
    return json({ error: "Too many attempts. Try again in 15 minutes." }, 429);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: "Bad request." }, 400);
  }

  if (!checkPassword(body && body.password, env)) {
    try {
      await env.CALENDAR.put(key, String(tries + 1), { expirationTtl: WINDOW });
    } catch (e) { /* ignore */ }
    await record(env, request, "failed");
    return json({ error: "Wrong password." }, 401);
  }

  try { await env.CALENDAR.delete(key); } catch (e) { /* ignore */ }
  await record(env, request, "signin");

  return json({ ok: true }, 200, { "Set-Cookie": await makeCookie(env) });
}
