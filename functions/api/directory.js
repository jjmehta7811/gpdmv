import { canEdit, json } from "./_auth.js";
import { record } from "./_audit.js";

const KEY = "directory";
const MAX_BYTES = 2 * 1024 * 1024; // Text only.

const EMPTY = { businesses: [] };

async function read(env) {
  try {
    const raw = await env.CALENDAR.get(KEY);
    if (!raw) return EMPTY;
    const data = JSON.parse(raw);
    return { businesses: Array.isArray(data.businesses) ? data.businesses : [] };
  } catch (e) {
    return EMPTY;
  }
}

// The directory is public — that is the point of it.
export async function onRequestGet({ request, env }) {
  const data = await read(env);
  data.canEdit = await canEdit(request, env);
  return json(data);
}

export async function onRequestPut({ request, env }) {
  if (!(await canEdit(request, env))) {
    return json({ error: "Not signed in." }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: "Bad request." }, 400);
  }

  if (!Array.isArray(body.businesses)) {
    return json({ error: "Businesses must be a list." }, 400);
  }

  const payload = JSON.stringify({ businesses: body.businesses });
  if (payload.length > MAX_BYTES) {
    return json({ error: "Too much text to save. Shorten an entry." }, 413);
  }

  await env.CALENDAR.put(KEY, payload);
  await record(env, request, "directory");
  return json({ ok: true, businesses: body.businesses.length });
}
