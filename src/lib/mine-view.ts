import type { PlanResult, Scenario } from "./planner.ts";

export type MineItem = {
  id: string;
  label: string;
  kind: "charger" | "battery" | "packs" | "substation" | "trolley";
  position: [number, number, number];
  proposed?: boolean;
};
export type MineLayout = { id: string; name: string; description: string; items: MineItem[] };
export type FleetSnapshot = {
  id: string;
  label: string;
  soc: number | null;
  state: "charging" | "working" | "idle" | "unknown";
};

const substation: MineItem = { id: "substation-main", label: "Alimentación eléctrica", kind: "substation", position: [-55, 0, 8] };
const packs: MineItem = { id: "pack-rack", label: "Baterías de intercambio", kind: "packs", position: [-24, 0, 29], proposed: true };
export const mineLayouts: MineLayout[] = [
  {
    id: "central", name: "Base central",
    description: "Carga y baterías junto al taller, en la plataforma inferior.",
    items: [substation, { id: "charger-main", label: "Cargador del escenario", kind: "charger", position: [-35, 0, 22] }, { id: "battery-buffer", label: "Batería estacionaria", kind: "battery", position: [-48, 0, 26], proposed: true }, packs],
  },
  {
    id: "distributed", name: "Puntos distribuidos",
    description: "El cargador se ubica al inicio de la rampa; un segundo punto queda propuesto.",
    items: [substation, { id: "charger-main", label: "Cargador del escenario", kind: "charger", position: [-18, 0, -10] }, { id: "battery-buffer", label: "Batería estacionaria", kind: "battery", position: [-29, 0, -10], proposed: true }, { id: "charger-option", label: "Punto de carga adicional", kind: "charger", position: [-35, 0, 22], proposed: true }, packs],
  },
  {
    id: "trolley", name: "Rampa con trolley",
    description: "Una línea aérea propuesta acompaña el ascenso. La carga estacionaria sigue en la base.",
    items: [substation, { id: "charger-main", label: "Cargador del escenario", kind: "charger", position: [-35, 0, 22] }, { id: "battery-buffer", label: "Batería estacionaria", kind: "battery", position: [-48, 0, 26], proposed: true }, { id: "trolley-ramp", label: "Línea trolley propuesta", kind: "trolley", position: [8, 7, -20], proposed: true }],
  },
];

export function fleetAtMinute(scenario: Scenario, result: PlanResult, minute: number): FleetSnapshot[] {
  const time = Math.max(0, Math.min(scenario.slotCount * scenario.slotMinutes, minute));
  return scenario.assets.map(asset => {
    if (result.status !== "feasible") return { id: asset.id, label: asset.name, soc: null, state: "unknown" };
    const segments = result.segments.filter(segment => segment.assetId === asset.id);
    const charged = segments.reduce((total, segment) => total + segment.energyWh * Math.max(0, Math.min(1, (time - segment.startMinute) / (segment.endMinute - segment.startMinute))), 0);
    const consumed = result.taskEvents.filter(event => event.assetId === asset.id && event.minute <= time).reduce((total, event) => total + event.consumptionWh, 0);
    const charging = segments.some(segment => segment.startMinute <= time && time < segment.endMinute);
    const working = scenario.tasks.some(task => task.assetId === asset.id && task.slot * scenario.slotMinutes <= time && time < (task.slot + 1) * scenario.slotMinutes);
    return {
      id: asset.id, label: asset.name,
      soc: (asset.initialWh + charged - consumed) / asset.capacityWh * 100,
      state: charging ? "charging" : working ? "working" : "idle",
    };
  });
}

export function infrastructureDescription(item: MineItem, scenario: Scenario): { label: string; value: string; explanation: string } {
  if (item.kind === "charger" && !item.proposed) return { label: "Vinculado al plan", value: `${scenario.chargerPowerW / 1000} kW`, explanation: "Es el único cargador del calendario calculado. La posición es ilustrativa; el modelo no incluye desvíos, traslados ni tiempo de conexión." };
  if (item.kind === "substation") {
    const powers = scenario.gridPowerWBySlot.map(power => power / 1000), minimum = Math.min(...powers), maximum = Math.max(...powers);
    return { label: "Vinculado al escenario", value: minimum === maximum ? `${minimum} kW disponibles` : `${minimum}–${maximum} kW disponibles`, explanation: "Muestra la potencia declarada para la carga de la flota. El volumen representa un punto de alimentación; no dimensiona ni especifica un transformador." };
  }
  if (item.kind === "battery") return { label: "Infraestructura propuesta", value: "Capacidad por definir", explanation: "Almacenamiento estacionario para estudiar una futura gestión de picos. No aporta energía ni reduce la potencia de red en el cálculo actual." };
  if (item.kind === "packs") return { label: "Infraestructura propuesta", value: "Intercambio por estudiar", explanation: "Packs removibles de repuesto. Son distintos de una batería estacionaria. El calendario actual usa recarga directa y no simula intercambios." };
  if (item.kind === "trolley") return { label: "Infraestructura propuesta", value: "Suministro en movimiento", explanation: "La línea es conceptual. No alimenta los vehículos del calendario ni calcula ahorro, tráfico o regeneración. Su evaluación requiere vehículos compatibles y un modelo adicional." };
  return { label: "Infraestructura propuesta", value: "Segundo punto por estudiar", explanation: "Una ubicación alternativa para una futura ampliación. No cuenta como otro cargador disponible: el calendario conserva un único cargador compartido." };
}
