# ElectroDecision — Mining Electrification Copilot

An inspectable simulator and NVIDIA Nemotron assistant for preliminary mining electrification review.

**English reviewer demo:** `/demo` · **Track:** Best Apps and Agents · **License:** MIT · **Release:** 0.11.0

The [public source repository](https://github.com/joseroavargas409/electrodecision-mining) is available with its MIT license and English submission materials. The [recovered English hosted demo](https://electrodecision-mining-recovered.jlroav409.chatgpt.site/demo) is deployed and passed real NVIDIA/Nebius HTTP verification. The owner authorized public access, and anonymous page/API access plus real hosted inference were verified. A public YouTube video is still pending. See [submission status](docs/submission/LINKS.json); do not use localhost as the final Devpost demo link.

## What you can test

- Compare four charging alternatives for a synthetic underground loader fleet, including managed/unmanaged supply.
- Follow individual battery inventory through two shifts and a finite charging break.
- Review missing project evidence by technology, implementation/operation stage and jurisdiction.
- Query NVIDIA Nemotron through Nebius Token Factory and inspect read-only tools and usage.
- Export the configuration, traces and evidence for reproducible review.

The English view uses the same engines as the Spanish workspace. Eight technology families, seven dated published cases and 21 primary references inform the evidence catalog; they are not a global project-frequency ranking.

## Quick start

Use Node.js 24 and npm. From this source directory:

```text
npm run install:ci
npm test
npm run typecheck
npm run build
npm run dev
```

Open **http://127.0.0.1:5173/demo**. On Windows use `npm.cmd` if needed. Simulation, evidence review and tests work without provider credentials. Do not install dependencies inside a cloud-sync folder if it causes file locking; use a normal local working directory.

## Live NVIDIA/Nebius integration

Copy `.dev.vars.example` to `.dev.vars`, add your own `NEBIUS_API_KEY` and supported `NEBIUS_MODEL`, then restart. The verified model is `nvidia/Nemotron-3_5-Lightning`, called through `https://api.tokenfactory.nebius.com/v1/chat/completions`. Never commit the actual configuration or place the key in browser code.

The server runs tool requests against validated local functions. The project dossier uses `assess_project_readiness`, `get_project_context` and structured ID selection; the app validates the IDs and constructs displayed claims/counts from its catalog. The shift assistant can compare scenarios and check next-shift inventory. No model training or dedicated GPU server was used.

The owner must provide free hosted judge access to live inference when supplying the final demo URL. Local setup instructions are not a claim that a hosted service has been published.

## Reproduce the synthetic example

Default first-shift tonnage: **1188 / 1404 / 1782 / 1782 t** for the four alternatives. Overload: **0 / 0 / 0 / 369 min**. With two chargers and 350 kW more supply, a 60-minute break restores initial SOC and the second shift delivers **1872 t**. Two 12-hour shifts plus the break span **25 hours**, not one day.

```text
node scripts/export-shift-lab.mjs
node scripts/export-campaign.mjs
node scripts/export-project-review.mjs
```

## Scope and limits

Synthetic inputs; no OEM/site calibration or measured industrial savings. The generic direct-charging lab does not simulate trolley/swapping, electrical power flow, idle cooling, BMS/thermal behavior or shared road/loading congestion. Other mine visualizations remain separate conceptual models. Document references are declarations; the software does not inspect documents or approve permits. The dossier's validated selection constrains report content, not professional judgment or source validity.

## Submission materials

- [Project description](docs/submission/DEVPOST_DESCRIPTION_EN.md)
- [Judge testing instructions](docs/submission/TESTING_EN.md)
- [Architecture and tool boundaries](docs/submission/ARCHITECTURE_EN.md)
- [Actual-use feedback](docs/submission/NEBIUS_FEEDBACK_EN.md)
- [Video script](docs/submission/VIDEO_SCRIPT_EN.md) and [captions](docs/submission/CAPTIONS_EN.srt)
- [Existing-work disclosure](docs/submission/RELEASE_NOTES_EN.md)
- [Publication instructions](docs/submission/DEPLOYMENT_EN.md)
- [Validation](docs/submission/VALIDATION_EN.md) and [remaining submission items](docs/submission/SUBMISSION_CHECKLIST_EN.md)

Original source is MIT-licensed; preserve dependency notices. [Source and asset notes](docs/submission/THIRD_PARTY_SOURCES_EN.md).


## English submission assets

`docs/submission/` contains form-copy fields, the project story, requirements matrix, pitch, setup and feedback. The final local video is `docs/submission/media/ELECTRODECISION_SUBMISSION_EN.mp4`: 2:48, Full HD, English narration/captions, actual public-application capture and a real NVIDIA/Nebius query recorded during capture. Its provenance, final validation and original capture hashes are included. A public YouTube upload remains pending; see `LINKS.json`.

The earlier module replay remains separate supporting material. The optional final editor is `scripts/media/render-submission-video.py`; exact re-editing requires the author's original capture folder. Rendering does not call a provider or control a browser. The application itself is reproduced through the setup instructions above.
