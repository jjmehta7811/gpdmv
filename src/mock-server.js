// Local stand-in for Cloudflare Pages Functions, so the web build can be
// exercised end to end before it is deployed anywhere.
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DIR = path.join(__dirname, "..", "public");
const PASSWORD = "test-password";
const SECRET = "test-secret";
const COOKIE = "gpdmv_editor";

// Apply the same security headers Cloudflare Pages will send, so a policy that
// would break the page breaks it here first.
const SEC = (function () {
  const p = path.join(DIR, "_headers");
  if (!fs.existsSync(p)) return {};
  const out = {};
  let inGlobal = false;
  fs.readFileSync(p, "utf8").split(/\r?\n/).forEach(function (line) {
    if (!line.trim()) return;
    if (!/^\s/.test(line)) { inGlobal = line.trim() === "/*"; return; }
    if (!inGlobal) return;
    const i = line.indexOf(":");
    if (i > 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  });
  return out;
})();

let audit = [];
let jobStore = { jobs: [] };
let store = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "seed", "seed-data.json"), "utf8"));

function sign(v) {
  return crypto.createHmac("sha256", SECRET).update(v).digest("base64url");
}
function makeCookie() {
  const exp = String(Date.now() + 3600e3);
  return COOKIE + "=" + exp + "." + sign(exp) + "; Path=/; HttpOnly; SameSite=Strict; Max-Age=3600";
}
function canEdit(req) {
  const raw = req.headers.cookie || "";
  const hit = raw.split(/;\s*/).find((c) => c.startsWith(COOKIE + "="));
  if (!hit) return false;
  const token = hit.slice(COOKIE.length + 1);
  const dot = token.lastIndexOf(".");
  if (dot < 1) return false;
  const payload = token.slice(0, dot);
  if (Number(payload) < Date.now()) return false;
  return crypto.timingSafeEqual(Buffer.from(token.slice(dot + 1)), Buffer.from(sign(payload)));
}
function send(res, code, obj) {
  const b = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(b) });
  res.end(b);
}
function readBody(req) {
  return new Promise((resolve) => {
    let d = "";
    req.on("data", (c) => (d += c));
    req.on("end", () => { try { resolve(JSON.parse(d)); } catch (e) { resolve(null); } });
  });
}

http.createServer(async (req, res) => {
  const url = req.url.split("?")[0];

  if (url === "/api/login" && req.method === "POST") {
    const b = await readBody(req);
    if (!b || b.password !== PASSWORD) { audit.unshift({ts:Date.now(),kind:"failed",ip:"203.0.113.9",country:"US",city:"Fairfax",agent:"Firefox on Windows"}); return send(res, 401, { error: "Wrong password." }); }
    audit.unshift({ts:Date.now(),kind:"signin",ip:"203.0.113.9",country:"US",city:"Fairfax",agent:"Firefox on Windows"});
    res.setHeader("Set-Cookie", makeCookie());
    return send(res, 200, { ok: true });
  }

  if (url === "/api/calendar" && req.method === "GET") {
    const can = canEdit(req);
    return send(res, 200, Object.assign({}, store, { canEdit: can }, can ? { audit } : {}));
  }

  if (url === "/api/calendar" && req.method === "PUT") {
    if (!canEdit(req)) return send(res, 401, { error: "Not signed in." });
    const b = await readBody(req);
    if (!b || !Array.isArray(b.events)) return send(res, 400, { error: "Bad request." });
    store = { events: b.events, flyers: b.flyers || {}, history: (b.history || []).slice(0, 12) };
    audit.unshift({ts:Date.now(),kind:"save",ip:"203.0.113.9",country:"US",city:"Fairfax",agent:"Firefox on Windows"});
    return send(res, 200, { ok: true, events: store.events.length });
  }

  if (url === "/api/jobs" && req.method === "GET") {
    return send(res, 200, { jobs: jobStore.jobs, canEdit: canEdit(req) });
  }

  if (url === "/api/jobs" && req.method === "PUT") {
    if (!canEdit(req)) return send(res, 401, { error: "Not signed in." });
    const b = await readBody(req);
    if (!b || !Array.isArray(b.jobs)) return send(res, 400, { error: "Bad request." });
    jobStore = { jobs: b.jobs };
    audit.unshift({ts:Date.now(),kind:"jobs",ip:"203.0.113.9",country:"US",city:"Fairfax",agent:"Firefox on Windows"});
    return send(res, 200, { ok: true, jobs: jobStore.jobs.length });
  }

  if (url === "/calendar.ics") {
    // Run the real function so the feed is tested, not a stand-in.
    const mod = await import("../functions/calendar.ics.js");
    const env = { CALENDAR: { get: async () => JSON.stringify(store) } };
    const proxied = new Request("http://localhost" + req.url);
    const out = await mod.onRequestGet({ request: proxied, env });
    const body = await out.text();
    res.writeHead(out.status, { "Content-Type": out.headers.get("Content-Type") });
    return res.end(body);
  }

  // Mirror the _redirects rule so local testing matches the deployed site.
  // Cloudflare Pages serves /jobs from jobs.html; mirror that here.
  const asIndex = (url === "/" || /^\/(calendar|jobs)(\.html)?\/?$/.test(url));
  const file = path.join(DIR, asIndex ? "index.html" : url.replace(/^\//, ""));
  if (file.startsWith(DIR) && fs.existsSync(file) && fs.statSync(file).isFile()) {
    res.writeHead(200, Object.assign({}, SEC, {
      "Content-Type": file.endsWith(".html") ? "text/html; charset=utf-8" : "application/json"
    }));
    return res.end(fs.readFileSync(file));
  }
  res.writeHead(404); res.end("not found");
}).listen(8787, () => console.log("mock server on http://127.0.0.1:8787"));
