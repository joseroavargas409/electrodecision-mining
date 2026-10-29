# Completed application capture and video edit

## Final deliverable

`media/ELECTRODECISION_SUBMISSION_EN.mp4` is the final local video cut: 168 seconds, 1920×1080, H.264/AAC, English Microsoft Zira synthetic narration and burned-in captions. `CAPTIONS_EN.srt` matches this cut. Upload it publicly to YouTube using `YOUTUBE_METADATA_EN.md`.

## What was recorded

The public `/demo` application was captured through the documented CUA browser screenshot API, preserving each frame's timestamp and SHA-256 digest. No local-browser capture, injected browser script, alternate browser driver or generated replacement UI was used.

Captured workflows: default inputs; four charging alternatives; selection of the supply upgrade; animated shift playback; actual second-shift result; trolley implementation evidence; one synthetic reference declaration and its count change; reset of that declaration; a real Nemotron query; returned report; both executed evidence tools; and the public interface at the close.

The real query completed during capture. The interface showed inference/tool verification and 8296 input / 602 output tokens. `examples/nebius/video-inference-visible-evidence.json` records those visible observations. The app's downloaded project JSON contains deterministic context, review and sources, not the entire AI response.

The edit replays shots at their captured timing, then holds their final frame to make room for narration. It includes a separate editorial panel, captions and chapter cuts. It is an edited demonstration, not a single uninterrupted real-time session. The mine data is explicitly synthetic throughout.

## Re-edit or regenerate

The optional Python renderer is `scripts/media/render-submission-video.py`. Install `scripts/media/requirements.txt` in a separate Python environment. On Windows, synthesize the narration with `scripts/media/narrate.ps1 -PlanPath <SUBMISSION_SCENES_EN.json> -OutputDirectory <audio-folder>`. Render with `python scripts/media/render-submission-video.py --capture-dir <original-capture-folder> --audio-dir <audio-folder> --output-dir <output-folder>`.

The original capture folder (frames plus manifest) is retained in the author's workspace and an editing archive in the vault. It is not a provider credential or application dependency. The public source includes the capture manifest, scene plan, renderer and final MP4; recreating the exact same edit requires the original capture archive. A new capture can produce different AI output.

Keep credentials and unrelated windows out of any future capture. Use the verified public host; the earlier localhost-browser restriction remains in place and was not bypassed.
