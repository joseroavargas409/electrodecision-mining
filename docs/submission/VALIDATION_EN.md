# Validation for the English submission release

Release: 0.11.0. Checked on 2026-10-29.

- 87 automated tests passed, including English/Spanish evidence-ID, applicability and numeric-status parity.
- TypeScript checks and the production build passed. A non-blocking client chunk-size warning remains.
- Six HTTP checks passed for the English route, version, request validation and actual model integration.
- A real English project query used NVIDIA Nemotron through Nebius Token Factory, executed both dossier tools and returned a validated structured report. This run used 8296 input tokens and 577 output tokens. Evidence: `examples/nebius/submission-en.json`.
- Default synthetic output was reproduced: 1188/1404/1782/1782 t and 0/0/0/369 overload minutes. The upgraded second shift delivered 1872 t after a 60-minute break over a 25-hour horizon.
- Source packaging excludes actual environment files, runtime state, original Git metadata and the private Sites project identity. An exact-match scan against the configured provider credential found no match in the prepared source.
- English narration contains 306 words and is planned for a 160-second cut; SRT timing is a draft to align with actual recording.

A clean-source installation completed successfully (691 packages). The 87 tests, TypeScript checks and full build also passed from that sanitized source copy without a provider key. The supplied CI workflow has not yet run on GitHub; its presence is not a CI success claim. A scan for common credential patterns also found no matches.

## Verification limits

Automated browser access to localhost was denied by automatic approval review. Visual interaction and screen recording are not verified. The user can inspect the running English `/demo` view; the prepared script/captions do not constitute a video.

The public repository, demo and public YouTube URLs remain unverified. No Devpost submission is claimed. Operation data is synthetic and there is no site/OEM calibration or industrial validation. The source catalog is indicative and does not certify regulatory compliance.
