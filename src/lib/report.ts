import type { PlanResult, Scenario } from "./planner.ts";
import { verifyPlan } from "./planner.ts";
import { analyzeInfrastructure } from "./infrastructure.ts";
import { dataRequirements, evidenceCards, evidenceReviewedOn } from "./evidence.ts";

export function reportPayload(scenario: Scenario, result: PlanResult, assistant: { mode: string; connection: string }) {
  return { application: "ElectroDecision", schemaVersion: 2, algorithmVersion: "0.2.0",
    notice: "Escenario sintético. Evaluación preliminar bajo supuestos; no diseño de infraestructura aprobado ni ahorro real.",
    scenario, result, verified: result.status === "feasible" && verifyPlan(scenario, result).valid,
    infrastructure: analyzeInfrastructure(scenario), evidenceReviewedOn, evidence: evidenceCards, dataRequirements,
    assistantMode: assistant.mode, assistantConnection: assistant.connection };
}

const escape = (value: unknown) => String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const format = (value: number | null | undefined) => value == null ? "No disponible" : new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 }).format(value);

export function renderReport(scenario: Scenario, result: PlanResult, assistant: { mode: string; connection: string }): string {
  const data = reportPayload(scenario, result, assistant);
  const sizing = data.infrastructure.sizing;
  const status = { feasible: "Plan factible", infeasible: "Sin plan factible", invalid: "Datos inválidos" };
  const metric = result.status === "feasible" ? result.metrics : null;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ElectroDecision · Informe</title><style>body{font:15px/1.65 system-ui;max-width:1000px;margin:36px auto;padding:0 24px;color:#193b48}h1{font-size:36px}h2{margin-top:32px}table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:10px;border-bottom:1px solid #dde7e9}.note{background:#eef6f3;border-left:4px solid #087e7d;padding:16px}pre{white-space:pre-wrap;word-break:break-word;background:#f4f7f8;padding:18px}a{color:#087e7d}small{color:#55717b}@media print{body{margin:0}.note,table{break-inside:avoid}}</style></head><body>
  <h1>ElectroDecision</h1><p>${escape(scenario.name)} · v0.2.0</p><p class="note">${escape(data.notice)}</p>
  <h2>${status[result.status]}</h2><p>Verificación independiente del calendario: ${data.verified ? "aprobada" : "no aplicable o no aprobada"}.</p>
  <table><tr><th>Magnitud del plan</th><th>Resultado</th></tr><tr><td>Energía recibida por baterías</td><td>${format(metric?.chargedEnergyWh == null ? null : metric.chargedEnergyWh / 1000)} kWh</td></tr><tr><td>Energía desde la red</td><td>${format(metric?.gridEnergyWh == null ? null : metric.gridEnergyWh / 1000)} kWh</td></tr><tr><td>Pérdidas de carga</td><td>${format(metric?.chargingLossWh == null ? null : metric.chargingLossWh / 1000)} kWh</td></tr><tr><td>Eficiencia constante asumida</td><td>${scenario.chargingEfficiencyPct ?? 100}%</td></tr><tr><td>Costo variable de energía desde la red</td><td>${format(metric?.energyCostUsd)} USD</td></tr></table>
  <h2>Evaluación preliminar de potencia uniforme</h2><p>Menor candidato factible: ${sizing.minimumGridPowerW === null ? "no encontrado" : format(sizing.minimumGridPowerW / 1000) + " kW"}. Paso de búsqueda: ${sizing.stepW / 1000} kW; cargador existente: ${sizing.chargerLimitW / 1000} kW.</p><ul>${sizing.diagnostics.map(s => `<li>${escape(s)}</li>`).join("")}</ul><ul>${sizing.assumptions.map(s => `<li>${escape(s)}</li>`).join("")}</ul>
  <table><tr><th>Consumo de tareas</th><th>Perfil actual</th><th>Menor candidato uniforme</th></tr>${data.infrastructure.sensitivity.map(row => `<tr><td>${row.consumptionPct}% del caso base</td><td>${status[row.currentPowerStatus]}</td><td>${row.minimumGridPowerW === null ? "Sin candidato" : format(row.minimumGridPowerW / 1000) + " kW"}</td></tr>`).join("")}</table>
  <h2>Diagnóstico del calendario</h2><ul>${result.diagnostics.map(s => `<li>${escape(s)}</li>`).join("")}</ul>
  <h2>Datos por validar para una operación real</h2>${dataRequirements.map(item => `<h3>${escape(item.label)}</h3><p>${escape(item.needed)} ${escape(item.reason)}</p>`).join("")}
  <h2>Evidencia documental</h2><p>Revisión: ${evidenceReviewedOn}. Las fuentes orientan el alcance y no calibran los parámetros sintéticos.</p><ul>${evidenceCards.map(item => `<li><a href="${escape(item.url)}">${escape(item.organization)} · ${escape(item.title)}</a>. ${escape(item.limitation)}</li>`).join("")}</ul>
  <h2>Supuestos y modo de asistencia</h2><p>Un cargador, equipos compatibles, tareas fijas, consumo al final de cada intervalo de 15 minutos y carga secuencial. Eficiencia constante; sin traslados, conexión, curva de carga, temperatura ni degradación. No se optimiza costo total ni producción.</p><p>Asistente: ${escape(assistant.mode)}; conexión: ${escape(assistant.connection)}. Configuración no equivale a inferencia real comprobada.</p>
  <h2>Escenario y resultados reproducibles</h2><pre>${escape(JSON.stringify(data, null, 2))}</pre></body></html>`;
}
