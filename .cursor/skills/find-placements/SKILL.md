---
name: find-placements
description: >
  Finds 6–12 month student placement websites and offers for Maya (University of
  Bath, International Business Management). Updates sources.md and placements.csv,
  deduplicates via seen.json, and opens a PR on scheduled runs. Use when searching
  for placements, industrial placements, year in industry, new placement boards,
  scraping placement sites, or running the weekly Maya placement search.
---

# Find placements

## When to run

- User says find / search / scrape placements, or asks for new boards or offers.
- Weekly Cursor Automation for this repo.

## Steps

### 1. Load state

Read, in this order (paths are from the repo root):

1. [`PROFILE.md`](PROFILE.md) — who Maya is and what counts as a placement
2. [`sources.md`](sources.md) — boards and career pages to search
3. [`placements.csv`](placements.csv) — already tracked offers
4. [`seen.json`](seen.json) — `{ "seen": { "<url>": { "first_seen": "YYYY-MM-DD", "kind": "offer"|"source" } } }`

### 2. Discover sources and offers

Search **public** listing pages and web search. Do not log in. Do not bypass paywalls or student portals.

Queries to mix (UK and international):

- `industrial placement 2027` / `year in industry 2027` / `placement year undergraduate`
- `stage de césure 6 mois` / `12 month internship student` / `Praktikum 12 Monate Student`
- Function terms from `PROFILE.md` plus `placement` (marketing, consulting, finance, operations, FMCG)

For each known row in `sources.md` marked **Public**, fetch or search that board for current 6–12 month student roles. For **Maya-manual** rows (MyFuture), do not scrape; you may still remind Maya to check the portal.

Also look for **new boards** and **employer career pages** that list 6–12 month student programmes. Add those URLs to `sources.md`.

### 3. Filter

Keep a role only if it matches [`PROFILE.md`](PROFILE.md):

- Student placement (not graduate scheme, not summer internship under ~6 months)
- Duration **6–12 months**
- UK or international
- Business/management-relevant unless Maya’s profile has been narrowed

If duration is missing but the title clearly says industrial placement / year in industry / placement year, keep it and set duration to `unknown (placement-type)`.

### 4. Write files

- **New boards:** append a row to `sources.md` (name, URL, region, Public or Maya-manual, why). Skip duplicate boards.
- **New offers:** append a row to `placements.csv`:

  `title,company,location,duration,deadline,url,source,first_seen`

  Use ISO dates (`YYYY-MM-DD`). Quote CSV fields that contain commas. `source` is the board name from `sources.md`.
- **Dedup:** skip any offer whose `url` is already a key in `seen.json` or already in `placements.csv`. After adding, set `seen.json` keys for every new offer URL and every new source URL.

### 5. Report and PR

Summarise:

- New source URLs added
- New offers (title, company, location, duration, deadline, URL)
- Boards that failed or need Maya to log in

On a **scheduled / cloud** run, commit on a branch and open a pull request titled `Weekly placement finds — YYYY-MM-DD` with that summary. If nothing new was found, do not open an empty PR; say so in the run output.

Interactive chats may update the same files without a PR unless the user asks for one.

## Hard limits

- Public listings only. No passwords, cookies, or session tokens.
- No aggressive crawling (cap roughly 20 offers per board per run).
- Do not apply to jobs, draft CVs, or write cover letters unless the user explicitly asks in a later workflow.
