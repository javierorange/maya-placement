# Agent guidelines: Maya placements

Workspace for finding **6–12 month student placements** for Maya (University of Bath, Year 2 International Business Management). UK and international.

## Single source of truth

1. Search brief: [`PROFILE.md`](PROFILE.md)
2. Boards to search: [`sources.md`](sources.md)
3. Offers found: [`placements.csv`](placements.csv)
4. This week: [`data/latest.json`](data/latest.json) (copy of the current week file)
5. Week archive: [`data/weeks/`](data/weeks/) plus [`data/archive.json`](data/archive.json)
6. Dedup store: [`seen.json`](seen.json)
7. Workflow: [`.cursor/skills/find-placements/SKILL.md`](.cursor/skills/find-placements/SKILL.md)

Do not invent a parallel tracker. Update those files in place. Maya’s public digest is [`ui/index.html`](ui/index.html) on GitHub Pages.

## Core loop

```
read profile + sources + seen → search public listings → filter 6–12 month student roles → check links → write week JSON + archive → push main
```

## Rules

- Placement = student job **6 months to 1 year**. Drop summer internships and graduate schemes.
- Public pages only. Never log into MyFuture or any other student portal. Never store credentials.
- New board URLs go in `sources.md`. New roles go in `placements.csv` and `data/weeks/{date}.json`. Every offer URL is keyed in `seen.json`.
- Every **Open listing** URL must pass `python3 tools/check_links.py` (HTTP 200, not a 404/soft-404). Drop or replace failures before showing them in the UI.
- Weekly runs **push `main`**. Do not open a pull request.
