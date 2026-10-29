import test from "node:test";
import assert from "node:assert/strict";
import { demoScenarios, planScenario, verifyPlan, validateScenario, type Scenario } from "./planner.ts";
import { analyzeInfrastructure, findMinimumUniformPower, withUniformPower } from "./infrastructure.ts";

function single(): Scenario {
  return { id: "single", name: "Analítico", slotMinutes: 15, slotCount: 4, chargerPowerW: 10000,
    chargingEfficiencyPct: 80, gridPowerWBySlot: [10000,10000,10000,10000],
    assets: [{ id: "a", name: "A", capacityWh: 5000, initialWh: 0, reserveWh: 0, finalTargetWh: 1000 }], tasks: [], pricePerKwh: 0.2 };
}

test("efficiency separates billed grid energy from battery energy and rejects altered ledgers", () => {
  const scenario = single(); const plan = planScenario(scenario);
  assert.equal(plan.status, "feasible");
  assert.ok(Math.abs(plan.metrics!.chargedEnergyWh! - 1000) < 1e-6);
  assert.ok(Math.abs(plan.metrics!.gridEnergyWh! - 1250) < 1e-6);
  assert.ok(Math.abs(plan.metrics!.chargingLossWh! - 250) < 1e-6);
  assert.ok(Math.abs(plan.metrics!.energyCostUsd! - 0.25) < 1e-6);
  assert.equal(verifyPlan(scenario, plan).valid, true);
  const altered = structuredClone(plan); altered.segments[0].gridEnergyWh += 1;
  assert.equal(verifyPlan(scenario, altered).valid, false);
});

test("the power threshold agrees with an independent closed-form energy bound", () => {
  const scenario = single(); const result = findMinimumUniformPower(scenario);
  // One hour, 1 kWh into battery, 80%: exact threshold 1250 W -> first kW candidate 2000 W.
  assert.equal(result.status, "found"); assert.equal(result.minimumGridPowerW, 2000);
  assert.equal(result.lowerCandidateW, 1000); assert.equal(result.lowerCandidateStatus, "infeasible");
  assert.equal(planScenario(withUniformPower(scenario, 1250)).status, "feasible");
  assert.equal(planScenario(withUniformPower(scenario, 1249)).status, "infeasible");
});

test("fractional final grid step includes the exact charger limit", () => {
  const scenario = single(); scenario.chargerPowerW = 1500;
  assert.equal(findMinimumUniformPower(scenario).minimumGridPowerW, 1500);
});

test("an impossible task window is not called solvable by increasing grid capacity", () => {
  const scenario = single(); scenario.tasks = [{ id: "early", assetId: "a", slot: 0, consumptionWh: 100 }];
  assert.equal(findMinimumUniformPower(scenario).status, "infeasible_at_limit");
});

test("zero charging is a valid minimum and invalid data never produces a recommendation", () => {
  const scenario = single(); scenario.assets[0].initialWh = 1500;
  assert.equal(findMinimumUniformPower(scenario).minimumGridPowerW, 0);
  scenario.chargingEfficiencyPct = 101;
  assert.equal(validateScenario(scenario).valid, false);
  assert.equal(findMinimumUniformPower(scenario).status, "invalid");
  assert.equal(analyzeInfrastructure(scenario).sensitivity.length, 0);
});

test("sensitivity preserves its inputs and thresholds cannot fall when task demand increases", () => {
  const scenario = structuredClone(demoScenarios[0]); const before = structuredClone(scenario);
  const result = analyzeInfrastructure(scenario);
  assert.deepEqual(scenario, before);
  assert.deepEqual(result.sensitivity.map(row => row.consumptionPct), [100,110,120]);
  const thresholds = result.sensitivity.map(row => row.minimumGridPowerW);
  assert.ok(thresholds.every(power => power !== null));
  assert.ok(thresholds[0]! <= thresholds[1]! && thresholds[1]! <= thresholds[2]!);
  const threshold = result.sizing.minimumGridPowerW!;
  assert.equal(planScenario(withUniformPower(scenario, threshold)).status, "feasible");
  assert.equal(planScenario(withUniformPower(scenario, result.sizing.lowerCandidateW!)).status, "infeasible");
});

test("the uniform search explicitly discards outage profiles instead of calling it the current supply", () => {
  const scenario = single(); scenario.gridPowerWBySlot = [0,0,0,0];
  assert.equal(planScenario(scenario).status, "infeasible");
  const search = findMinimumUniformPower(scenario);
  assert.equal(search.status, "found");
  assert.ok(search.assumptions.some(s => s.includes("cortes")));
  assert.deepEqual(scenario.gridPowerWBySlot, [0,0,0,0]);
});

test("lossy multi-deadline cases agree with independent prefix-energy bounds", () => {
  for (const efficiencyPct of [50,67,80,90,100]) for (let seed = 0; seed < 10; seed++) {
    const eta = efficiencyPct / 100, reserve = 2, first = 1 + seed % 5, second = 1 + seed % 4, targetAboveReserve = seed % 3;
    const scenario = single(); scenario.chargingEfficiencyPct = efficiencyPct; scenario.chargerPowerW = 100;
    scenario.assets = [{ id: "a", name: "A", capacityWh: 100, initialWh: reserve + 1, reserveWh: reserve, finalTargetWh: reserve + targetAboveReserve }];
    scenario.tasks = [{ id: "t1", assetId: "a", slot: 1, consumptionWh: first }, { id: "t2", assetId: "a", slot: 3, consumptionWh: second }];
    // Slots 0 and 2 are free; prefix 1 must preserve reserve, final must preserve max(reserve,target).
    const threshold = Math.ceil(Math.max(0, (first - 1) / (.25 * eta), (first + second + targetAboveReserve - 1) / (.5 * eta)) - 1e-9);
    const plan = planScenario(withUniformPower(scenario, threshold));
    assert.equal(plan.status, "feasible", `eta=${eta}; seed=${seed}; threshold=${threshold}`);
    assert.equal(verifyPlan(withUniformPower(scenario, threshold), plan).valid, true);
    if (threshold > 0) assert.equal(planScenario(withUniformPower(scenario, threshold - 1)).status, "infeasible");
  }
});
