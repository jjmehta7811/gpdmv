// A short log of sign-ins and saves.
//
// There is one editor, so this is not about attribution — it is about noticing
// activity that was not you. A sign-in from an address or country you do not
// recognise is the signal that the password has leaked.

const KEY = "audit";
const MAX = 25;

export async function record(env, request, kind) {
  try {
    const entry = {
      ts: Date.now(),
      kind: kind, // "signin" | "failed" | "save"
      ip: request.headers.get("CF-Connecting-IP") || "",
      country: (request.cf && request.cf.country) || "",
      city: (request.cf && request.cf.city) || "",
      agent: shortAgent(request.headers.get("User-Agent") || "")
    };
    const raw = await env.CALENDAR.get(KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift(entry);
    await env.CALENDAR.put(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch (e) {
    // Logging must never block a sign-in or a save.
  }
}

export async function read(env) {
  try {
    const raw = await env.CALENDAR.get(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// Just enough of the user agent to recognise your own devices.
function shortAgent(ua) {
  let os = "";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/iPhone|iPad/i.test(ua)) os = "iPhone/iPad";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Mac OS X/i.test(ua)) os = "Mac";
  else if (/Linux/i.test(ua)) os = "Linux";

  let br = "";
  if (/Edg\//i.test(ua)) br = "Edge";
  else if (/Firefox\//i.test(ua)) br = "Firefox";
  else if (/Chrome\//i.test(ua)) br = "Chrome";
  else if (/Safari\//i.test(ua)) br = "Safari";

  return [br, os].filter(Boolean).join(" on ") || "unknown";
}
