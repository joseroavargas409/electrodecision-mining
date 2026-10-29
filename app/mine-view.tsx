"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BatteryCharging, Box, Check, ChevronRight, CirclePause, CirclePlay, Info, MapPin, Move3D, RotateCcw, RotateCw, Sparkles, Zap, ZoomIn, ZoomOut } from "lucide-react";
import type { PlanResult, Scenario } from "../src/lib/planner";
import { fleetAtMinute, infrastructureDescription, mineLayouts } from "../src/lib/mine-view";
import type { mountMineScene } from "./mine3d-renderer";

type SceneController = ReturnType<typeof mountMineScene>;
const number = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 });
const clock = (minute: number) => `${String(6 + Math.floor(minute / 60)).padStart(2, "0")}:${String(Math.floor(minute % 60)).padStart(2, "0")}`;
const states = { charging: "En carga", working: "En tarea", idle: "Disponible", unknown: "Sin plan válido" };

export default function MineView({ scenario, result, dirty, onBack, onAnalyze, onSimulation }: { scenario: Scenario; result: PlanResult; dirty: boolean; onBack: () => void; onAnalyze: () => void; onSimulation: () => void }) {
  const [layoutId, setLayoutId] = useState("central"), [selectedId, setSelectedId] = useState("charger-main");
  const [minute, setMinute] = useState(0), [playing, setPlaying] = useState(false);
  const [renderState, setRenderState] = useState<"loading" | "ready" | "unavailable">("loading");
  const host = useRef<HTMLDivElement>(null), controller = useRef<SceneController | null>(null);
  const duration = scenario.slotCount * scenario.slotMinutes;
  const layout = mineLayouts.find(item => item.id === layoutId) ?? mineLayouts[0];
  const selected = layout.items.find(item => item.id === selectedId) ?? layout.items[0];
  const detail = infrastructureDescription(selected, scenario);
  const fleet = useMemo(() => fleetAtMinute(scenario, result, minute), [scenario, result, minute]);
  const latest = useRef({ fleet, selectedId });
  latest.current = { fleet, selectedId };

  useEffect(() => {
    let cancelled = false;
    let scene: SceneController | null = null;
    setRenderState("loading");
    import("./mine3d-renderer").then(module => {
      if (cancelled || !host.current) return;
      scene = module.mountMineScene(host.current, layout.items, latest.current.fleet, setSelectedId);
      controller.current = scene;
      scene.select(latest.current.selectedId);
      setRenderState("ready");
    }).catch(() => { if (!cancelled) setRenderState("unavailable"); });
    return () => { cancelled = true; scene?.dispose(); if (controller.current === scene) controller.current = null; };
  }, [layout]);
  useEffect(() => { controller.current?.updateVehicles(fleet); controller.current?.setSimulationMinute(minute); }, [fleet,minute,renderState]);
  useEffect(() => { controller.current?.select(selectedId); }, [selectedId]);
  useEffect(() => { setPlaying(false); setMinute(0); }, [scenario, result]);
  useEffect(() => {
    if (!playing) return;
    if (minute >= duration) { setPlaying(false); return; }
    const timer = window.setTimeout(() => setMinute(previous => Math.min(duration, previous + 5)), 350);
    return () => window.clearTimeout(timer);
  }, [playing, duration, minute]);

  function chooseLayout(id: string) { setLayoutId(id); setSelectedId("charger-main"); }
  function saveLayout() {
    const content = JSON.stringify({ title: "ElectroDecision · ubicación ficticia", layout: layout.name, schematic: true, numericalEffect: "none", items: layout.items, scenarioId: scenario.id, note: "La ubicación no altera los cálculos. Baterías propuestas, intercambio y trolley no participan del plan." }, null, 2);
    const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = `electrodecision-ubicacion-${layout.id}.json`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <section className="mine-page">
    <a className="button primary" href="#simulacion-mina" onClick={onSimulation}><CirclePlay size={16}/>Simular mina, planta y servicios eléctricos<ArrowRight size={14}/></a>
    <div className="mine-heading"><div><span className="eyebrow"><i />VISOR DE INFRAESTRUCTURA</span><h1>Una ubicación para cada alternativa.</h1><p>Explora una mina ficticia y sitúa la carga, las baterías y una línea trolley propuesta.</p></div><button className="button secondary" onClick={onBack}><ArrowLeft size={14} />Volver al planificador</button></div>
    <div className="mine-layouts" aria-label="Ubicaciones ficticias">{mineLayouts.map((item, index) => <button key={item.id} className={layout.id === item.id ? "active" : ""} onClick={() => chooseLayout(item.id)} aria-pressed={layout.id === item.id}><span className="mine-letter">{String.fromCharCode(65 + index)}</span><span><strong>{item.name}</strong><small>{item.description}</small></span>{layout.id === item.id ? <Check size={16} /> : <ChevronRight size={16} />}</button>)}</div>
    {dirty && <div className="mine-pending"><Info size={15} /><p>Hay cambios pendientes en el planificador. Aquí se muestra el último escenario calculado.</p><button onClick={onBack}>Revisar cambios<ArrowRight size={12} /></button></div>}
    <div className="mine-workspace">
      <div className="mine-scene-panel">
        <div className="mine-scene-top"><span><i />Mina ficticia · ubicación ilustrativa</span><span>Volúmenes esquemáticos · sin escala operacional</span></div>
        <div className="mine-canvas-wrap">
          <div ref={host} className="mine-canvas" role="img" aria-label={`Vista 3D de la alternativa ${layout.name}. Los elementos también se pueden seleccionar en la lista de infraestructura.`} />
          {renderState === "loading" && <div className="mine-loading"><Box size={28} /><strong>Preparando la mina 3D…</strong></div>}
          {renderState === "unavailable" && <div className="mine-loading"><Box size={28} /><strong>Vista 3D no disponible en este navegador</strong><p>Puedes explorar las ubicaciones y fichas desde la lista de infraestructura.</p></div>}
          {renderState === "ready" && <span className="mine-orbit-hint"><Move3D size={13} />Arrastra para girar · rueda para acercar · selecciona un elemento</span>}
        </div>
        <div className="mine-camera-controls" aria-label="Controles de cámara"><div>{([['overview', 'General'], ['top', 'Planta'], ['ramp', 'Rampa']] as const).map(([view, label]) => <button key={view} disabled={renderState !== "ready"} onClick={() => controller.current?.camera(view)}>{label}</button>)}</div><div><button disabled={renderState !== "ready"} onClick={() => controller.current?.rotate(-1)} aria-label="Girar cámara a la izquierda"><RotateCcw size={16} /></button><button disabled={renderState !== "ready"} onClick={() => controller.current?.rotate(1)} aria-label="Girar cámara a la derecha"><RotateCw size={16} /></button><button disabled={renderState !== "ready"} onClick={() => controller.current?.zoom(1)} aria-label="Acercar cámara"><ZoomIn size={16} /></button><button disabled={renderState !== "ready"} onClick={() => controller.current?.zoom(-1)} aria-label="Alejar cámara"><ZoomOut size={16} /></button></div></div>
        <div className="mine-playback"><div><button className="mine-play" disabled={result.status !== "feasible"} onClick={() => { if (minute >= duration) setMinute(0); setPlaying(value => !value); }} aria-label={playing ? "Pausar turno" : "Reproducir turno"}>{playing ? <CirclePause size={24} /> : <CirclePlay size={24} />}</button><strong>{clock(minute)}</strong><span>del turno calculado</span><small>{scenario.name}</small></div><label><span className="sr-only">Minuto del turno</span><input type="range" min="0" max={duration} step="1" value={minute} disabled={result.status !== "feasible"} onChange={event => { setPlaying(false); setMinute(Number(event.target.value)); }} /><span><small>{clock(0)}</small><small>{clock(duration)}</small></span></label></div>
        <div className="mine-fleet" aria-label="Estado de los equipos en el minuto seleccionado">{fleet.map(vehicle => <div key={vehicle.id} className={vehicle.state}><span><BatteryCharging size={15} />{vehicle.label}</span><strong>{vehicle.soc === null ? "—" : number.format(vehicle.soc) + "%"}</strong><small>{states[vehicle.state]}</small></div>)}</div>
        <p className="mine-time-note">Batería y carga siguen el calendario calculado. La posición de los vehículos es ilustrativa; no representa una simulación de tráfico.</p>
      </div>
      <aside className="mine-inspector" aria-label="Infraestructura de la ubicación">
        <span className="section-kicker">EXPLORA LOS ELEMENTOS</span><h2>Infraestructura</h2><p>Selecciona en la escena o en esta lista.</p>
        <div className="mine-object-list">{layout.items.map(item => <button key={item.id} className={selected.id === item.id ? "selected" : ""} onClick={() => setSelectedId(item.id)} aria-pressed={selected.id === item.id}><span className={item.proposed ? "proposed" : "linked"}>{item.kind === "charger" || item.kind === "substation" ? <Zap size={16} /> : item.kind === "trolley" ? <Move3D size={16} /> : <BatteryCharging size={16} />}</span><span><strong>{item.label}</strong><small>{item.proposed ? "Propuesta · fuera del cálculo" : "Datos del escenario"}</small></span><ChevronRight size={13} /></button>)}</div>
        <div className={"mine-detail " + (selected.proposed ? "proposed" : "linked")} aria-live="polite"><span><MapPin size={12} />{detail.label}</span><h3>{selected.label}</h3><strong>{detail.value}</strong><p>{detail.explanation}</p></div>
        <button className="button secondary mine-download" onClick={saveLayout}><Box size={14} />Descargar ubicación JSON</button>
      </aside>
    </div>
    <div className="mine-footer-note"><Info size={19} /><div><strong>Compara ubicaciones, conserva los supuestos.</strong><p>Las alternativas cambian la distribución visual. El cálculo mantiene un cargador compartido; moverlo no modifica distancias, consumos ni tiempos de conexión. El almacenamiento, el intercambio y el trolley se muestran como propuestas.</p></div><button className="button secondary" disabled={dirty} onClick={onAnalyze}><Sparkles size={14} />Analizar potencia del escenario<ArrowRight size={13} /></button></div>
  </section>;
}
