/** A finite-horizon feasibility model. It does not optimize cost or productivity. */
export type Asset = {
  id: string;
  name: string;
  capacityWh: number;
  initialWh: number;
  reserveWh: number;
  finalTargetWh: number;
};
export type Equipment = Asset;
export type Task = {
  id: string;
  assetId: string;
  slot: number;
  consumptionWh: number;
  label?: string;
};
export type Scenario = {
  id: string;
  name: string;
  slotMinutes: 15;
  slotCount: number;
  chargerPowerW: number;
  gridPowerWBySlot: number[];
  assets: Asset[];
  tasks: Task[];
  /** Constant grid-to-battery efficiency; omitted means 100% for legacy inputs. */
  chargingEfficiencyPct?: number;
  priceUsdPerKwh?: number;
  /** Alias in USD/kWh; takes precedence when provided. */
  pricePerKwh?: number;
  /** Optional attributed emissions for charging, kgCO2e/kWh; no reduction baseline. */
  co2KgPerKwh?: number;
};
export type ValidationIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
  path?: string;
};
export type ValidationResult = {
  valid: boolean;
  issues: ValidationIssue[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
};
export type ChargingSegment = {
  assetId: string;
  slot: number;
  startMinute: number;
  endMinute: number;
  powerW: number;
  /** Battery-side energy. powerW is grid-side power. */
  energyWh: number;
  gridEnergyWh: number;
};
export type TaskEvent = {
  taskId: string;
  assetId: string;
  slot: number;
  minute: number;
  consumptionWh: number;
};
export type AssetState = {
  assetId: string;
  initialWh: number;
  finalWh: number;
  minimumWh: number;
  trajectory: {
    minute: number;
    energyWh: number;
    event: "initial" | "charge" | "task" | "final";
    refId?: string;
  }[];
};
export type ScenarioMetrics = {
  initialEnergyWh: number;
  taskEnergyWh: number;
  requiredFinalWh: number;
  minimumChargeWh: number;
  availableChargeWh: number;
  chargedEnergyWh: number | null;
  gridEnergyWh: number | null;
  chargingLossWh: number | null;
  peakChargingPowerW: number | null;
  totalChargingMinutes: number | null;
  energyCostUsd: number | null;
  chargingCo2Kg: number | null;
};
export type PlanResult = {
  scenarioId: string;
  status: "feasible" | "infeasible" | "invalid";
  segments: ChargingSegment[];
  taskEvents: TaskEvent[];
  assetStates: AssetState[];
  diagnostics: string[];
  validation: ValidationResult;
  metrics: ScenarioMetrics | null;
  certificate?: {
    requiredFlowWh: number;
    satisfiedFlowWh: number;
    missingFlowWh: number;
  };
};

const EPS = 1e-6;
const FLOW_UNITS_PER_WH = 6000;
const MAX_ENERGY_WH = 100_000_000;
const MAX_POWER_W = 100_000_000;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isInteger = (value: unknown, min: number, max: number): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= min && value <= max;
const hasText = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

export function validateScenario(value: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];
  const add = (code: string, message: string, path?: string, severity: "error" | "warning" = "error") =>
    issues.push({ severity, code, message, path });
  if (!isRecord(value)) {
    add("scenario-object", "El escenario debe ser un objeto.");
  } else {
    if (!hasText(value.id)) add("scenario-id", "Falta el identificador del escenario.", "id");
    if (!hasText(value.name)) add("scenario-name", "Falta el nombre del escenario.", "name");
    if (value.slotMinutes !== 15) add("slot-duration", "El modelo utiliza intervalos de 15 minutos.", "slotMinutes");
    if (!isInteger(value.slotCount, 1, 96)) add("slot-count", "El turno debe tener entre 1 y 96 intervalos.", "slotCount");
    if (!isInteger(value.chargerPowerW, 1, MAX_POWER_W)) add("charger-power", "La potencia del cargador debe ser un entero positivo en W.", "chargerPowerW");
    if (value.chargingEfficiencyPct !== undefined && !isInteger(value.chargingEfficiencyPct, 50, 100))
      add("charging-efficiency", "La eficiencia constante debe ser un porcentaje entero entre 50 y 100.", "chargingEfficiencyPct");
    const grid = value.gridPowerWBySlot;
    if (!Array.isArray(grid) || grid.length !== value.slotCount) {
      add("grid-length", "La potencia disponible debe tener un valor por intervalo.", "gridPowerWBySlot");
    } else {
      grid.forEach((power, index) => {
        if (!isInteger(power, 0, MAX_POWER_W)) add("grid-power", "La potencia de red debe ser un entero no negativo en W.", `gridPowerWBySlot.${index}`);
      });
      if (grid.every((power) => power === 0)) add("no-grid", "La red no aporta energía durante este turno.", "gridPowerWBySlot", "warning");
    }
    for (const field of ["priceUsdPerKwh", "pricePerKwh", "co2KgPerKwh"]) {
      if (value[field] !== undefined && (typeof value[field] !== "number" ||
        !Number.isFinite(value[field]) || value[field] < 0 || value[field] > 1_000_000))
        add("energy-metadata", "Precio y factor de emisiones deben ser números entre 0 y 1.000.000, con sus unidades declaradas.", field);
    }
    const assetIds = new Set<string>();
    if (!Array.isArray(value.assets) || value.assets.length < 1 || value.assets.length > 12) {
      add("assets", "Se necesitan entre 1 y 12 equipos compatibles.", "assets");
    } else {
      value.assets.forEach((asset: unknown, index: number) => {
        const path = `assets.${index}`;
        if (!isRecord(asset)) { add("asset-object", "Equipo inválido.", path); return; }
        if (!hasText(asset.id)) add("asset-id", "Falta el identificador del equipo.", `${path}.id`);
        else if (assetIds.has(asset.id)) add("asset-duplicate", "Los identificadores de equipos deben ser únicos.", `${path}.id`);
        else assetIds.add(asset.id);
        if (!hasText(asset.name)) add("asset-name", "Falta el nombre del equipo.", `${path}.name`);
        for (const field of ["capacityWh", "initialWh", "reserveWh", "finalTargetWh"]) {
          if (!isInteger(asset[field], field === "capacityWh" ? 1 : 0, MAX_ENERGY_WH))
            add("asset-energy", "Las energías deben ser enteros no negativos en Wh; la capacidad debe ser positiva.", `${path}.${field}`);
        }
        if (typeof asset.capacityWh === "number") {
          for (const field of ["initialWh", "reserveWh", "finalTargetWh"])
            if (typeof asset[field] === "number" && asset[field] > asset.capacityWh)
              add("above-capacity", "La energía no puede superar la capacidad utilizable.", `${path}.${field}`);
        }
        if (typeof asset.reserveWh === "number") {
          if (typeof asset.initialWh === "number" && asset.initialWh < asset.reserveWh)
            add("initial-reserve", "La energía inicial ya está bajo la reserva.", `${path}.initialWh`);
          if (typeof asset.finalTargetWh === "number" && asset.finalTargetWh < asset.reserveWh)
            add("target-reserve", "El objetivo final no puede quedar bajo la reserva.", `${path}.finalTargetWh`);
        }
      });
    }
    const taskIds = new Set<string>();
    if (!Array.isArray(value.tasks) || value.tasks.length > 1_000) add("tasks", "Las tareas deben ser una lista de hasta 1.000 elementos.", "tasks");
    else value.tasks.forEach((task: unknown, index: number) => {
      const path = `tasks.${index}`;
      if (!isRecord(task)) { add("task-object", "Tarea inválida.", path); return; }
      if (!hasText(task.id)) add("task-id", "Falta el identificador de la tarea.", `${path}.id`);
      else if (taskIds.has(task.id)) add("task-duplicate", "Los identificadores de tareas deben ser únicos.", `${path}.id`);
      else taskIds.add(task.id);
      if (!hasText(task.assetId) || !assetIds.has(task.assetId)) add("task-asset", "La tarea debe referir a un equipo existente.", `${path}.assetId`);
      if (!isInteger(task.slot, 0, typeof value.slotCount === "number" ? value.slotCount - 1 : -1))
        add("task-slot", "El intervalo de la tarea debe estar dentro del turno.", `${path}.slot`);
      if (!isInteger(task.consumptionWh, 1, MAX_ENERGY_WH)) add("task-energy", "El consumo de la tarea debe ser un entero positivo en Wh.", `${path}.consumptionWh`);
    });
    add("model-assumptions", `Modelo sintético: un cargador, equipos compatibles, eficiencia constante declarada ${value.chargingEfficiencyPct ?? 100}%, sin traslados ni degradación. Las tareas consumen al final del intervalo y bloquean la carga del equipo durante ese intervalo.`, undefined, "warning");
    if (value.priceUsdPerKwh === undefined && value.pricePerKwh === undefined) add("missing-price", "No se calcula costo monetario porque falta el precio de energía.", "priceUsdPerKwh", "warning");
  }
  const errors = issues.filter((issue) => issue.severity === "error");
  return { valid: errors.length === 0, issues, errors, warnings: issues.filter((issue) => issue.severity === "warning") };
}

type Edge = { to: number; reverse: number; capacity: number; initialCapacity: number };
class Dinic {
  graph: Edge[][] = [];
  node(): number { this.graph.push([]); return this.graph.length - 1; }
  edge(from: number, to: number, capacity: number): Edge {
    const forward = { to, reverse: this.graph[to].length, capacity, initialCapacity: capacity };
    const reverse = { to: from, reverse: this.graph[from].length, capacity: 0, initialCapacity: 0 };
    this.graph[from].push(forward); this.graph[to].push(reverse);
    return forward;
  }
  maxFlow(source: number, sink: number): number {
    let total = 0;
    for (;;) {
      const level = Array<number>(this.graph.length).fill(-1);
      const queue = [source]; level[source] = 0;
      for (let cursor = 0; cursor < queue.length; cursor++) {
        const node = queue[cursor];
        for (const edge of this.graph[node]) if (edge.capacity > 0 && level[edge.to] < 0) {
          level[edge.to] = level[node] + 1; queue.push(edge.to);
        }
      }
      if (level[sink] < 0) break;
      const next = Array<number>(this.graph.length).fill(0);
      const push = (node: number, limit: number): number => {
        if (node === sink) return limit;
        for (; next[node] < this.graph[node].length; next[node]++) {
          const edge = this.graph[node][next[node]];
          if (edge.capacity <= 0 || level[edge.to] !== level[node] + 1) continue;
          const sent = push(edge.to, Math.min(limit, edge.capacity));
          if (sent > 0) {
            edge.capacity -= sent;
            this.graph[edge.to][edge.reverse].capacity += sent;
            return sent;
          }
        }
        return 0;
      };
      let sent: number;
      while ((sent = push(source, Number.MAX_SAFE_INTEGER)) > 0) total += sent;
    }
    return total;
  }
}

function trajectoryFor(scenario: Scenario, segments: ChargingSegment[]): AssetState[] {
  return scenario.assets.map((asset) => {
    let energy = asset.initialWh;
    let minimum = energy;
    const trajectory: AssetState["trajectory"] = [{ minute: 0, energyWh: energy, event: "initial" }];
    for (let slot = 0; slot < scenario.slotCount; slot++) {
      for (const segment of segments.filter((item) => item.assetId === asset.id && item.slot === slot)) {
        trajectory.push({ minute: segment.startMinute, energyWh: energy, event: "charge" });
        energy += segment.powerW * (segment.endMinute - segment.startMinute) / 60 * (scenario.chargingEfficiencyPct ?? 100) / 100;
        trajectory.push({ minute: segment.endMinute, energyWh: energy, event: "charge" });
      }
      for (const task of scenario.tasks.filter((item) => item.assetId === asset.id && item.slot === slot)) {
        energy -= task.consumptionWh; minimum = Math.min(minimum, energy);
        trajectory.push({ minute: (slot + 1) * scenario.slotMinutes, energyWh: energy, event: "task", refId: task.id });
      }
    }
    trajectory.push({ minute: scenario.slotCount * scenario.slotMinutes, energyWh: energy, event: "final" });
    return { assetId: asset.id, initialWh: asset.initialWh, finalWh: energy, minimumWh: minimum, trajectory };
  });
}

export function scenarioMetrics(scenario: Scenario, result?: PlanResult): ScenarioMetrics {
  const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);
  const minimumChargeWh = sum(scenario.assets.map((asset) => Math.max(0,
    sum(scenario.tasks.filter((task) => task.assetId === asset.id).map((task) => task.consumptionWh))
      + asset.finalTargetWh - asset.initialWh)));
  const feasible = result?.status === "feasible";
  const chargedEnergyWh = feasible ? sum(result.segments.map((segment) => segment.energyWh)) : null;
  const gridEnergyWh = feasible ? sum(result.segments.map((segment) => segment.gridEnergyWh)) : null;
  const price = scenario.pricePerKwh ?? scenario.priceUsdPerKwh;
  return {
    initialEnergyWh: sum(scenario.assets.map((asset) => asset.initialWh)),
    taskEnergyWh: sum(scenario.tasks.map((task) => task.consumptionWh)),
    requiredFinalWh: sum(scenario.assets.map((asset) => asset.finalTargetWh)),
    minimumChargeWh,
    // This is a total supply bound, not a proof of feasibility for individual vehicles.
    availableChargeWh: sum(scenario.gridPowerWBySlot.map((power) => Math.min(power, scenario.chargerPowerW) * scenario.slotMinutes / 60 * (scenario.chargingEfficiencyPct ?? 100) / 100)),
    chargedEnergyWh,
    gridEnergyWh,
    chargingLossWh: gridEnergyWh !== null && chargedEnergyWh !== null ? Math.max(0, gridEnergyWh - chargedEnergyWh) : null,
    peakChargingPowerW: feasible ? Math.max(0, ...result.segments.map((segment) => segment.powerW)) : null,
    totalChargingMinutes: feasible ? sum(result.segments.map((segment) => segment.endMinute - segment.startMinute)) : null,
    energyCostUsd: gridEnergyWh !== null && price !== undefined
      ? gridEnergyWh / 1_000 * price : null,
    chargingCo2Kg: gridEnergyWh !== null && scenario.co2KgPerKwh !== undefined
      ? gridEnergyWh / 1_000 * scenario.co2KgPerKwh : null,
  };
}

export function planScenario(scenario: Scenario): PlanResult {
  const validation = validateScenario(scenario);
  const result: PlanResult = {
    scenarioId: typeof scenario?.id === "string" ? scenario.id : "invalid",
    status: "invalid", segments: [], taskEvents: [], assetStates: [], diagnostics: [], validation, metrics: null,
  };
  if (!validation.valid) {
    result.diagnostics = validation.errors.map((issue) => issue.message);
    return result;
  }
  const flow = new Dinic();
  const balance: number[] = [];
  const node = () => { const id = flow.node(); balance[id] = 0; return id; };
  const source = node(), sink = node();
  const slots = Array.from({ length: scenario.slotCount }, node);
  const time = scenario.assets.map(() => Array.from({ length: scenario.slotCount + 1 }, () => ({ input: node(), output: node() })));
  const bounded = (from: number, to: number, lower: number, upper: number) => {
    balance[from] -= lower; balance[to] += lower;
    return flow.edge(from, to, upper - lower);
  };
  // Wh * 6000 keeps integer percent efficiencies and sub-Wh supply exact.
  const efficiencyPct = scenario.chargingEfficiencyPct ?? 100;
  const units = (wh: number) => wh * FLOW_UNITS_PER_WH;
  const totalBound = units(scenario.assets.reduce((sum, asset) => sum + asset.capacityWh, 0))
    + scenario.gridPowerWBySlot.reduce((sum, power) => sum + power * scenario.slotMinutes * efficiencyPct, 0) + 1;
  const chargeEdges: { assetId: string; slot: number; powerW: number; edge: Edge }[] = [];
  const blocked = new Set(scenario.tasks.map((task) => `${task.assetId}\u0000${task.slot}`));
  for (let slot = 0; slot < scenario.slotCount; slot++) {
    const powerW = Math.min(scenario.chargerPowerW, scenario.gridPowerWBySlot[slot]);
    bounded(source, slots[slot], 0, powerW * scenario.slotMinutes * efficiencyPct);
    scenario.assets.forEach((asset, index) => {
      if (powerW > 0 && !blocked.has(`${asset.id}\u0000${slot}`)) {
        chargeEdges.push({ assetId: asset.id, slot, powerW,
          edge: bounded(slots[slot], time[index][slot].input, 0, powerW * scenario.slotMinutes * efficiencyPct) });
      }
    });
  }
  scenario.assets.forEach((asset, index) => {
    const capacity = units(asset.capacityWh - asset.reserveWh);
    const initial = units(asset.initialWh - asset.reserveWh);
    bounded(source, time[index][0].input, initial, initial);
    for (let slot = 0; slot <= scenario.slotCount; slot++) {
      bounded(time[index][slot].input, time[index][slot].output, 0, capacity);
      if (slot < scenario.slotCount) {
        bounded(time[index][slot].output, time[index][slot + 1].input, 0, capacity);
        const demand = units(scenario.tasks.filter((task) => task.assetId === asset.id && task.slot === slot)
          .reduce((sum, task) => sum + task.consumptionWh, 0));
        if (demand > 0) bounded(time[index][slot].output, sink, demand, demand);
      }
    }
    bounded(time[index][scenario.slotCount].output, sink, units(asset.finalTargetWh - asset.reserveWh), capacity);
  });
  bounded(sink, source, 0, totalBound);
  const superSource = node(), superSink = node();
  let required = 0;
  for (let id = 0; id < superSource; id++) {
    if (balance[id] > 0) { flow.edge(superSource, id, balance[id]); required += balance[id]; }
    else if (balance[id] < 0) flow.edge(id, superSink, -balance[id]);
  }
  const satisfied = flow.maxFlow(superSource, superSink);
  result.certificate = { requiredFlowWh: required / FLOW_UNITS_PER_WH, satisfiedFlowWh: satisfied / FLOW_UNITS_PER_WH, missingFlowWh: (required - satisfied) / FLOW_UNITS_PER_WH };
  if (satisfied !== required) {
    result.status = "infeasible";
    result.metrics = scenarioMetrics(scenario);
    result.diagnostics = [
      "No existe un calendario que cumpla simultáneamente todas las restricciones de este modelo.",
      `Balance del modelo: faltan ${(required - satisfied) / FLOW_UNITS_PER_WH / 1000} kWh de flujo para satisfacer las restricciones. Este certificado no equivale directamente a energía adicional de red ni a una causa raíz.`,
    ];
    if (result.metrics!.minimumChargeWh > result.metrics!.availableChargeWh + EPS)
      result.diagnostics.unshift(`La batería de la flota necesita al menos ${(result.metrics!.minimumChargeWh / 1000).toFixed(1)} kWh; con esta potencia y eficiencia, el cargador sólo podría entregar hasta ${(result.metrics!.availableChargeWh / 1000).toFixed(1)} kWh en todo el turno, incluso antes de considerar las ventanas de cada equipo.`);
    for (const asset of scenario.assets) {
      const demand = scenario.tasks.filter((task) => task.assetId === asset.id).reduce((sum, task) => sum + task.consumptionWh, 0);
      const needed = Math.max(0, demand + asset.finalTargetWh - asset.initialWh);
      const accessible = scenario.gridPowerWBySlot.reduce((sum, power, slot) => sum +
        (blocked.has(`${asset.id}\u0000${slot}`) ? 0 : Math.min(power, scenario.chargerPowerW) * scenario.slotMinutes / 60 * efficiencyPct / 100), 0);
      if (needed > accessible + EPS) result.diagnostics.push(`${asset.name}: requiere al menos ${needed} Wh de carga y sus ventanas ofrecen como máximo ${accessible} Wh, incluso sin competir con otros equipos.`);
    }
    return result;
  }
  result.status = "feasible";
  for (let slot = 0; slot < scenario.slotCount; slot++) {
    let minute = slot * scenario.slotMinutes;
    for (const charge of chargeEdges.filter((item) => item.slot === slot)) {
      const amount = charge.edge.initialCapacity - charge.edge.capacity;
      if (amount <= 0) continue;
      const endMinute = minute + amount / (charge.powerW * efficiencyPct);
      result.segments.push({ assetId: charge.assetId, slot, startMinute: minute, endMinute,
        powerW: charge.powerW, energyWh: amount / FLOW_UNITS_PER_WH, gridEnergyWh: amount / (60 * efficiencyPct) });
      minute = endMinute;
    }
  }
  result.taskEvents = scenario.tasks.map((task) => ({ taskId: task.id, assetId: task.assetId,
    slot: task.slot, minute: (task.slot + 1) * scenario.slotMinutes, consumptionWh: task.consumptionWh }));
  result.assetStates = trajectoryFor(scenario, result.segments);
  result.metrics = scenarioMetrics(scenario, result);
  const verified = verifyPlan(scenario, result);
  if (!verified.valid) {
    result.status = "invalid"; result.metrics = null;
    result.diagnostics = ["El calendario no superó la comprobación independiente.", ...verified.issues];
    result.segments = []; result.taskEvents = []; result.assetStates = [];
    return result;
  }
  result.diagnostics = [
    "Calendario factible bajo los supuestos declarados; verificación independiente aprobada.",
    "La carga se reparte secuencialmente dentro de cada intervalo: nunca hay dos equipos conectados a la vez.",
    "Se prueba factibilidad, sin afirmar mínimo costo, mínimo pico ni mejor productividad.",
  ];
  return result;
}

/** Rebuilds the physical event ledger; it does not trust solver flow, trajectories or metrics. */
export function verifyPlan(scenario: Scenario, plan: PlanResult): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!validateScenario(scenario).valid) return { valid: false, issues: ["El escenario de entrada es inválido."] };
  if (plan.status !== "feasible") return { valid: false, issues: ["Solo puede verificarse un calendario declarado factible."] };
  if (plan.scenarioId !== scenario.id) issues.push("El identificador del calendario no coincide con el escenario.");
  const assets = new Map(scenario.assets.map((asset) => [asset.id, asset]));
  const segments = [...plan.segments].sort((a, b) => a.startMinute - b.startMinute || a.endMinute - b.endMinute);
  let previousEnd = -Infinity;
  for (const segment of segments) {
    if (!assets.has(segment.assetId)) issues.push("Un segmento refiere a un equipo inexistente.");
    if (![segment.startMinute, segment.endMinute, segment.powerW, segment.energyWh, segment.gridEnergyWh].every(Number.isFinite)) {
      issues.push("Un segmento contiene valores no finitos."); continue;
    }
    if (!Number.isInteger(segment.slot) || segment.slot < 0 || segment.slot >= scenario.slotCount) {
      issues.push("Un segmento está fuera del turno."); continue;
    }
    const start = segment.slot * scenario.slotMinutes, end = start + scenario.slotMinutes;
    const commonPower = Math.min(scenario.chargerPowerW, scenario.gridPowerWBySlot[segment.slot]);
    if (segment.endMinute <= segment.startMinute || segment.startMinute < start - EPS || segment.endMinute > end + EPS)
      issues.push("La duración de carga es inválida o cruza un intervalo.");
    if (segment.startMinute < previousEnd - EPS) issues.push("Hay cargas simultáneas en el único cargador.");
    previousEnd = Math.max(previousEnd, segment.endMinute);
    if (segment.powerW <= 0 || Math.abs(segment.powerW - commonPower) > EPS)
      issues.push("La potencia de carga no coincide con la potencia común disponible.");
    const gridWh = segment.powerW * (segment.endMinute - segment.startMinute) / 60;
    const physicalWh = gridWh * (scenario.chargingEfficiencyPct ?? 100) / 100;
    if (segment.gridEnergyWh <= 0 || Math.abs(gridWh - segment.gridEnergyWh) > EPS)
      issues.push("La energía de red no coincide con potencia por tiempo.");
    if (segment.energyWh <= 0 || Math.abs(physicalWh - segment.energyWh) > EPS)
      issues.push("La energía declarada no coincide con potencia por tiempo.");
    if (scenario.tasks.some((task) => task.assetId === segment.assetId && task.slot === segment.slot))
      issues.push("Un equipo está cargando durante un intervalo ocupado por una tarea.");
  }
  const taskIds = new Set<string>();
  for (const event of plan.taskEvents) {
    const task = scenario.tasks.find((item) => item.id === event.taskId);
    if (!task || taskIds.has(event.taskId)) { issues.push("Tarea ausente, desconocida o repetida en el calendario."); continue; }
    taskIds.add(event.taskId);
    if (event.assetId !== task.assetId || event.slot !== task.slot || event.consumptionWh !== task.consumptionWh ||
      event.minute !== (task.slot + 1) * scenario.slotMinutes) issues.push("Un evento de tarea fue alterado.");
  }
  if (taskIds.size !== scenario.tasks.length) issues.push("Faltan tareas en el calendario.");
  for (const asset of scenario.assets) {
    let energy = asset.initialWh;
    type Event = { minute: number; order: number; change: number };
    const events: Event[] = [];
    for (const segment of segments.filter((item) => item.assetId === asset.id)) {
      events.push({ minute: segment.endMinute, order: 0,
        change: segment.powerW * (segment.endMinute - segment.startMinute) / 60 * (scenario.chargingEfficiencyPct ?? 100) / 100 });
    }
    // Scenario tasks are authoritative even when the exported event list has been tampered with.
    for (const task of scenario.tasks.filter((item) => item.assetId === asset.id))
      events.push({ minute: (task.slot + 1) * scenario.slotMinutes, order: 1, change: -task.consumptionWh });
    events.sort((a, b) => a.minute - b.minute || a.order - b.order);
    for (const event of events) {
      energy += event.change;
      if (energy < asset.reserveWh - EPS) issues.push(`${asset.name}: energía bajo reserva.`);
      if (energy > asset.capacityWh + EPS) issues.push(`${asset.name}: capacidad excedida.`);
    }
    if (!Number.isFinite(energy) || energy < asset.finalTargetWh - EPS) issues.push(`${asset.name}: objetivo final incumplido.`);
  }
  return { valid: issues.length === 0, issues: [...new Set(issues)] };
}

const demoAssets: Asset[] = [
  { id: "lhd-01", name: "LHD 01", capacityWh: 240_000, initialWh: 150_000, reserveWh: 30_000, finalTargetWh: 150_000 },
  { id: "lhd-02", name: "LHD 02", capacityWh: 240_000, initialWh: 140_000, reserveWh: 30_000, finalTargetWh: 150_000 },
  { id: "lhd-03", name: "LHD 03", capacityWh: 240_000, initialWh: 160_000, reserveWh: 30_000, finalTargetWh: 150_000 },
];
const demoTasks: Task[] = [
  { id: "t-01", assetId: "lhd-01", slot: 3, consumptionWh: 45_000, label: "Ciclo de producción" },
  { id: "t-02", assetId: "lhd-01", slot: 11, consumptionWh: 50_000, label: "Ciclo de producción" },
  { id: "t-03", assetId: "lhd-01", slot: 19, consumptionWh: 45_000, label: "Ciclo de producción" },
  { id: "t-04", assetId: "lhd-02", slot: 5, consumptionWh: 55_000, label: "Ciclo de producción" },
  { id: "t-05", assetId: "lhd-02", slot: 13, consumptionWh: 45_000, label: "Ciclo de producción" },
  { id: "t-06", assetId: "lhd-02", slot: 21, consumptionWh: 50_000, label: "Ciclo de producción" },
  { id: "t-07", assetId: "lhd-03", slot: 7, consumptionWh: 50_000, label: "Ciclo de producción" },
  { id: "t-08", assetId: "lhd-03", slot: 15, consumptionWh: 45_000, label: "Ciclo de producción" },
  { id: "t-09", assetId: "lhd-03", slot: 23, consumptionWh: 45_000, label: "Ciclo de producción" },
];
export const demoScenarios: Scenario[] = [
  { id: "normal", name: "Turno de referencia", slotMinutes: 15, slotCount: 32, chargerPowerW: 120_000,
    gridPowerWBySlot: Array(32).fill(120_000), assets: demoAssets.map((asset) => ({ ...asset })),
    tasks: demoTasks.map((task) => ({ ...task })), priceUsdPerKwh: 0.12, chargingEfficiencyPct: 90 },
  { id: "restricted", name: "Red restringida", slotMinutes: 15, slotCount: 32, chargerPowerW: 120_000,
    gridPowerWBySlot: Array(32).fill(30_000), assets: demoAssets.map((asset) => ({ ...asset })),
    tasks: demoTasks.map((task) => ({ ...task })), priceUsdPerKwh: 0.12, chargingEfficiencyPct: 90 },
  { id: "invalid", name: "Datos por revisar", slotMinutes: 15, slotCount: 32, chargerPowerW: 120_000,
    gridPowerWBySlot: Array(32).fill(120_000), assets: demoAssets.map((asset, index) =>
      ({ ...asset, initialWh: index === 0 ? 300_000 : asset.initialWh })),
    tasks: demoTasks.map((task) => ({ ...task })), priceUsdPerKwh: 0.12, chargingEfficiencyPct: 90 },
];
