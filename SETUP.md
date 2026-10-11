# Putting the GPDMV Event Calendar on gpdmv.com

Everything is built and tested. You need one free Cloudflare account, about
20 minutes, and your GoDaddy login.

The calendar keeps **Manage events** and **version history** on gpdmv.com.
It saves to Cloudflare's storage instead of republishing itself, and it is
protected by a password only you know.

---

## What is in this folder

| File | What it is |
|---|---|
| `index.html` | The calendar page itself (198 KB — fast to load) |
| `seed-data.json` | Your 24 events, 26 flyers and version history (4 MB) |
| `functions/api/calendar.js` | Serves the events; accepts your saves |
| `functions/api/login.js` | Checks the editor password |
| `functions/api/_auth.js` | Signs and verifies your sign-in cookie |

---

## Step 1 — Create the Cloudflare account

1. Go to **dash.cloudflare.com/sign-up** and sign up (free).
2. Verify your email.

## Step 2 — Create the storage

1. In the left sidebar: **Storage & Databases → KV**.
2. Click **Create instance**.
3. Name it exactly: `gpdmv-calendar`
4. Click **Add**.

## Step 3 — Create the site

Cloudflare's "Create an app" screen now pushes you toward Workers. You want
**Pages**, which is further down.

1. Left sidebar: **Compute (Workers) → Workers & Pages** → **Create**.
2. At the very bottom of that page, click the small link
   **"Continue to Pages"** (next to *Need to use the legacy Pages workflow?*).
3. **Connect to Git** → pick your `gpdmv-calendar` repository.
4. Build settings:
   - Framework preset: **None**
   - Build command: *(leave empty)*
   - Build output directory: `public`
5. Click **Save and Deploy**.

If you are not using GitHub, choose **Upload assets** on that same Pages
screen instead and drag in the repo contents, keeping the folder structure.

## Step 4 — Set the password and connect the storage

In your new project, go to **Settings**.

**Variables and Secrets** → Add two:

| Name | Type | Value |
|---|---|---|
| `EDITOR_PASSWORD` | Secret | *a password you choose — this is what you type to edit* |
| `EDITOR_SECRET` | Secret | *any long random string, e.g. 30 mixed characters* |

**Bindings** → Add → **KV namespace**:

| Variable name | KV namespace |
|---|---|
| `CALENDAR` | `gpdmv-calendar` |

Then **Deployments → Retry deployment** so the settings take effect.

## Step 5 — Load your events in

Your calendar will be empty until you upload the data once.

1. Go to **Storage & Databases → KV → gpdmv-calendar**.
2. Click **Add entry**.
3. Key: `calendar`
4. Value: paste the entire contents of `seed-data.json`.
5. Save.

> `seed-data.json` is 4 MB, so if pasting is slow, see
> "Loading the data with a command" at the bottom.

## Step 6 — Point gpdmv.com at it

**In Cloudflare**, in your Pages project: **Custom domains → Set up a custom
domain** → enter `gpdmv.com` → follow the prompts. Cloudflare will show you
either nameservers or DNS records.

**In GoDaddy**:

1. Sign in → **My Products** → find gpdmv.com → **DNS**.
2. If Cloudflare gave you **nameservers**: scroll to **Nameservers** →
   **Change** → **I'll use my own nameservers** → enter the two Cloudflare
   gave you → Save. (Takes up to a few hours to take effect.)
3. If Cloudflare gave you a **CNAME**: add it as a new record instead.

Also add `www.gpdmv.com` as a second custom domain in Cloudflare so both work.

---

## Using it

- **gpdmv.com** — the calendar, open to everyone.
- **gpdmv.com/#manage** — your editor. Click **Manage events**, enter your
  password once, and edit as you do now. The sign-in lasts 12 hours.

Everything else is unchanged: Add to my calendar, maps links, tap-to-call,
flyers, version history, the Bookmark button.

---

## Things worth knowing

**Cost.** Free. Cloudflare's free tier allows 100,000 reads a day; a group of
800 will use a tiny fraction.

**The Claude version keeps working.** The link pinned in WhatsApp is
untouched. Once gpdmv.com is live you can pin that instead — but then edit in
one place only, because the two do not sync. Tell me when you have switched
and I will keep them aligned.

**Password safety.** Ten wrong guesses from one address locks it for 15
minutes. The password is never stored in the page.

**If you get stuck** at any step, tell me the step number and what you see.

---

## Loading the data with a command (optional)

If pasting 4 MB into the browser is awkward, install Cloudflare's tool and run:

```
npm install -g wrangler
wrangler login
wrangler kv key put --binding=CALENDAR calendar --path=seed-data.json --remote
```
