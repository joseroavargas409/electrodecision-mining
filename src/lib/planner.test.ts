import test from "node:test";
import assert from "node:assert/strict";
import { demoScenarios, planScenario, scenarioMetrics, validateScenario, verifyPlan, type Scenario } from "./planner.ts";

const clone = <T>(value: T): T => structuredClone(value);
function small(): Scenario {
  return { id: "test", name: "Caso de prueba", slotMinutes: 15, slotCount: 2, chargerPowerW: 4,
    gridPowerWBySlot: [4, 4], assets: [
      { id: "a", name: "A", capacityWh: 3, initialWh: 0, reserveWh: 0, finalTargetWh: 1 },
      { id: "b", name: "B", capacityWh: 3, initialWh: 0, reserveWh: 0, finalTargetWh: 0 },
      { id: "c", name: "C", capacityWh: 3, initialWh: 0, reserveWh: 0, finalTargetWh: 0 },
    ], tasks: [{ id: "deadline", assetId: "b", slot: 1, consumptionWh: 1 }] };
}

test("fixtures distinguish feasible, proven infeasible, and invalid input", () => {
  assert.deepEqual(demoScenarios.map((scenario) => planScenario(scenario).status), ["feasible", "infeasible", "invalid"]);
  const plan = planScenario(demoScenarios[0]);
  assert.equal(verifyPlan(demoScenarios[0], plan).valid, true);
  assert.equal(plan.certificate?.missingFlowWh, 0);
  assert.equal(plan.metrics?.minimumChargeWh, 430_000);
});

test("finds the feasible schedule that charging the first asset greedily would miss", () => {
  const scenario = small();
  const plan = planScenario(scenario);
  assert.equal(plan.status, "feasible");
  assert.equal(plan.segments.find((segment) => segment.slot === 0)?.assetId, "b");
  assert.equal(plan.segments.find((segment) => segment.slot === 1)?.assetId, "a");
  assert.equal(verifyPlan(scenario, plan).valid, true);
});

test("a first-slot task cannot consume a reserve or charge in its occupied slot", () => {
  const scenario = small();
  scenario.tasks[0].slot = 0;
  const plan = planScenario(scenario);
  assert.equal(plan.status, "infeasible");
  assert.ok(plan.certificate!.missingFlowWh > 0);
  assert.equal(plan.segments.length, 0);
});

test("one charger can serve several vehicles sequentially inside a slot", () => {
  const scenario = small(); scenario.slotCount = 1; scenario.gridPowerWBySlot = [4_800];
  scenario.chargerPowerW = 4_800; scenario.tasks = [];
  scenario.assets.forEach((asset) => { asset.capacityWh = 1_000; asset.finalTargetWh = 400; });
  const plan = planScenario(scenario);
  assert.equal(plan.status, "feasible");
  assert.equal(plan.segments.length, 3);
  assert.equal(plan.metrics?.totalChargingMinutes, 15);
  assert.equal(plan.metrics?.chargedEnergyWh, 1_200);
  assert.equal(verifyPlan(scenario, plan).valid, true);
});

test("keeps exact sub-Wh slot capacity rather than rounding it down", () => {
  const scenario = small(); scenario.tasks = []; scenario.slotCount = 4;
  scenario.gridPowerWBySlot = [1, 1, 1, 1]; scenario.chargerPowerW = 1;
  scenario.assets = [scenario.assets[0]];
  const plan = planScenario(scenario);
  assert.equal(plan.status, "feasible");
  assert.equal(plan.metrics?.chargedEnergyWh, 1);
  assert.equal(plan.segments.length, 4);
});

test("preserves initial excess energy and checks reserve and capacity throughout", () => {
  const scenario = small(); scenario.assets = [{ id: "a", name: "A", capacityWh: 10, initialWh: 9, reserveWh: 3, finalTargetWh: 3 }];
  scenario.tasks = [{ id: "use", assetId: "a", slot: 1, consumptionWh: 2 }];
  scenario.gridPowerWBySlot = [0, 0];
  const plan = planScenario(scenario);
  assert.equal(plan.status, "feasible");
  assert.equal(plan.assetStates[0].finalWh, 7);
  assert.equal(plan.metrics?.chargedEnergyWh, 0);
});

test("total available energy alone is not sufficient when storage is too small", () => {
  const scenario = small(); scenario.assets = [scenario.assets[0]];
  scenario.assets[0].capacityWh = 1; scenario.assets[0].finalTargetWh = 0;
  scenario.tasks = [{ id: "too-large", assetId: "a", slot: 1, consumptionWh: 2 }];
  scenario.gridPowerWBySlot = [400, 400]; scenario.chargerPowerW = 400;
  assert.equal(planScenario(scenario).status, "infeasible");
});

test("invalid references, duplicate IDs, negative and nonfinite values are rejected", () => {
  const scenario = small(); scenario.assets[1].id = "a"; scenario.tasks[0].assetId = "missing";
  scenario.gridPowerWBySlot[0] = Number.NaN; scenario.assets[0].reserveWh = -1;
  const validation = validateScenario(scenario);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.length >= 4);
  assert.equal(planScenario(scenario).status, "invalid");
  assert.equal(validateScenario(null).valid, false);
});

test("independent verifier catches overlaps, false energy, omitted tasks and hidden deficit", () => {
  const scenario = small(); const original = planScenario(scenario);
  const overlap = clone(original); overlap.segments.push(clone(overlap.segments[0]));
  assert.equal(verifyPlan(scenario, overlap).valid, false);
  const energy = clone(original); energy.segments[0].energyWh += 1;
  assert.equal(verifyPlan(scenario, energy).valid, false);
  const task = clone(original); task.taskEvents = [];
  assert.equal(verifyPlan(scenario, task).valid, false);
  const deficit = clone(original); deficit.segments = [];
  deficit.assetStates.forEach((asset) => { asset.finalWh = 10_000; });
  assert.equal(verifyPlan(scenario, deficit).valid, false);
});

test("cost follows the executed charging ledger and absent price remains unknown", () => {
  const scenario = small(); scenario.priceUsdPerKwh = 100;
  const result = planScenario(scenario);
  assert.ok(Math.abs(result.metrics!.energyCostUsd! - 0.2) < 1e-9);
  delete scenario.priceUsdPerKwh;
  assert.equal(scenarioMetrics(scenario, planScenario(scenario)).energyCostUsd, null);
});

test("optional price alias and charging emissions use declared metadata, never a reduction baseline", () => {
  const scenario = small(); scenario.pricePerKwh = 100; scenario.co2KgPerKwh = 2;
  const result = planScenario(scenario);
  assert.ok(Math.abs(result.metrics!.energyCostUsd! - 0.2) < 1e-9);
  assert.ok(Math.abs(result.metrics!.chargingCo2Kg! - 0.004) < 1e-9);
  delete scenario.co2KgPerKwh;
  assert.equal(planScenario(scenario).metrics?.chargingCo2Kg, null);
});

// Independent exhaustive enumeration of tiny integer-Wh schedules. All slot energy
// capacities are integral Wh here, so a feasible temporal flow has an integral solution.
function bruteForce(scenario: Scenario): boolean {
  let states = [scenario.assets.map((asset) => asset.initialWh)];
  for (let slot = 0; slot < scenario.slotCount; slot++) {
    const next = new Map<string, number[]>();
    const budget = Math.min(scenario.chargerPowerW, scenario.gridPowerWBySlot[slot]) / 4;
    for (const state of states) {
      const allocation = Array(scenario.assets.length).fill(0);
      const visit = (index: number, remaining: number) => {
        if (index === scenario.assets.length) {
          const end = state.map((value, i) => value + allocation[i] - scenario.tasks
            .filter((task) => task.slot === slot && task.assetId === scenario.assets[i].id)
            .reduce((sum, task) => sum + task.consumptionWh, 0));
          if (end.every((value, i) => value >= scenario.assets[i].reserveWh)) next.set(end.join(","), end);
          return;
        }
        const asset = scenario.assets[index];
        const blocked = scenario.tasks.some((task) => task.slot === slot && task.assetId === asset.id);
        const maximum = blocked ? 0 : Math.min(remaining, asset.capacityWh - state[index]);
        for (let amount = 0; amount <= maximum; amount++) { allocation[index] = amount; visit(index + 1, remaining - amount); }
      };
      visit(0, budget);
    }
    states = [...next.values()];
  }
  return states.some((state) => state.every((value, index) => value >= scenario.assets[index].finalTargetWh));
}

test("circulation agrees with exhaustive schedules across 100 deterministic tiny cases", () => {
  let seed = 1234567;
  const random = (maximum: number) => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % maximum; };
  for (let example = 0; example < 100; example++) {
    const scenario = small(); scenario.slotCount = 3; scenario.chargerPowerW = 8;
    scenario.gridPowerWBySlot = Array.from({ length: 3 }, () => random(3) * 4);
    scenario.assets.forEach((asset) => {
      asset.capacityWh = 1 + random(4); asset.reserveWh = random(2) % (asset.capacityWh + 1);
      asset.initialWh = asset.reserveWh + random(asset.capacityWh - asset.reserveWh + 1);
      asset.finalTargetWh = asset.reserveWh + random(asset.capacityWh - asset.reserveWh + 1);
    });
    scenario.tasks = [];
    scenario.assets.forEach((asset, index) => {
      if (random(2)) scenario.tasks.push({ id: `task-${index}`, assetId: asset.id, slot: random(3), consumptionWh: 1 + random(3) });
    });
    const expected = bruteForce(scenario);
    const plan = planScenario(scenario);
    assert.equal(plan.status === "feasible", expected, `Scenario ${example}: ${JSON.stringify(scenario)}`);
    assert.notEqual(plan.status, "invalid");
    if (expected) assert.equal(verifyPlan(scenario, plan).valid, true);
  }
});
