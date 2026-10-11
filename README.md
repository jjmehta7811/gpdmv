# GPDMV Event Calendar

The community event calendar for Gujarati Parivaar of DMV, served at
**gpdmv.com**.

Anyone can read it. Only the editor, holding the password, can change it.

## How it fits together

| Piece | What it does |
|---|---|
| `public/index.html` | The calendar page. Ships with no data and loads it from the API. |
| `functions/api/calendar.js` | `GET` returns the events; `PUT` saves them (editor only). |
| `functions/api/login.js` | Checks the editor password, sets a signed 12-hour cookie. |
| `functions/api/_auth.js` | Signs and verifies that cookie. |
| `seed/seed-data.json` | One-time starting data. Not served to the public. |
| `src/` | Sources the page is built from, plus a local mock server. |

## Cloudflare settings this needs

**Secrets** (Settings → Variables and Secrets)

- `EDITOR_PASSWORD` — what you type to edit the calendar
- `EDITOR_SECRET` — any long random string, used to sign the sign-in cookie

**Binding** (Settings → Bindings → KV namespace)

- Variable name `CALENDAR` → namespace `gpdmv-calendar`

**Build settings**

- Build command: *(leave empty)*
- Build output directory: `public`

Neither secret is in this repository, and neither ever reaches the browser.

## Editing the calendar

Go to **gpdmv.com/#manage**, click **Manage events**, enter the password once.
Add, edit and delete events; every save keeps a restorable copy of the previous
version, twelve deep.

## Working on the code

```bash
cd src
node build.js --web     # rebuilds ../public/index.html
node mock-server.js     # serves the site at http://127.0.0.1:8787 with a fake API
```

The mock server's test password is `test-password`.

`node build.js` with no flag builds the Claude artifact version instead — the
same page, carrying its own data.
