---
name: find-placements
description: >
  Finds 6–12 month student placement websites and offers for Maya (University of
  Bath, International Business Management). Updates sources.md, placements.csv,
  data/weeks, data/archive.json, and data/latest.json. Deduplicates via seen.json
  and pushes straight to GitHub main (no pull request) so GitHub Pages updates.
  Use when searching for placements, industrial placements, year in industry,
  new placement boards, scraping placement sites, or running the weekly Maya
  placement search.
---

# Find placements

## When to run

- User says find / search / scrape placements, or asks for new boards or offers.
- Weekly Cursor Automation for this repo (Monday). Publish by **pushing `main`**. Do not open a pull request.

## Steps

### 1. Load state

Read, in this order (paths are from the repo root):

1. [`PROFILE.md`](PROFILE.md) — who Maya is and what counts as a placement
2. [`sources.md`](sources.md) — boards and career pages to search
3. [`placements.csv`](placements.csv) — already tracked offers
4. [`data/archive.json`](data/archive.json) — weeks already published
5. [`seen.json`](seen.json) — `{ "seen": { "<url>": { "first_seen": "YYYY-MM-DD", "kind": "offer"|"source" } } }`

### 2. Discover sources and offers

Search **public** listing pages and web search. Do not log in. Do not bypass paywalls or student portals.

Queries to mix (UK and international):

- `industrial placement 2027` / `year in industry 2027` / `placement year undergraduate`
- `stage de césure 6 mois` / `12 month internship student` / `Praktikum 12 Monate Student`
- Function terms from `PROFILE.md` plus `placement` (marketing, consulting, finance, operations, FMCG)

For each known row in `sources.md` marked **Public**, fetch or search that board for current 6–12 month student roles. For **Maya-manual** rows (MyFuture), do not scrape; you may still remind Maya to check the portal.

Also look for **new boards** and **employer career pages** that list 6–12 month student programmes. Add those URLs to `sources.md`.

### 3. Filter into two lists (required)

Run **two** searches from the same public boards, then rank each independently. Maya’s digest shows them as **two lists**.

1. **All companies** — same placement filter as below; **no** employee cap.
2. **Under 20,000 employees** — same placement filter, then drop group/parent headcount **above 20,000**. If headcount cannot be checked, do **not** put the role on this list (it may still sit on All companies).

Keep a role only if it matches [`PROFILE.md`](PROFILE.md):

- Student placement (not graduate scheme, not summer internship under ~6 months)
- Duration **6–12 months**
- UK or international
- Business/management-relevant unless Maya’s profile has been narrowed

If duration is missing but the title clearly says industrial placement / year in industry / placement year, keep it and set duration to `unknown (placement-type)`.

**Top 20:** after link check, rank each list (prefer 9–12 months; marketing / consulting / commercial / strategy; open applications or a deadline in the next ~45 days; 2027 start; official employer page) and **keep at most 20**. Deduplicate by URL *within* a list. The same URL may appear on both lists if it qualifies for the size cap.

Set `employee_cap` on each offer: `over_20k` | `under_20k`. The weekly digest is a ranked snapshot — previously seen URLs may reappear if they still rank in the top 20. Still append a `placements.csv` / `seen.json` row the first time a URL appears.

### 3b. Verify every URL (required)

Do **not** guess company homepages such as `/careers/students/`. Prefer the specific programme or vacancy URL from search results.

For each candidate offer and new source URL:

1. Draft [`data/latest.json`](data/latest.json), then run `python3 tools/check_links.py --write` (or GET the URL yourself, follow redirects).
2. Keep the listing only if the final response is **HTTP 200** and the body is not a soft 404 (“page not found”, “this page doesn’t exist”).
3. If the URL is 404/410/dead: search for a replacement official page. If none, **drop the offer**.
4. If the URL is 401/403 (bot wall): do not publish it as “Open listing”. Find another public URL that returns 200, or drop it.
5. Store `link.status` (`ok` | `dead` | `blocked`), `http_status`, `final_url`, `checked_at` on each offer/source.

A 200 homepage that does not mention the placement is not good enough — the URL must be the programme or job page Maya would open.

### 4. Write files

Let `WEEK` be today’s date (`YYYY-MM-DD`).

- **New boards:** append a row to `sources.md`. Skip duplicate boards.
- **New offers:** append a row to `placements.csv`:

  `title,company,location,duration,deadline,url,source,first_seen`

  Use ISO dates (`YYYY-MM-DD`). Quote CSV fields that contain commas. `source` is the board name from `sources.md`.
- **Week payload:** write the run JSON (after link check) to **all** of:

  - [`data/latest.json`](data/latest.json)
  - [`data/weeks/WEEK.json`](data/weeks/) (same contents)

  Shape: `generated_at`, `week_of` (= `WEEK`), `candidate`, `is_example` (**false** for live runs), `summary` (`new_offers_all`, `new_offers_midsize`, `new_offers` = `new_offers_all` for older chips, `new_sources`, `dropped`, `maya_check`), `sources_added`, `lists` (`all` and `midsize`, each with `id`, `title`, `blurb`, `employee_cap`, `offers`), plus `offers` as a copy of `lists.all.offers` so older tooling still works (plus `link` on each URL). Each offer has `employee_cap`: `over_20k` | `under_20k`.
- **Archive:** prepend `{ "week_of": WEEK, "new_offers", "new_offers_all", "new_offers_midsize", "new_sources", "label": "Live week" }` on [`data/archive.json`](data/archive.json) `weeks` array, **newest first**. Do not duplicate `week_of`.
- **Dedup:** `seen.json` / `placements.csv` still skip *first-seen* duplicates. The weekly digest is a ranked snapshot, so a URL already in `seen.json` **may** reappear on this week’s lists if it still ranks in the top 20. After adding, set `seen.json` keys for every newly tracked offer URL and every new source URL.

Do not put emails, student IDs, or extra profile notes into the JSON Maya’s public Pages site serves.

### 5. Report and push `main`

Summarise:

- New source URLs added
- All-companies top 20 and under-20k top 20 (title, company, location, duration, deadline, URL)
- Boards that failed or need Maya to log in

Then **commit on `main` and `git push origin main`** (GitHub). Do **not** open a pull request. GitHub Pages rebuilds; Maya’s bookmark updates.

If nothing new was found, still write the week file (empty offers is OK) or skip the push and say so — do not invent listings.

Interactive chats follow the same write + push-to-main path unless the user asks not to push.

## Hard limits

- Public listings only. No passwords, cookies, or session tokens.
- No aggressive crawling (cap roughly 20 offers **per list** after ranking, and roughly 20 candidates per board while searching).
- Never publish an **Open listing** URL that fails `python3 tools/check_links.py` (must be HTTP 200, not a soft 404). Guessed `/careers/students/` homepages are not allowed.
- Never open a pull request for weekly digest updates.
- Do not apply to jobs, draft CVs, or write cover letters unless the user explicitly asks in a later workflow.
