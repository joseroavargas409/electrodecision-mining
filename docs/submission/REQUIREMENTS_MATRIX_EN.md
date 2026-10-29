# Deliverable requirements and evidence

Reviewed against the [official rules](https://nebiusglobalaihackathon.devpost.com/rules) on 2026-10-29. This is a readiness inventory, not organizer approval.

| Organizer requirement | Project evidence | Status |
| --- | --- | --- |
| Working project using an NVIDIA open-source model at runtime on Nebius | `src/lib/mining-agent.ts`, `examples/nebius/submission-en.json`; NVIDIA Nemotron through Token Factory | Implemented; actual inference verified locally |
| Best-fit category | Best Apps and Agents | Selected |
| Description of what, why and how | `DEVPOST_DESCRIPTION_EN.md`, `SUBMISSION_FIELDS_EN.json` | English text ready |
| Working demo / hosted app / test-build URL | English `/demo`; `TESTING_EN.md` | Public current demo still required; localhost and source ZIP are not presented as a live demo |
| Video below three minutes showing the project functioning | `media/ELECTRODECISION_WALKTHROUGH_EN.mp4`, 168 seconds; `RECORDING_GUIDE_EN.md` | Supporting replay ready; add real application footage and public YouTube upload |
| Public source on GitHub/GitLab/Bitbucket | https://github.com/joseroavargas409/electrodecision-mining | Published and verified |
| Open-source license visible on repository | Root `LICENSE`, GitHub MIT detection | Complete |
| README and running instructions | Root English `README.md`; `TESTING_EN.md` | Complete |
| Explain model and Nebius workflow | `ARCHITECTURE_EN.md`, README, saved integration trace | Complete |
| Product feedback | `NEBIUS_FEEDBACK_EN.md` | Complete; only services actually used |
| Disclose significant updates to existing work | `RELEASE_NOTES_EN.md` | Written disclosure ready; entrant confirms original component dates |
| English or English translation | English primary `/demo`, README, submission materials, narration and captions | Complete for the primary evaluation path; Spanish historical workspace remains available |
| Free judging/testing access | Deployment instructions in `DEPLOYMENT_EN.md` | Must be configured and verified on hosted release |

The NVIDIA model is served by Token Factory; this project did not train it or deploy dedicated GPU compute. The operation is synthetic. No industrial savings or regulatory approval is claimed.
