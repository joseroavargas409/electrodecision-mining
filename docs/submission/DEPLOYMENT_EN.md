# Publication and judge access

## Recovered hosted release

The original Sites project could not be found through the selected account, including the editable-site listing. At the owner's request, a new isolated Sites checkout was reconstructed from the sanitized version 0.11 source. Original files and the original site identity were preserved.

**Current English demo:** https://electrodecision-mining-recovered.jlroav409.chatgpt.site/demo

The recovered site is deployed successfully with **owner-private access**. Sign in with the ChatGPT account that created the recovery to view it. This is a hosted application, but it is not yet generally accessible to judges. Do not claim public judge access until the audience is changed or suitable access is actually provided.

The server-side Nebius key is configured as a hosted secret. Hosted HTTP checks confirmed the English route, release 0.11.0, provider configuration, and a real NVIDIA Nemotron report with both evidence tools and validated ID selection. The hosted run used 8296 input and 519 output tokens. Receipts are in `examples/nebius/recovered-host-*.json`. No credential or service-access token is included in those files.

The browser handoff requires the owner's normal ChatGPT sign-in. HTTP verification used an existing Sites service credential supplied by the authorized connector; it did not create or rotate a credential. Browser visual interaction is not yet verified.

## Public code

https://github.com/joseroavargas409/electrodecision-mining contains the sanitized code, MIT license, English README, source assets, lockfile and CI configuration. The original and recovered private Sites identities, actual environment files and runtime state remain outside the public source package.

## Finish judging access

Choose the audience deliberately. New Sites start private, and the recovery preserves that default until the owner explicitly requests public access. A public audience lets other visitors invoke the app's configured model and consume provider credit; the provider key itself remains server-side.

Provide free judging/testing access until the judging period ends. After the audience is set, verify `/demo` from a suitable independent session, inspect a real question, and record the final footage against that version. Keep secrets out of screenshots and video.

The final Devpost entry still needs an accessible judged demo, its public source link and a public YouTube video. `LINKS.json` records verified state separately from remaining work. No Devpost submission is claimed.
