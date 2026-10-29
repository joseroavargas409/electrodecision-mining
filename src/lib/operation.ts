import { planScenario, type Scenario } from "./planner.ts";
export type LoadKind = "mill"|"crusher"|"conveyor"|"fan"|"pump"|"compressor"|"workshop"|"office"|"lighting"|"drill"|"flotation"|"water";
export type OperationLoad = { id:string;name:string;area:string;kind:LoadKind;units:number;kw:number;factor:number;critical:boolean;profile:"continuous"|"production"|"day"|"batch"|"night";position:[number,number,number];basis:string };
export const operationSources = [
 {title:"Metso · diseño de circuitos de conminución",url:"https://www.metso.com/insights/blog/mining-and-metals/how-to-ensure-energy-efficiency-in-mining-part-one/",basis:"Justifica incluir chancado y molienda. No calibra las potencias de esta mina ficticia."},
 {title:"Epiroc · electrificación y ventilación",url:"https://www.epirocgroup.com/en/accelerate-the-transformation/electric-equipment-changes-more-than-emissions",basis:"Relaciona electrificación, ventilación y diseño minero. No se trasladan porcentajes de ahorro."},
 {title:"DOE · evaluación de sistemas de bombeo",url:"https://www.energy.gov/cmei/ito/pump-systems",basis:"Orienta a medir caudal, altura, control y eficiencia. Las bombas de la demo son supuestos."},
 {title:"GMG · vehículos eléctricos en minería subterránea",url:"https://gmggroup.org/recommended-practices-for-battery-electric-vehicles-in-underground-mining-version-3/",basis:"Referencia de operación e infraestructura BEV; no certifica este diagnóstico."},
];
export const operationLoads:OperationLoad[] = [
 {id:"mill",name:"Molienda y clasificación",area:"Concentradora",kind:"mill",units:1,kw:5500,factor:.82,critical:true,profile:"continuous",position:[28,0,24],basis:"Circuito agregado de 5,5 MW eléctricos instalados; hipótesis para una concentradora de 240 t/h. Incluye auxiliares propios."},
 {id:"crush",name:"Chancado primario",area:"Concentradora",kind:"crusher",units:1,kw:315,factor:.78,critical:false,profile:"production",position:[6,0,19],basis:"Motor eléctrico de 315 kW supuesto; tolva intermedia. No corresponde a un modelo OEM concreto."},
 {id:"belts",name:"Correas de mineral",area:"Concentradora",kind:"conveyor",units:3,kw:90,factor:.72,critical:false,profile:"production",position:[16,0,19],basis:"Tres accionamientos de 90 kW; potencia eléctrica de entrada, sin volver a dividir por eficiencia."},
 {id:"float",name:"Flotación y reactivos",area:"Concentradora",kind:"flotation",units:1,kw:900,factor:.77,critical:true,profile:"continuous",position:[51,0,22],basis:"Agregado de agitadores, soplantes y dosificación. Se excluye de las otras categorías para evitar doble conteo."},
 {id:"water",name:"Espesado, filtrado y relaves",area:"Agua y relaves",kind:"water",units:1,kw:420,factor:.67,critical:true,profile:"continuous",position:[62,0,-1],basis:"Agregado supuesto de separación sólido-líquido y transporte de relaves; sin modelo hidráulico."},
 {id:"vent-main",name:"Ventilación principal",area:"Mina subterránea",kind:"fan",units:2,kw:630,factor:.84,critical:true,profile:"continuous",position:[-45,0,-30],basis:"Dos ventiladores de 630 kW de entrada; operación continua. Ningún escenario reduce ventilación crítica."},
 {id:"vent-aux",name:"Ventilación auxiliar",area:"Mina subterránea",kind:"fan",units:6,kw:75,factor:.72,critical:true,profile:"continuous",position:[-32,0,-39],basis:"Seis ventiladores de 75 kW; perfiles agregados. Caudales, red y requerimientos sanitarios pendientes."},
 {id:"dewater",name:"Desagüe de mina",area:"Mina subterránea",kind:"pump",units:4,kw:110,factor:.68,critical:true,profile:"continuous",position:[-11,0,-35],basis:"Cuatro bombas eléctricas de 110 kW. Factor agregado de carga/ciclo; falta altura, caudal y curva real."},
 {id:"drill",name:"Perforación electrohidráulica",area:"Mina subterránea",kind:"drill",units:2,kw:160,factor:.70,critical:false,profile:"production",position:[42,14,-25],basis:"Dos equipos conectados a red en ventanas sintéticas. No duplica la recarga de LHD."},
 {id:"air",name:"Aire comprimido",area:"Servicios industriales",kind:"compressor",units:3,kw:150,factor:.62,critical:true,profile:"continuous",position:[-28,0,4],basis:"Tres compresores, demanda agregada; falta presión, caudal y diagnóstico de fugas."},
 {id:"process-water",name:"Bombeo de agua de proceso",area:"Agua y relaves",kind:"pump",units:3,kw:132,factor:.70,critical:true,profile:"continuous",position:[60,0,-18],basis:"Circuito de agua de proceso independiente del desagüe y de los motores de relaves."},
 {id:"workshop",name:"Talleres y soldadura",area:"Servicios industriales",kind:"workshop",units:1,kw:180,factor:.48,critical:false,profile:"day",position:[-39,0,21],basis:"Demanda diversificada del taller; excluye cargador y compresores contabilizados por separado."},
 {id:"camp",name:"Oficinas y campamento",area:"Servicios generales",kind:"office",units:1,kw:250,factor:.62,critical:false,profile:"day",position:[-58,0,32],basis:"Incluye climatización, cocina, laboratorio y comunicaciones; potencia eléctrica agregada supuesta."},
 {id:"lights",name:"Iluminación y comunicaciones mina",area:"Servicios generales",kind:"lighting",units:1,kw:130,factor:.72,critical:true,profile:"night",position:[-2,0,35],basis:"Base permanente y aumento nocturno; no representa cálculo lumínico ni cobertura de radio."},
 {id:"utility",name:"Tratamiento de agua y servicios menores",area:"Servicios generales",kind:"water",units:1,kw:95,factor:.58,critical:true,profile:"continuous",position:[65,0,35],basis:"Incluye agua potable y saneamiento; no duplicado con agua de proceso."},
 {id:"batch",name:"Lavado y equipos auxiliares de patio",area:"Servicios industriales",kind:"workshop",units:1,kw:220,factor:.70,critical:false,profile:"batch",position:[-8,0,26],basis:"Carga flexible en ventanas ilustrativas. Desplazarla exige validar disponibilidad operacional."},
];
export type OperationSettings = { limitKw:number;lossPct:number;tariff:number;factorCo2:number;tonnesHour:number;mode:"base"|"stress"|"staggered" };
export const defaultOperation:OperationSettings={limitKw:10000,lossPct:3,tariff:.12,factorCo2:.25,tonnesHour:240,mode:"base"};
export function loadPower(load:OperationLoad,slot:number,mode:OperationSettings["mode"]):number {
 const hour=slot/4; const waveSlot=load.profile==="batch"&&mode==="staggered"?(slot+20)%96:slot; const wave=1+.035*Math.sin((waveSlot+load.id.length*3)*Math.PI/12);
 let duty=1;
 if(load.profile==="production") duty=(hour%8>=.5&&hour%8<6.75)?1:.22;
 if(load.profile==="day") duty=hour>=7&&hour<19?1:.22;
 if(load.profile==="night") duty=hour<6||hour>=19?1:.55;
 if(load.profile==="batch") {const h=mode==="staggered"?(hour+5)%24:hour;duty=(h>=10&&h<12)||(h>=18&&h<20)?1:.05;}
 return load.units*load.kw*load.factor*duty*wave*(mode==="stress"?1.15:1);
}
export function diagnoseOperation(loads:OperationLoad[],settings:OperationSettings, fleetScenario:Scenario) {
 if(!Number.isFinite(settings.limitKw)||settings.limitKw<=0||!Number.isFinite(settings.lossPct)||settings.lossPct<0||settings.lossPct>15||!Number.isFinite(settings.tariff)||settings.tariff<0||!Number.isFinite(settings.factorCo2)||settings.factorCo2<0||!Number.isFinite(settings.tonnesHour)||settings.tonnesHour<=0||!["base","stress","staggered"].includes(settings.mode)) throw Error("Revisa potencia, pérdidas, tarifa, factor y tratamiento.");
 if(loads.some(l=>!Number.isFinite(l.kw)||l.kw<0||l.kw>100000||!Number.isFinite(l.factor)||l.factor<0||l.factor>1)) throw Error("Potencias y factores deben ser válidos.");
 const rows=loads.map(l=>({id:l.id,name:l.name,area:l.area,profile:Array.from({length:96},(_,i)=>loadPower(l,i,settings.mode))}));
 const background=Array.from({length:96},(_,i)=>rows.reduce((sum,l)=>sum+l.profile[i],0));
 const coupling=fleetScenario.slotCount<=72;
 const fleet={...structuredClone(fleetScenario),gridPowerWBySlot:fleetScenario.gridPowerWBySlot.map((power,i)=>Math.max(0,Math.floor(Math.min(power,(settings.limitKw*(1-settings.lossPct/100)-background[24+i])*1000))))};
 const plan=coupling?planScenario(fleet):null;
 const fleetKw=Array(96).fill(0) as number[];
 if(plan?.status==="feasible") for(const seg of plan.segments)for(let i=24;i<96;i++){const overlap=Math.max(0,Math.min((i-24+1)*15,seg.endMinute)-Math.max((i-24)*15,seg.startMinute));fleetKw[i]+=seg.powerW/1000*overlap/15;}
 const total=background.map((p,i)=>(p+fleetKw[i])/(1-settings.lossPct/100));
 const energy=total.reduce((a,b)=>a+b,0)/4, peak=Math.max(...total),peakSlot=total.indexOf(peak),overload=total.filter(p=>p>settings.limitKw+1e-6).length;
 const sectors=rows.map(row=>({...row,kwh:row.profile.reduce((a,b)=>a+b,0)/4,peakKw:Math.max(...row.profile)})).sort((a,b)=>b.kwh-a.kwh);
 const fleetKwh=fleetKw.reduce((a,b)=>a+b,0)/4;
 const lossesKwh=energy-(background.reduce((a,b)=>a+b,0)/4+fleetKwh);
 return {settings,rows:sectors,background,fleetKw,total,energy,peak,peakSlot,overload,overloadHours:overload/4,loadFactor:peak?energy/24/peak:0,headroom:settings.limitKw-peak,cost:energy*settings.tariff,co2:energy*settings.factorCo2,kwhPerTonne:energy/(settings.tonnesHour*24),fleetKwh,lossesKwh,plan,fleetScenario:fleet,coupling,complete:plan?.status==="feasible",installedKw:loads.reduce((s,l)=>s+l.kw*l.units,0)+fleetScenario.chargerPowerW/1000};
}
