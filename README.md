# gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/musefixi/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/musefixi/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

**Leonida Trophy Atlas** — an offline guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI. Every trophy is shown with its official name, description and grade, plus a guide in the atlas's own words (what to do, where and how, and whether it can be missed) that cites its sources: the official list on Exophase, PSNProfiles for the progress targets PlayStation tracks, and the atlas's own advice, labelled as such. It adds an eight-stage roadmap to the platinum built from the official descriptions, a missables page flagging the five trophies to plan around, a "Next up" planner driven by your own progress, and a checklist that saves in the browser (localStorage) with per-trophy counters for the counted trophies, personal notes, a spoiler shield that hides story trophies until earned, kind and grade filters, search, and export/import of your progress as a file. The app is plain static files under `app/` with no build step and makes no network request at run time — it works with the network off.

## Run it

```sh
node serve.ts
# then open http://localhost:8080 — or serve app/ with any static file server
```

To hand the entry in the way the grader does: `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts` copies `app/` and `screenshots/` to `out/` and writes `out/dossier.json`. Screenshots are retaken with `node capture.mjs`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=4yp70nzv&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
