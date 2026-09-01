# Maya placements

Search workspace for **6–12 month student placements** for Maya (University of Bath, Year 2 International Business Management). UK and international.

Maya’s bookmark (after GitHub Pages is on):

**https://javierorange.github.io/maya-placement/**

That page shows this week’s digest and an archive of older weeks (newest first). She does not need a GitHub account.

## Files

| File | Purpose |
| --- | --- |
| [`PROFILE.md`](PROFILE.md) | Who Maya is and what counts as a placement (not shown on Pages) |
| [`sources.md`](sources.md) | Websites (URLs) to search for new offers |
| [`placements.csv`](placements.csv) | Running log of all offers |
| [`data/latest.json`](data/latest.json) | Current week (copy of the latest week file) |
| [`data/weeks/`](data/weeks/) | One JSON file per week |
| [`data/archive.json`](data/archive.json) | Week index, newest first |
| [`ui/index.html`](ui/index.html) | Digest Maya opens |
| [`seen.json`](seen.json) | Dedup store so weekly runs only add new URLs |
| [`AGENTS.md`](AGENTS.md) | Instructions for Cursor agents |

## Local preview

From the repo root:

```bash
python3 -m http.server 8765
```

Open [http://localhost:8765/](http://localhost:8765/) (redirects to `/ui/`).

Before publishing a week, verify listings:

```bash
python3 tools/check_links.py --write
```

Dead or blocked URLs must be replaced or dropped. The UI only enables **Open listing** when `link.status` is `ok`.

## GitHub Pages

The public site is built from **`main` at repo root** (not `/docs`).

1. Create a **public** GitHub repo named `maya-placement`.
2. Push `main`.
3. Settings → Pages: Deploy from a branch, branch `main`, folder `/ (root)`.
4. After a minute, open `https://<user>.github.io/maya-placement/`.

The repo is public (required for free user Pages). Do not commit emails or student IDs. Weekly updates **push `main`**; there is no pull-request step.

## How to use

Ask Cursor to **find placements** (or wait for the Monday automation). The agent searches public boards, writes `data/weeks/{date}.json`, updates the archive, and pushes `main`. GitHub Pages rebuilds; Maya refreshes her bookmark.

MyFuture requires Maya’s Bath login — the agent lists it but does not sign in.

Peak season for 2027 placement years is autumn of Year 2 (from September 2026).
