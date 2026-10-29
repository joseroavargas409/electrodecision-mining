# Validation for the English submission release

Release: 0.11.0. Checked on 2026-10-29.

- 87 automated tests passed, including English/Spanish evidence-ID, applicability and numeric-status parity.
- TypeScript checks and the production build passed. A non-blocking client chunk-size warning remains.
- Six HTTP checks passed for the English route, version, request validation and actual model integration.
- A real English project query used NVIDIA Nemotron through Nebius Token Factory, executed both dossier tools and returned a validated structured report. This run used 8296 input tokens and 577 output tokens. Evidence: `examples/nebius/submission-en.json`.
- Default synthetic output was reproduced: 1188/1404/1782/1782 t and 0/0/0/369 overload minutes. The upgraded second shift delivered 1872 t after a 60-minute break over a 25-hour horizon.
- Source packaging excludes actual environment files, runtime state, original Git metadata and the private Sites project identity. An exact-match scan against the configured provider credential found no match in the prepared source.
- A 168-second English supporting walkthrough was rendered from direct module outputs and a saved real inference record. H.264/AAC, audio presence, full-file decoding, 31 sentence-aligned SRT cues and hashes were checked. See `media/VIDEO_VALIDATION_EN.json`. Representative frames of that earlier supporting replay were visually inspected. The final application video is documented separately below.

A clean-source installation completed successfully (691 packages). The 87 tests, TypeScript checks and full build also passed from that sanitized source copy without a provider key. GitHub CI subsequently passed for the initial public source commit 6cb1c717e5f05cd5a342270a4a48061104b38b08: https://github.com/joseroavargas409/electrodecision-mining/actions/runs/40905805275. This records that verified run, rather than assuming every later documentation commit has already completed CI. A scan for common credential patterns also found no matches.

## Verification limits

Earlier localhost browser access was denied by automatic approval review and was not used for the final capture. The final video uses the authorized public host and documented CUA screenshot sequences. The primary workflows were observed and recorded; this is not exhaustive browser regression coverage. The final MP4 is edited with cuts and holds for narration, not an uninterrupted session.

The public repository and its MIT license were verified on GitHub. The recovered current hosted demo passed HTTP and real inference verification, with 8296 input / 519 output tokens in the hosted run. The owner authorized public access, and anonymous page/API checks plus real hosted inference passed (8296 input / 551 output tokens). The public YouTube URL was subsequently verified: https://youtu.be/4UdWqLiKI8g. No Devpost submission is claimed. Operation data is synthetic and there is no site/OEM calibration or industrial validation. The source catalog is indicative and does not certify regulatory compliance.


## Hosted recovery on 2026-10-29

A fresh Sites checkout passed the 87 tests, TypeScript checks and production build. The exact pushed source was packaged and deployed through Sites. Hosted checks confirmed the English route, release, configured server secret and validated project report with both evidence tools. See `examples/nebius/recovered-host-verification.json` and `recovered-host-real-inference-en.json`. The initial private browser handoff reached ChatGPT sign-in. After the owner authorized public access, the English page and supply-upgrade selection passed targeted browser checks. The public recording subsequently covered the primary workflows and a real query; see the final-video record below.


## Final English application video

The final cut is 168 seconds at 1920×1080, 24 fps, H.264/AAC, with 31 sentence-aligned caption cues and English synthetic narration. It uses 2156 authentic captured frames spanning 73.216 seconds of captured shots, then holds for narration. Frames were checked against their capture hashes. A real query during capture visibly returned both evidence tools and 8296 input / 602 output tokens. Full-file audio/video decoding and audio presence passed; representative final frames were visually inspected. See `media/FINAL_VIDEO_VALIDATION_EN.json`, `CAPTURE_MANIFEST_EN.json` and `examples/nebius/video-inference-visible-evidence.json`. The final video is now public on YouTube; English captions were published.


## YouTube publication

YouTube Studio confirmed public publication at https://youtu.be/4UdWqLiKI8g. The title and channel were verified through anonymous oEmbed retrieval without cookies or service credentials. English (United States) SRT captions were imported and published. AI use was disclosed and the video was categorized as Science & Technology. Copyright checks reported no issues at publication time. The custom thumbnail was not uploaded because the new channel requires phone verification; a video-generated frame was used. See `media/YOUTUBE_PUBLICATION_EN.json`. No Devpost submission is claimed.
