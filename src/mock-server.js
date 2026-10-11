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
    if (!b || b.password !== PASSWORD) return send(res, 401, { error: "Wrong password." });
    res.setHeader("Set-Cookie", makeCookie());
    return send(res, 200, { ok: true });
  }

  if (url === "/api/calendar" && req.method === "GET") {
    return send(res, 200, Object.assign({}, store, { canEdit: canEdit(req) }));
  }

  if (url === "/api/calendar" && req.method === "PUT") {
    if (!canEdit(req)) return send(res, 401, { error: "Not signed in." });
    const b = await readBody(req);
    if (!b || !Array.isArray(b.events)) return send(res, 400, { error: "Bad request." });
    store = { events: b.events, flyers: b.flyers || {}, history: (b.history || []).slice(0, 12) };
    return send(res, 200, { ok: true, events: store.events.length });
  }

  const file = path.join(DIR, url === "/" ? "index.html" : url.replace(/^\//, ""));
  if (file.startsWith(DIR) && fs.existsSync(file) && fs.statSync(file).isFile()) {
    res.writeHead(200, { "Content-Type": file.endsWith(".html") ? "text/html; charset=utf-8" : "application/json" });
    return res.end(fs.readFileSync(file));
  }
  res.writeHead(404); res.end("not found");
}).listen(8787, () => console.log("mock server on http://127.0.0.1:8787"));
