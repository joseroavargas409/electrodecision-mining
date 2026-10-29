# Publication and judge access

## Current state

The latest app runs locally. The previously hosted Sites version is older and is not a substitute for the current English demo. The connected Sites account did not find the existing project; no replacement site was created and no deployment was claimed.

The public source repository is https://github.com/joseroavargas409/electrodecision-mining. The owner approved publication and the code, MIT license and README were verified on GitHub. `LINKS.json` includes the verified repository URL and uses null for the unpublished demo/video URLs. Never paste localhost or an invented address into the final submission.

## Public code — already published

Use the sanitized public-release folder, which contains the MIT license, English README, source, assets, tests, lockfile and CI configuration. The author's Sites project identity, Git history, runtime state and actual environment files are excluded. The public repository is already created and populated; do not create another one. Subsequent changes should be committed and pushed from the sanitized release copy. License detection and the initial clean-source checks were verified.

## Publish or provide the test build

Preferred route: restore access to the existing Sites project, publish the matching source/build through its supported workflow and configure `NEBIUS_API_KEY` as a hosted server secret. Preserve the existing audience until the owner authorizes the access needed for judging. This package does not change sharing settings or create a replacement project.

A working test-build URL is also permitted by the rules. Any alternative hosting setup needs its own build/runtime verification; the project uses a Worker-compatible Vinext setup, so do not assume a generic static host can run its API.

Provide free judge access through the end of judging. If the demo is private, provide application login instructions; never publish the provider API key. Make sure live inference remains usable within the owner's credit/budget arrangements.

After publication, update `LINKS.json`, test `/demo` from an independent session, run one live question and check the final video against that exact version. The final Devpost entry still needs the demo URL, repository URL and public YouTube URL.
