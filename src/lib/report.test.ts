import test from "node:test";
import assert from "node:assert/strict";
import { demoScenarios, planScenario } from "./planner.ts";
import { reportPayload, renderReport } from "./report.ts";

test("report carries reproducible scenario, grid energy basis, threshold evidence and connection status", () => {
  const scenario = structuredClone(demoScenarios[0]), plan = planScenario(scenario);
  const report = reportPayload(scenario, plan, { mode: "nebius", connection: "configured" });
  assert.equal(report.schemaVersion, 2);
  assert.equal(report.verified, true);
  assert.equal(report.assistantConnection, "configured");
  assert.ok(report.result.metrics!.gridEnergyWh! > report.result.metrics!.chargedEnergyWh!);
  assert.equal(report.infrastructure.sizing.lowerCandidateStatus, "infeasible");
  assert.equal(report.dataRequirements.length, 6);
  const exported = JSON.parse(JSON.stringify(report));
  assert.deepEqual(planScenario(exported.scenario), plan);
});

test("HTML export escapes imported text and preserves absent-price semantics", () => {
  const scenario = structuredClone(demoScenarios[0]);
  scenario.name = '<script>alert("injected")</script>';
  delete scenario.priceUsdPerKwh;
  const html = renderReport(scenario, planScenario(scenario), { mode: "demo", connection: "demo" });
  assert.ok(!html.includes('<script>alert'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('No disponible USD'));
  assert.ok(html.includes('Energía desde la red'));
  assert.ok(html.includes('Sin candidato') || html.includes('kW'));
});
