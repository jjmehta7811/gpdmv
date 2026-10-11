// Builds the calendar in two forms from one source:
//   node build.js         -> ../gpdmv-calendar.html   (Claude artifact: carries its own data)
//   node build.js --web   -> site/index.html          (gpdmv.com: loads from /api)
const fs = require("fs");
const path = require("path");

const DIR = __dirname;
const WEB = process.argv.includes("--web");

const head = fs.readFileSync(path.join(DIR, "head.html"), "utf8");
const body = fs.readFileSync(path.join(DIR, "body.html"), "utf8");

const shell =
  '<!doctype html>\n<html lang="en">\n<head>\n' +
  '<meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
  head +
  "</head>\n<body>\n" +
  body +
  "</body>\n</html>\n";

const shellB64 = Buffer.from(shell, "utf8").toString("base64");

function readIf(file) {
  const p = path.join(DIR, file);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null;
}

const live = readIf("live-events.json");
const livePool = readIf("live-pool.json");
const history = readIf("live-history.json") || [];

// The web build ships with no data (it fetches from /api), so seed files are
// optional there; the artifact build needs them.
function readSeed(file) {
  const p = path.join(DIR, file);
  if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8"));
  if (WEB) return null;
  throw new Error("Missing " + file + " — needed for the artifact build.");
}

const seed = live || readSeed("events.json") || [];
const flyers = livePool || readSeed("flyers.json") || {};
seed.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

const slim = seed.map((ev) => {
  const copy = {};
  Object.keys(ev).forEach((k) => { if (k !== "flyer") copy[k] = ev[k]; });
  return copy;
});

const pool = {};
seed.forEach((ev) => {
  const img = ev.flyer || flyers[ev.id];
  if (img) pool[ev.id] = img;
});
history.forEach((s) => {
  (s.events || []).forEach((ev) => {
    if (!pool[ev.id] && flyers[ev.id]) pool[ev.id] = flyers[ev.id];
  });
});

const enc = (v) => JSON.stringify(v).replace(/</g, "\\u003c");

const BUILD = process.env.BUILD || "44";

function fill(src, data, poolData, hist) {
  return src
    .replace("{{TPL}}", () => shellB64)
    .replace("{{DATA}}", () => data)
    .replace("{{POOL}}", () => poolData)
    .replace("{{HIST}}", () => hist)
    .replace("{{BUILD}}", () => BUILD);
}

if (WEB) {
  // The web build ships empty and fetches its data, so the file stays small.
  const api = '<script>window.GPDMV_API = "/api";</script>\n';
  const page =
    '<!doctype html>\n<html lang="en">\n<head>\n' +
    '<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<meta name="description" content="Every GPDMV community event in one place — Gujarati Parivaar of DMV, Northern Virginia.">\n' +
    '<meta property="og:title" content="GPDMV Event Calendar">\n' +
    '<meta property="og:description" content="Every GPDMV community event in one place.">\n' +
    '<meta property="og:type" content="website">\n' +
    head +
    "</head>\n<body>\n" +
    api +
    fill(body, "[]", "{}", "[]") +
    "</body>\n</html>\n";

  const out = path.join(DIR, "..", "public", "index.html");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, page, "utf8");

  // The data the site starts with, uploaded once to KV by seed-kv.js.
  const seedOut = path.join(DIR, "..", "seed", "seed-data.json");
  fs.mkdirSync(path.dirname(seedOut), { recursive: true });
  fs.writeFileSync(
    seedOut,
    JSON.stringify({ events: slim, flyers: pool, history }),
    "utf8"
  );

  console.log(
    "web build:", (page.length / 1024).toFixed(1) + " KB page",
    "|", (JSON.stringify({ events: slim, flyers: pool, history }).length / 1024 / 1024).toFixed(2) + " MB data",
    "| events:", slim.length
  );
} else {
  const artifact = fill(head + body, enc(slim), enc(pool), enc(history));
  fs.writeFileSync(path.join(DIR, "..", "gpdmv-calendar.html"), artifact, "utf8");
  fs.writeFileSync(path.join(DIR, "preview.html"), fill(shell, enc(slim), enc(pool), enc(history)), "utf8");
  console.log(
    "artifact build:", (artifact.length / 1024).toFixed(1) + " KB",
    "| events:", slim.length,
    "| flyers:", Object.keys(pool).length,
    "| kept versions:", history.length,
    "| source:", live ? "LIVE page" : "seed files"
  );
}
