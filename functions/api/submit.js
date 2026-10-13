import { canEdit, json } from "./_auth.js";

// Business listing requests from the public form.
//
// Every submission is stored first and emailed second, so a listing is never
// lost because an email provider had a bad day. The editor reviews them in
// Manage directory; nothing reaches the directory without being approved.

const KEY = "submissions";
const MAX_KEEP = 200;
const WINDOW = 60 * 60;   // one hour
const LIMIT = 5;          // per IP, per hour

const FIELDS = [
  "person", "name", "type", "email", "hours", "phone", "address",
  "website", "social", "offer", "area", "notes", "waPhone"
];

function clean(v, max) {
  return String(v == null ? "" : v).replace(/\s+/g, " ").trim().slice(0, max || 300);
}

async function read(env) {
  try {
    const raw = await env.CALENDAR.get(KEY);
    if (!raw) return [];
    const d = JSON.parse(raw);
    return Array.isArray(d.submissions) ? d.submissions : [];
  } catch (e) {
    return [];
  }
}

async function write(env, list) {
  await env.CALENDAR.put(KEY, JSON.stringify({ submissions: list.slice(0, MAX_KEEP) }));
}

// Optional. Set RESEND_API_KEY and SUBMIT_TO to be emailed each submission;
// without them the form still works and the entry still waits in Manage.
async function notify(env, rec) {
  if (!env.RESEND_API_KEY || !env.SUBMIT_TO) return;
  const lines = [
    ["Member", rec.person],
    ["Business", rec.name],
    ["What they do", rec.type],
    ["Phone", rec.phone],
    ["Email", rec.email],
    ["Website", rec.website],
    ["Social", rec.social],
    ["Address", rec.address],
    ["Serves", rec.area],
    ["Hours", rec.hours],
    ["Community offer", rec.offer],
    ["WhatsApp number", rec.waPhone],
    ["Notes", rec.notes]
  ].filter((p) => p[1]).map((p) => p[0] + ": " + p[1]);

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + env.RESEND_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: env.SUBMIT_FROM || "GPDMV website <noreply@gpdmv.com>",
        to: [env.SUBMIT_TO],
        subject: "New business listing: " + (rec.name || "unnamed"),
        text: lines.join("\n") + "\n\nReview and publish it at https://gpdmv.com/directory#manage"
      })
    });
  } catch (e) { /* the submission is already saved; email is a convenience */ }
}

// Anyone may submit; nothing they send is published by submitting it.
export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: "Bad request." }, 400);
  }

  // A field no person can see and every crude bot fills in.
  if (clean(body.company)) return json({ ok: true });

  const rec = {};
  FIELDS.forEach(function (f) {
    rec[f] = clean(body[f], f === "notes" ? 2000 : 300);
  });

  if (!rec.name || !rec.person || !rec.phone) {
    return json({ error: "Your name, the business name and a phone number are needed." }, 400);
  }
  if (!body.member || !body.consent) {
    return json({ error: "Both tick boxes are needed before this can be sent." }, 400);
  }

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const throttle = "submit:" + ip;
  let tries = 0;
  try {
    tries = Number(await env.CALENDAR.get(throttle)) || 0;
  } catch (e) { /* a storage hiccup must not block a member */ }
  if (tries >= LIMIT) {
    return json({ error: "That's several already. Try again in an hour, or call 214-463-7811." }, 429);
  }

  rec.id = "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  rec.at = new Date().toISOString();
  rec.from = (request.cf && request.cf.city ? request.cf.city + ", " : "") +
             (request.cf && request.cf.country ? request.cf.country : "");

  const list = await read(env);
  list.unshift(rec);
  await write(env, list);

  try {
    await env.CALENDAR.put(throttle, String(tries + 1), { expirationTtl: WINDOW });
  } catch (e) { /* ignore */ }

  await notify(env, rec);

  return json({ ok: true });
}

// The details are for the editor only. Everyone else gets the number waiting
// and nothing else, so a reminder can be built on it without the password.
export async function onRequestGet({ request, env }) {
  const list = await read(env);
  if (!(await canEdit(request, env))) return json({ waiting: list.length });
  return json({ submissions: list, waiting: list.length });
}

// Used to clear one once it has been added or turned down.
export async function onRequestPut({ request, env }) {
  if (!(await canEdit(request, env))) return json({ error: "Not signed in." }, 401);
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: "Bad request." }, 400);
  }
  if (!Array.isArray(body.submissions)) return json({ error: "Bad request." }, 400);
  await write(env, body.submissions);
  return json({ ok: true, submissions: body.submissions.length });
}
