# Finish the submission video with actual application footage

## Files already prepared

- `media/ELECTRODECISION_WALKTHROUGH_EN.mp4`: 2:48 English technical walkthrough, H.264/AAC, 1280×720, with narration and burned-in captions.
- `CAPTIONS_EN.srt` and `NARRATION_EN.txt`: sentence-aligned captions and matching text for this cut.
- `media/THUMBNAIL_EN.png`: original thumbnail.
- `media/VIDEO_VALIDATION_EN.json`: full decode and audio-presence checks, hashes and provenance.

The walkthrough replays genuine calculation-module output and a saved real inference record. It does not show the actual browser application. The rules ask for footage of the project functioning on the intended device, so include that footage before submitting. Do not present the replay as a live query or a screen recording.

## Capture the remaining footage yourself

1. Start the local app and open `http://127.0.0.1:5173/demo` in your own browser, or use the verified current hosted version after deployment. Reset the default case.
2. Record the app window with your normal screen recorder. Capture comparison of the four alternatives, inspection of the upgrade row and its second shift, then the project evidence workflow and a real Nemotron question with the executed tools visible.
3. Keep the provider configuration closed. Never record `.dev.vars`, API keys, unrelated windows or private account details. Public model IDs and tool results are intended to be shown.
4. Suggested replacement sections in the prepared cut: 00:40–01:25 for comparison/continuity, and 01:46–02:17 for the actual AI workflow. Replace those portions rather than appending them, keeping the total under three minutes. Preserve the synthetic-data labels and distinguish saved inference from any new request.
5. Review narration/captions against the actual edited footage and adjust them where behavior differs. The provided SRT matches the unedited 2:48 replay; it is not automatically aligned to a different cut.
6. Export the final cut as H.264/AAC MP4, upload with Public visibility to YouTube, and verify the link without the uploader session. Follow `YOUTUBE_METADATA_EN.md`.

Automatic approval review denied browser access to localhost in the authoring environment. No alternative browser-control or screen-capture mechanism has been used to evade it. The user-made recording is the remaining input for this route.

## Rebuild the supporting walkthrough

From the source folder, run `node scripts/export-demo-video-data.mjs`. Install Python dependencies in a separate environment with `pip install -r scripts/media/requirements.txt`. On Windows, run `scripts/media/narrate.ps1 -OutputDirectory <audio-folder>`, then `python scripts/media/render-demo.py --audio-dir <audio-folder> --output-dir <video-folder>`. Narration uses the installed Microsoft Zira voice. No browser or provider call is used by the renderer. All supporting code and source data are included.
