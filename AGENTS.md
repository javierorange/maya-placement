# Agent guidelines: Maya placements

Workspace for finding **6–12 month student placements** for Maya (University of Bath, Year 2 International Business Management). UK and international.

## Single source of truth

1. Search brief: [`PROFILE.md`](PROFILE.md)
2. Boards to search: [`sources.md`](sources.md)
3. Offers found: [`placements.csv`](placements.csv)
4. Dedup store: [`seen.json`](seen.json)
5. Workflow: [`.cursor/skills/find-placements/SKILL.md`](.cursor/skills/find-placements/SKILL.md)

Do not invent a parallel tracker. Update those files in place.

## Core loop

```
read profile + sources + seen → search public listings → filter 6–12 month student roles → append sources + offers → open PR
```

## Rules

- Placement = student job **6 months to 1 year**. Drop summer internships and graduate schemes.
- Public pages only. Never log into MyFuture or any other student portal. Never store credentials.
- New board URLs go in `sources.md`. New roles go in `placements.csv`. Every offer URL is keyed in `seen.json`.
- Weekly cloud runs should open a pull request titled `Weekly placement finds — YYYY-MM-DD`.
