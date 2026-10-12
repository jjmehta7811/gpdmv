// The subscribable calendar feed.
//
// A member subscribes once; their phone re-reads this every few hours, so
// events Ram adds, edits or deletes keep themselves correct without anyone
// doing anything. ?cat=garba narrows it to one category.

const KEY = "calendar";

const CAT_LABEL = {
  garba: "Garba & Raas",
  temple: "Temple & Spiritual",
  shopping: "Shopping & Expo",
  community: "Community & Culture",
  food: "Food & Dining",
  youth: "Youth & Kids",
  meetup: "Meetups"
};

// Events saved under the earlier scheme still land in the right feed.
const CAT_ALIAS = { puja: "temple", social: "community", meeting: "meetup", sports: "meetup" };

const norm = (c) => (CAT_LABEL[c] ? c : CAT_ALIAS[c] || "community");

// RFC 5545: escape, then fold every line to 75 octets.
function esc(v) {
  return String(v == null ? "" : v)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function fold(line) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out = [];
  let cur = "";
  let len = 0;
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length;
    if (len + n > (out.length ? 74 : 75)) { out.push(cur); cur = ""; len = 0; }
    cur += ch; len += n;
  }
  if (cur) out.push(cur);
  return out.join("\r\n ");
}

const stampNow = () => new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

// All-day events: DTEND is exclusive, so a one-day event ends the next day.
function dayAfter(iso) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const wanted = (url.searchParams.get("cat") || "").toLowerCase().trim();
  const only = wanted && CAT_LABEL[wanted] ? wanted : null;

  let events = [];
  try {
    const raw = await env.CALENDAR.get(KEY);
    if (raw) events = JSON.parse(raw).events || [];
  } catch (e) { /* an empty calendar is better than an error page */ }

  events = events
    .filter((e) => e && e.date)
    .filter((e) => (only ? norm(e.category) === only : true))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const name = only ? "GPDMV — " + CAT_LABEL[only] : "GPDMV Events";
  const now = stampNow();

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GPDMV//Event Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:" + esc(name),
    "X-WR-CALDESC:" + esc("Gujarati Parivaar of DMV — community events. gpdmv.com"),
    "X-WR-TIMEZONE:America/New_York",
    // Ask subscribers to re-read every 4 hours.
    "REFRESH-INTERVAL;VALUE=DURATION:PT4H",
    "X-PUBLISHED-TTL:PT4H"
  ];

  for (const e of events) {
    // Times are free text ("7:30 PM till late"), so these are all-day entries
    // with the time spelled out where people will read it.
    const end = e.endDate && e.endDate >= e.date ? e.endDate : e.date;
    const where = [e.venue, e.address].filter(Boolean).join(", ");
    const said = [
      e.time ? "Time: " + e.time : "",
      e.contact ? "Contact: " + e.contact : "",
      e.details || ""
    ].filter(Boolean).join("\n");
    const body = (said ? said + "\n\n" : "") + "Full details: https://gpdmv.com/calendar";

    lines.push(
      "BEGIN:VEVENT",
      "UID:" + esc(e.id || e.date) + "@gpdmv.com",
      "DTSTAMP:" + now,
      "DTSTART;VALUE=DATE:" + e.date.replace(/-/g, ""),
      "DTEND;VALUE=DATE:" + dayAfter(end),
      "SUMMARY:" + esc(e.time ? e.title + " · " + e.time : e.title),
      where ? "LOCATION:" + esc(where) : "",
      "DESCRIPTION:" + esc(body),
      "CATEGORIES:" + esc(CAT_LABEL[norm(e.category)]),
      "URL:https://gpdmv.com/calendar",
      "TRANSP:TRANSPARENT",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");

  const ics = lines.filter(Boolean).map(fold).join("\r\n") + "\r\n";

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="gpdmv.ics"',
      // Short cache: new events should surface the next time a phone looks.
      "Cache-Control": "public, max-age=900",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
