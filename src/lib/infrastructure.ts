import { planScenario, validateScenario, verifyPlan } from "./planner.ts";
import type { Scenario, PlanResult } from "./planner.ts";

export type PowerTrial = {
  gridPowerW: number;
  status: PlanResult["status"];
  verified: boolean;
  gridEnergyWh: number | null;
  batteryEnergyWh: number | null;
};
export type InfrastructureResult = {
  status: "found" | "infeasible_at_limit" | "invalid";
  minimumGridPowerW: number | null;
  lowerCandidateW: number | null;
  lowerCandidateStatus: PlanResult["status"] | null;
  stepW: number;
  chargerLimitW: number;
  trials: PowerTrial[];
  diagnostics: string[];
  assumptions: string[];
};
export type SensitivityRow = {
  consumptionPct: number;
  taskEnergyWh: number;
  currentPowerStatus: PlanResult["status"];
  minimumGridPowerW: number | null;
  searchStatus: InfrastructureResult["status"];
};
export type InfrastructureAnalysis = {
  sizing: InfrastructureResult;
  sensitivity: SensitivityRow[];
};

export function withUniformPower(scenario: Scenario, powerW: number): Scenario {
  return { ...structuredClone(scenario), gridPowerWBySlot: Array(scenario.slotCount).fill(powerW) };
}

/** Finds the first feasible point on a discrete grid, never a continuous optimum. */
export function findMinimumUniformPower(scenario: Scenario, stepW = 1000): InfrastructureResult {
  const validation = validateScenario(scenario);
  const result: InfrastructureResult = {
    status: "invalid", minimumGridPowerW: null, lowerCandidateW: null, lowerCandidateStatus: null,
    stepW, chargerLimitW: scenario?.chargerPowerW ?? 0, trials: [], diagnostics: [], assumptions: [
      "Se sustituye el perfil de red por una potencia uniforme durante TODO el turno, incluso si el original tenía cortes.",
      "Se conservan cargador, tareas, baterías, eficiencia, reservas y objetivos. Un solo cargador compartido.",
      "Mínimo de los candidatos evaluados: 0 W, múltiplos del paso y límite exacto del cargador. No es un óptimo continuo.",
      "No dimensiona transformadores, alimentadores ni protecciones; faltan demanda existente, traslados y curvas de carga.",
    ],
  };
  if (!validation.valid || !Number.isSafeInteger(stepW) || stepW < 1) {
    result.diagnostics = validation.errors.map(i => i.message);
    if (!Number.isSafeInteger(stepW) || stepW < 1) result.diagnostics.push("El paso debe ser un entero positivo en W.");
    return result;
  }
  const cache = new Map<number, PowerTrial>();
  const last = Math.ceil(scenario.chargerPowerW / stepW);
  const candidate = (index: number) => Math.min(index * stepW, scenario.chargerPowerW);
  const evaluate = (index: number): PowerTrial => {
    const powerW = candidate(index);
    const previous = cache.get(powerW);
    if (previous) return previous;
    const alternative = withUniformPower(scenario, powerW);
    const plan = planScenario(alternative);
    const verified = plan.status === "feasible" && verifyPlan(alternative, plan).valid;
    const trial: PowerTrial = { gridPowerW: powerW, status: plan.status === "feasible" && !verified ? "invalid" : plan.status,
      verified, gridEnergyWh: plan.metrics?.gridEnergyWh ?? null, batteryEnergyWh: plan.metrics?.chargedEnergyWh ?? null };
    cache.set(powerW, trial); result.trials.push(trial);
    return trial;
  };
  const maximum = evaluate(last);
  if (maximum.status === "invalid") {
    result.diagnostics = ["El cálculo no superó su validación; no se puede certificar un mínimo."];
    return result;
  }
  if (maximum.status === "infeasible") {
    result.status = "infeasible_at_limit";
    result.diagnostics = ["Ni con potencia de red uniforme igual a la del cargador existe un plan. Aumentar sólo la red, manteniendo este cargador y las demás entradas, no resuelve el caso."];
    return result;
  }
  let low = 0, high = last;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    const trial = evaluate(middle);
    if (trial.status === "invalid") {
      result.diagnostics = ["Se encontró un cálculo inválido. Se interrumpió la búsqueda sin afirmar un mínimo."];
      return result;
    }
    if (trial.status === "feasible") high = middle;
    else low = middle + 1;
  }
  const found = evaluate(low);
  const lower = low > 0 ? evaluate(low - 1) : null;
  if (!found.verified || (lower && lower.status !== "infeasible")) {
    result.diagnostics = ["No se pudo verificar el candidato y su vecino inferior. No se afirma un mínimo."];
    return result;
  }
  result.status = "found";
  result.minimumGridPowerW = found.gridPowerW;
  result.lowerCandidateW = lower?.gridPowerW ?? null;
  result.lowerCandidateStatus = lower?.status ?? null;
  result.diagnostics = [lower
    ? `El candidato ${found.gridPowerW / 1000} kW es factible y ${lower.gridPowerW / 1000} kW no lo es. La factibilidad es monótona bajo estos supuestos.`
    : "El turno y sus objetivos se cumplen sin cargar desde la red con las energías iniciales declaradas."];
  return result;
}

export function analyzeInfrastructure(scenario: Scenario): InfrastructureAnalysis {
  const sizing = findMinimumUniformPower(scenario);
  if (!validateScenario(scenario).valid) return { sizing, sensitivity: [] };
  const sensitivity = [100, 110, 120].map(consumptionPct => {
    const alternative = structuredClone(scenario);
    alternative.tasks = alternative.tasks.map(task => ({ ...task, consumptionWh: Math.ceil(task.consumptionWh * consumptionPct / 100) }));
    const search = consumptionPct === 100 ? sizing : findMinimumUniformPower(alternative);
    return { consumptionPct, taskEnergyWh: alternative.tasks.reduce((sum, task) => sum + task.consumptionWh, 0),
      currentPowerStatus: planScenario(alternative).status, minimumGridPowerW: search.minimumGridPowerW, searchStatus: search.status };
  });
  return { sizing, sensitivity };
}
