import { canEdit, json } from "./_auth.js";
import { record, read as readAudit } from "./_audit.js";

const KEY = "calendar";
const MAX_BYTES = 20 * 1024 * 1024; // KV ceiling is 25MB; stay clear of it.

const EMPTY = { events: [], flyers: {}, history: [] };

async function read(env) {
  try {
    const raw = await env.CALENDAR.get(KEY);
    if (!raw) return EMPTY;
    const data = JSON.parse(raw);
    return {
      events: Array.isArray(data.events) ? data.events : [],
      flyers: data.flyers && typeof data.flyers === "object" ? data.flyers : {},
      history: Array.isArray(data.history) ? data.history : []
    };
  } catch (e) {
    return EMPTY;
  }
}

// Anyone may read the calendar — it is a public noticeboard.
export async function onRequestGet({ request, env }) {
  const data = await read(env);
  data.canEdit = await canEdit(request, env);
  // The activity log is for the editor only; it carries IP addresses.
  if (data.canEdit) data.audit = await readAudit(env);
  return json(data);
}

// Only a signed-in editor may write it.
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

  if (!Array.isArray(body.events)) {
    return json({ error: "Events must be a list." }, 400);
  }

  const next = {
    events: body.events,
    flyers: body.flyers && typeof body.flyers === "object" ? body.flyers : {},
    history: Array.isArray(body.history) ? body.history.slice(0, 12) : []
  };

  const payload = JSON.stringify(next);
  if (payload.length > MAX_BYTES) {
    return json({ error: "Calendar is too large to save. Remove an old flyer." }, 413);
  }

  await env.CALENDAR.put(KEY, payload);
  await record(env, request, "save");
  return json({ ok: true, events: next.events.length });
}
