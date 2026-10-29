import { mkdir, writeFile } from "node:fs/promises";
import { demoScenarios, planScenario, verifyPlan } from "../src/lib/planner.ts";
import { analyzeInfrastructure } from "../src/lib/infrastructure.ts";
import { renderReport, reportPayload } from "../src/lib/report.ts";
const destination = new URL("../examples/", import.meta.url);
await mkdir(destination, { recursive: true });
const evaluation = [];
for (const scenario of demoScenarios) {
  const result = planScenario(scenario);
  await writeFile(new URL(`${scenario.id}.json`, destination), JSON.stringify(scenario, null, 2) + "\n");
  evaluation.push({ scenarioId: scenario.id, status: result.status,
    verification: result.status === "feasible" ? verifyPlan(scenario, result) : null,
    metrics: result.metrics, infrastructure: analyzeInfrastructure(scenario), diagnostics: result.diagnostics });
}
const baseline = demoScenarios[0], plan = planScenario(baseline), assistant = { mode: "demo", connection: "demo" };
await writeFile(new URL("normal-report.json", destination), JSON.stringify(reportPayload(baseline, plan, assistant), null, 2) + "\n");
await writeFile(new URL("normal-report.html", destination), renderReport(baseline, plan, assistant));
await writeFile(new URL("evaluation.json", destination), JSON.stringify({
  notice: "Escenarios sintéticos. Resultado reproducible del modelo, sin inferencia Nebius ni validación minera.",
  scenarios: evaluation,
}, null, 2) + "\n");
console.log("Escenarios y evaluación reproducible guardados en examples/.");
