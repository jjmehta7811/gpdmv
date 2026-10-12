import { canEdit, json } from "./_auth.js";
import { record } from "./_audit.js";

const KEY = "jobs";
const MAX_BYTES = 2 * 1024 * 1024; // Text only — no flyers here.

const EMPTY = { jobs: [] };

async function read(env) {
  try {
    const raw = await env.CALENDAR.get(KEY);
    if (!raw) return EMPTY;
    const data = JSON.parse(raw);
    return { jobs: Array.isArray(data.jobs) ? data.jobs : [] };
  } catch (e) {
    return EMPTY;
  }
}

// The board is public, like the calendar.
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

  if (!Array.isArray(body.jobs)) {
    return json({ error: "Jobs must be a list." }, 400);
  }

  const payload = JSON.stringify({ jobs: body.jobs });
  if (payload.length > MAX_BYTES) {
    return json({ error: "Too much text to save. Shorten a posting." }, 413);
  }

  await env.CALENDAR.put(KEY, payload);
  await record(env, request, "jobs");
  return json({ ok: true, jobs: body.jobs.length });
}
