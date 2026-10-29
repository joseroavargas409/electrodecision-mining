import test from "node:test";
import assert from "node:assert/strict";
import { demoScenarios, planScenario, type Scenario } from "./planner.ts";
import { fleetAtMinute } from "./mine-view.ts";

test("3D playback interpolates battery-side charging and consumes tasks only at their end", () => {
  const scenario: Scenario = { id: "playback", name: "Analytical playback", slotMinutes: 15, slotCount: 2, chargerPowerW: 16000, gridPowerWBySlot: [16000, 16000], chargingEfficiencyPct: 50, assets: [{ id: "a", name: "A", capacityWh: 10000, initialWh: 2000, reserveWh: 1000, finalTargetWh: 2000 }], tasks: [{ id: "task", assetId: "a", slot: 1, consumptionWh: 2000 }] };
  const result = planScenario(scenario);
  assert.equal(result.status, "feasible");
  assert.equal(fleetAtMinute(scenario, result, 7.5)[0].soc, 30);
  assert.equal(fleetAtMinute(scenario, result, 7.5)[0].state, "charging");
  assert.equal(fleetAtMinute(scenario, result, 15)[0].soc, 40);
  assert.equal(fleetAtMinute(scenario, result, 15)[0].state, "working");
  assert.equal(fleetAtMinute(scenario, result, 29.99)[0].soc, 40);
  assert.equal(fleetAtMinute(scenario, result, 30)[0].soc, 20);
  assert.equal(fleetAtMinute(scenario, result, 30)[0].state, "idle");
});

test("3D playback agrees with calculated closing energy for every demo asset", () => {
  const scenario = demoScenarios[0], result = planScenario(scenario);
  assert.equal(result.status, "feasible");
  for (const snapshot of fleetAtMinute(scenario, result, 1e6)) {
    const asset = scenario.assets.find(item => item.id === snapshot.id)!;
    const final = result.assetStates.find(item => item.assetId === snapshot.id)!;
    assert.ok(Math.abs(snapshot.soc! / 100 * asset.capacityWh - final.finalWh) < 1e-6);
    assert.equal(snapshot.state, "idle");
  }
});

test("3D playback does not show stale charge or vehicle status without a feasible plan", () => {
  const scenario = demoScenarios[0], staleResult = { ...planScenario(scenario), status: "infeasible" as const };
  for (const snapshot of fleetAtMinute(scenario, staleResult, 120)) {
    assert.equal(snapshot.soc, null);
    assert.equal(snapshot.state, "unknown");
  }
});
