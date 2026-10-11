# Getting this onto GitHub

The repository is already prepared — git is set up and both commits are made.
You only need to create the empty repo on GitHub and push.

## 1. Create the empty repo

Go to **github.com/new** and set:

- Repository name: `gpdmv-calendar`
- **Private** (recommended)
- **Do not** tick "Add a README", ".gitignore" or "a license" — the repo
  already has them, and ticking those causes a conflict on the first push.

Click **Create repository**.

## 2. Push

Unzip this folder somewhere on your machine, open a terminal in it, and run:

```
git remote add origin https://github.com/jjmehta7811/gpdmv-calendar.git
git branch -M main
git push -u origin main
```

If it asks for a password, use a **personal access token**, not your GitHub
password — github.com/settings/tokens → Generate new token (classic) → tick
`repo` → copy it and paste it as the password.

> On Windows, GitHub Desktop is easier: **File → Add local repository**, pick
> this folder, then **Publish repository**.

## 3. Connect Cloudflare

Back in Cloudflare: **Workers & Pages → Create → "Continue to Pages"** (small
link at the bottom) → **Connect to Git** → choose `gpdmv-calendar`.

Build settings:

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | *(leave empty)* |
| Build output directory | `public` |

Then carry on from **Step 4** in `SETUP.md` — the password, the storage
binding, and loading the events in.

## Why bother with GitHub

Once it is connected, every change is just a commit: push it and Cloudflare
rebuilds the site by itself. Without it, each change means re-uploading files
through the dashboard by hand.

It also keeps a full history of the site, separate from the calendar's own
version history.
