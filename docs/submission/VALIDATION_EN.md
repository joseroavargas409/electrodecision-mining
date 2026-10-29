# Validation for the English submission release

Release: 0.11.0. Checked on 2026-10-29.

- 87 automated tests passed, including English/Spanish evidence-ID, applicability and numeric-status parity.
- TypeScript checks and the production build passed. A non-blocking client chunk-size warning remains.
- Six HTTP checks passed for the English route, version, request validation and actual model integration.
- A real English project query used NVIDIA Nemotron through Nebius Token Factory, executed both dossier tools and returned a validated structured report. This run used 8296 input tokens and 577 output tokens. Evidence: `examples/nebius/submission-en.json`.
- Default synthetic output was reproduced: 1188/1404/1782/1782 t and 0/0/0/369 overload minutes. The upgraded second shift delivered 1872 t after a 60-minute break over a 25-hour horizon.
- Source packaging excludes actual environment files, runtime state, original Git metadata and the private Sites project identity. An exact-match scan against the configured provider credential found no match in the prepared source.
- A 168-second English supporting walkthrough was rendered from direct module outputs and a saved real inference record. H.264/AAC, audio presence, full-file decoding, 31 sentence-aligned SRT cues and hashes were checked. See `media/VIDEO_VALIDATION_EN.json`. Representative frames were visually inspected; no browser or application-screen capture is claimed.

A clean-source installation completed successfully (691 packages). The 87 tests, TypeScript checks and full build also passed from that sanitized source copy without a provider key. GitHub CI subsequently passed for the initial public source commit 6cb1c717e5f05cd5a342270a4a48061104b38b08: https://github.com/joseroavargas409/electrodecision-mining/actions/runs/40905805275. This records that verified run, rather than assuming every later documentation commit has already completed CI. A scan for common credential patterns also found no matches.

## Verification limits

Automated browser access to localhost was denied by automatic approval review. Local browser interaction and screen recording were not verified. Targeted checks on the public hosted browser subsequently verified the English page and supply-upgrade selection; full workflow recording remains incomplete. The user can inspect and record the running English `/demo` view. A supporting module-replay video now exists; it still needs actual application footage for the submission cut.

The public repository and its MIT license were verified on GitHub. The recovered current hosted demo passed HTTP and real inference verification, with 8296 input / 519 output tokens in the hosted run. The owner authorized public access, and anonymous page/API checks plus real hosted inference passed (8296 input / 551 output tokens). The public YouTube URL remains unverified. No Devpost submission is claimed. Operation data is synthetic and there is no site/OEM calibration or industrial validation. The source catalog is indicative and does not certify regulatory compliance.


## Hosted recovery on 2026-10-29

A fresh Sites checkout passed the 87 tests, TypeScript checks and production build. The exact pushed source was packaged and deployed through Sites. Hosted checks confirmed the English route, release, configured server secret and validated project report with both evidence tools. See `examples/nebius/recovered-host-verification.json` and `recovered-host-real-inference-en.json`. The initial private browser handoff reached ChatGPT sign-in. After the owner authorized public access, the English page and supply-upgrade selection passed targeted browser checks. No full workflow or screen recording is claimed.
