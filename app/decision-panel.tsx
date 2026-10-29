"use client";
import { useMemo } from "react";
import { ArrowRight, Check, Info, PlugZap, TriangleAlert } from "lucide-react";
import { analyzeInfrastructure } from "../src/lib/infrastructure";
import type { Scenario } from "../src/lib/planner";

const number = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 });
const kw = (value: number | null) => value === null ? "—" : number.format(value / 1000);
const state = { feasible: "Factible", infeasible: "No factible", invalid: "Datos inválidos" };

export default function DecisionPanel({ scenario, dirty, onApply, onEvidence }: {
  scenario: Scenario; dirty: boolean; onApply: (powerW: number) => void; onEvidence: () => void;
}) {
  const analysis = useMemo(() => analyzeInfrastructure(scenario), [scenario]);
  const search = analysis.sizing;
  return <section className="panel decision-panel" id="infrastructure" aria-labelledby="decision-title">
    <div className="panel-heading"><div><span className="section-kicker">03 · DECISIÓN DE INFRAESTRUCTURA</span><h2 id="decision-title">¿Qué potencia permite completar el turno?</h2><p>Prueba de potencia uniforme con el cargador y las tareas del último cálculo.</p></div><span className="neutral-tag">Pasos de 1 kW</span></div>
    {dirty && <div className="pending-banner"><Info size={14}/><span>Hay cambios pendientes. Recalcula antes de aplicar una alternativa.</span></div>}
    <div className="decision-summary">
      <div><span>Menor candidato factible del modelo</span><strong>{kw(search.minimumGridPowerW)}<small> kW</small></strong><p>{search.status === "found" ? "Potencia disponible para el cargador, uniforme durante todo el turno." : search.status === "infeasible_at_limit" ? "Sin solución incluso al límite del cargador. Revisa también ventanas, tareas y baterías." : "Corrige las entradas para evaluar alternativas."}</p></div>
      <div className="decision-proof"><span>{search.status === "found" ? <Check size={18}/> : <TriangleAlert size={18}/>}</span><strong>{search.status === "found" ? "Candidato comprobado" : "Revisión necesaria"}</strong><p>{search.diagnostics.join(" ")}</p>{search.minimumGridPowerW !== null && <button className="button primary" disabled={dirty} onClick={() => onApply(search.minimumGridPowerW!)}>Aplicar {kw(search.minimumGridPowerW)} kW uniformes<ArrowRight size={14}/></button>}</div>
    </div>
    {!!analysis.sensitivity.length && <div className="sensitivity"><h3>Si las tareas consumen más energía</h3><p>Mismos horarios, baterías, reservas y objetivos; consumos redondeados hacia arriba a Wh. No se asignan probabilidades.</p><div className="sensitivity-scroll"><table><thead><tr><th>Demanda de tareas</th><th>Consumo batería</th><th>Perfil actual</th><th>Mínimo uniforme</th></tr></thead><tbody>{analysis.sensitivity.map(row => <tr key={row.consumptionPct}><td>{row.consumptionPct === 100 ? "Base" : `+${row.consumptionPct - 100}%`}</td><td>{number.format(row.taskEnergyWh / 1000)} kWh</td><td><span className={"sensitivity-status " + row.currentPowerStatus}>{state[row.currentPowerStatus]}</span></td><td>{row.minimumGridPowerW === null ? "Sin candidato" : `${kw(row.minimumGridPowerW)} kW`}</td></tr>)}</tbody></table></div></div>}
    <details className="decision-details"><summary>Supuestos y candidatos evaluados</summary><ul>{search.assumptions.map(item => <li key={item}>{item}</li>)}</ul><p>{search.trials.map(t => `${kw(t.gridPowerW)} kW: ${state[t.status]}`).join(" · ") || "Sin evaluación válida."}</p></details>
    <div className="decision-note"><PlugZap size={17}/><p><strong>Evaluación preliminar de carga.</strong> El resultado sustituye el perfil existente por uno uniforme; incluye también horas que antes tenían cortes. No representa una ampliación aprobada, un óptimo continuo ni el dimensionamiento de la red de la mina.<button onClick={onEvidence}>Ver evidencia y datos por validar<ArrowRight size={12}/></button></p></div>
  </section>;
}
