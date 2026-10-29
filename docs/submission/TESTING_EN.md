# Judge testing instructions

Use the final published demo URL supplied in Devpost and open **/demo**. A localhost URL is only for local development. The owner must provide free judge access to the current release throughout the judging period. Public demo and repository URLs are not yet assigned in this package; see `LINKS.json`.

## Five-minute workflow

1. Open the English demo. The initial **Shift & charging lab** uses the default synthetic case: four generic LHDs, 12 hours, 1,700 tonnes per shift, a 1,050-kW supply and one initial charger.
2. Compare the four rows. Expected first-shift tonnage is **1188 / 1404 / 1782 / 1782 t**. Expected overload is **0 / 0 / 0 / 369 min**. Waiting is measured in vehicle-minutes, which is a different metric.
3. Click **Inspect** on the supply-upgrade row. Check the power plot and play the shift. The plot and SOC values come from the numerical trace.
4. Keep the break at **60 minutes**. The selected upgrade case should recover initial SOC and produce **1872 t** in shift two. Its total horizon is **25 hours**. Resetting the demonstration returns to the baseline; its 60-minute break leaves battery energy outstanding.
5. Open **Project evidence review**. Select a technology, stage and jurisdiction. Observe that swapping needs a pack-stock review and trolley needs a route/line review. Changing the context clears the current evidence declarations.
6. Enter a reference before selecting **Document declared**. A reference changes declared completeness; it does not certify contents, approvals or compliance. Critical non-applicability remains an open review item.
7. Ask Nemotron a question. In the dossier workflow, inspect `assess_project_readiness` and `get_project_context`, then the validated selection/report. In the shift workflow, inspect the calculation tools and compare the explanation with the trace. Live calls may use the owner's provider credit.
8. Export the current report as JSON. No field equipment is controlled and no original documents are uploaded.

## Local reproduction

Install Node.js 24 with npm. From a clean source folder:

```text
npm run install:ci
npm test
npm run typecheck
npm run build
npm run dev
```

Open **http://127.0.0.1:5173/demo**. On Windows, use `npm.cmd` if PowerShell blocks the npm shim. The simulation, evidence review and tests work without an API key or provider calls.

For your own live inference, copy `.dev.vars.example` to `.dev.vars`, set `NEBIUS_API_KEY` and a supported `NEBIUS_MODEL`, then restart. Never commit that file. Hosted judge access should use an owner-configured server key; judges should not be asked to purchase credit.

## Limitations

All operation inputs are synthetic. This is preliminary decision support, not engineering approval or proof of industrial savings. The current lab is generic direct charging; it does not numerically simulate the published trolley/swapping cases. Formal browser interaction/visual recording remains unverified because local browser access was blocked in the authoring environment. HTTP and model-integration evidence are recorded separately.
