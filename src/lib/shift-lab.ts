/** Synthetic direct-charge underground haulage case. No OEM/site calibration. */
export type ShiftConfig={hours:number;fleet:number;payloadT:number;emptyMassT:number;distanceKm:number;gradePct:number;rollingPct:number;loadedKmh:number;emptyKmh:number;serviceMin:number;tractionKw:number;brakingKw:number;auxKw:number;driveEfficiency:number;regenEfficiency:number;batteryKwh:number;sohPct:number;initialSocPct:number;reservePct:number;chargeTargetPct:number;chargerKw:number;chargers:number;chargeEfficiency:number;connectionMin:number;limitKw:number;baseKw:number;lossPct:number;gridFactor:number;tariff:number;dieselUsdL:number;dieselEfficiency:number;targetT:number;outageStart:number;outageMin:number;weatherPct:number;seed:number;managed:boolean;chargerCapexUsd:number;lostMarginUsdT:number};
export const shiftDefaults:ShiftConfig={hours:12,fleet:4,payloadT:18,emptyMassT:50,distanceKm:1.2,gradePct:7,rollingPct:2,loadedKmh:12,emptyKmh:16,serviceMin:6,tractionKw:250,brakingKw:300,auxKw:12,driveEfficiency:.86,regenEfficiency:.55,batteryKwh:300,sohPct:85,initialSocPct:80,reservePct:20,chargeTargetPct:85,chargerKw:180,chargers:1,chargeEfficiency:.93,connectionMin:3,limitKw:1050,baseKw:860,lossPct:3,gridFactor:.25,tariff:.12,dieselUsdL:1.2,dieselEfficiency:.32,targetT:1700,outageStart:330,outageMin:90,weatherPct:15,seed:20261029,managed:true,chargerCapexUsd:150000,lostMarginUsdT:12};
export const labSources=[
 {title:'GMG · prácticas para BEV en minería subterránea',url:'https://gmggroup.org/wp-content/uploads/2023/12/2022-06-23_Recommended-Practices-for-Battery-Electric-Vehicles-in-Underground-Mining.pdf',basis:'Orienta ciclo de trabajo, disponibilidad, métodos de carga y requerimientos de información. No calibra los parámetros del caso.'},
 {title:'Sandvik · LH518iB',url:'https://www.mining.sandvik/en/products/equipment/loaders/lh518ib-battery-electric-loader/',basis:'Referencia de escala: cargadores de 18 t y baterías de cientos de kWh. El equipo genérico de la demo no es este modelo: usa recarga directa y no AutoSwap.'},
];
export function validateShift(v:unknown):{valid:boolean;errors:string[]}{
 const errors:string[]=[];if(!v||typeof v!=='object')return{valid:false,errors:['Incluye una configuración.']};const s=v as ShiftConfig;
 if(Object.keys(s).some(k=>!Object.prototype.hasOwnProperty.call(shiftDefaults,k)))errors.push('La configuración contiene campos no admitidos.');
 const ranges:Record<Exclude<keyof ShiftConfig,'managed'>,[number,number]>={hours:[1,24],fleet:[1,12],payloadT:[1,80],emptyMassT:[10,150],distanceKm:[.1,10],gradePct:[-15,15],rollingPct:[.5,6],loadedKmh:[2,30],emptyKmh:[2,35],serviceMin:[1,30],tractionKw:[50,1000],brakingKw:[50,1000],auxKw:[0,60],driveEfficiency:[.4,1],regenEfficiency:[0,.9],batteryKwh:[50,1500],sohPct:[50,100],initialSocPct:[10,100],reservePct:[5,60],chargeTargetPct:[20,100],chargerKw:[10,1500],chargers:[1,6],chargeEfficiency:[.5,1],connectionMin:[0,15],limitKw:[100,20000],baseKw:[0,15000],lossPct:[0,15],gridFactor:[0,2],tariff:[0,3],dieselUsdL:[0,10],dieselEfficiency:[.1,.6],targetT:[1,20000],outageStart:[0,1440],outageMin:[0,720],weatherPct:[0,80],seed:[1,2147483647],chargerCapexUsd:[0,10000000],lostMarginUsdT:[0,10000]};
 for(const [key,[min,max]] of Object.entries(ranges)){const val=s[key as keyof ShiftConfig];if(typeof val!=='number'||!Number.isFinite(val)||val<min||val>max)errors.push(`Revisa ${key} (${min}–${max}).`)}
 if(typeof s.managed!=='boolean')errors.push('Indica si la carga respeta el límite de red.');
 if(!Number.isInteger(s.fleet)||!Number.isInteger(s.chargers)||!Number.isInteger(s.seed))errors.push('Flota, cargadores y semilla deben ser enteros.');
 if(s.initialSocPct<s.reservePct||s.chargeTargetPct<=s.reservePct||s.chargeTargetPct<s.initialSocPct)errors.push('La carga objetivo debe ser al menos la inicial y superar la reserva.');
 return{valid:errors.length===0,errors};
}
export function routeCycle(s:ShiftConfig){
 const metres=s.distanceKm*1000,angle=Math.atan(s.gradePct/100),loaded=(s.emptyMassT+s.payloadT)*1000,empty=s.emptyMassT*1000;
 const wheelLoaded=loaded*9.81*metres*(Math.sin(angle)+s.rollingPct/100*Math.cos(angle))/3600000;
 const wheelEmpty=empty*9.81*metres*(-Math.sin(angle)+s.rollingPct/100*Math.cos(angle))/3600000;
 const positive=Math.max(0,wheelLoaded)+Math.max(0,wheelEmpty),braking=-Math.min(0,wheelLoaded)-Math.min(0,wheelEmpty);
 const driveKwh=positive/s.driveEfficiency,recoverableKwh=braking*s.regenEfficiency;
 const speed=(requested:number,energy:number)=>Math.min(requested,(energy>=0?s.tractionKw:s.brakingKw)*s.distanceKm/Math.max(1e-9,Math.abs(energy)));
 const loadedKmh=speed(s.loadedKmh,wheelLoaded),emptyKmh=speed(s.emptyKmh,wheelEmpty);
 const travelMin=s.distanceKm/loadedKmh*60+s.distanceKm/emptyKmh*60;
 const auxKwh=s.auxKw*(travelMin+s.serviceMin)/60;
 return{loadedKmh,emptyKmh,travelMin,minutes:travelMin+s.serviceMin,wheelLoaded,wheelEmpty,driveKwh,recoverableKwh,auxKwh,batteryKwh:driveKwh+auxKwh-recoverableKwh,dieselLitres:(positive+auxKwh)/(s.dieselEfficiency*9.8)};
}
type State='working'|'waiting'|'connecting'|'charging'|'finished'|'blocked';
type Vehicle={id:string;energy:number;initial:number;consumed:number;regenerated:number;charged:number;cycles:number;state:State;remaining:number;trip:number;queueSince:number;slot:number|null;wait:number;connect:number;productive:number;minSoc:number;atTarget:boolean;tripDraw:number;tripRecovery:number};
export type ShiftEvent={minute:number;asset:string;type:string;message:string};
export function simulateShift(input:ShiftConfig,initialEnergyKwh?:number[]){
 const validation=validateShift(input);if(!validation.valid)throw Error(validation.errors.join(' '));const s={...input},route=routeCycle(s),duration=Math.round(s.hours*60),capacity=s.batteryKwh*s.sohPct/100,reserve=capacity*s.reservePct/100,target=capacity*s.chargeTargetPct/100;
 if(route.batteryKwh<=0)throw Error('El ciclo no consume energía neta; revisa hipótesis.');
 if(initialEnergyKwh&&(initialEnergyKwh.length!==s.fleet||initialEnergyKwh.some(e=>!Number.isFinite(e)||e<reserve-1e-6||e>capacity+1e-6)))throw Error('Inventario inicial por equipo no válido.');
 const units:Vehicle[]=Array.from({length:s.fleet},(_,i)=>{const initial=initialEnergyKwh?.[i]??capacity*s.initialSocPct/100;return{id:`LHD-${String(i+1).padStart(2,'0')}`,energy:initial,initial,consumed:0,regenerated:0,charged:0,cycles:0,state:'waiting',remaining:0,trip:0,queueSince:i*.001,slot:null,wait:0,connect:0,productive:0,minSoc:initial/capacity*100,atTarget:false,tripDraw:0,tripRecovery:0}});
 const charger:Array<string|null>=Array(s.chargers).fill(null),events:ShiftEvent[]=[],samples:{minute:number;baseKw:number;chargeKw:number;gridKw:number;price:number;limitKw:number;tonnes:number;queue:number;soc:number[];states:State[]}[]=[],segments:{asset:string;state:State;start:number;end:number}[]=[];
 const transitions=new Map<string,{state:State;start:number}>();
 let delivered=0,gridKwh=0,baseKwh=0,chargeGridKwh=0,gridCost=0,distributionKwh=0,overloadMinutes=0,peakKw=0,curtailedKwh=0,dieselReferenceT=0;
 const event=(minute:number,u:Vehicle|string,type:string,message:string)=>{if(events.length<600)events.push({minute,asset:typeof u==='string'?u:u.id,type,message})};
 function noise(unit:number,cycle:number){let x=(s.seed+unit*73856093+cycle*19349663)>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296}
 function state(u:Vehicle,next:State,t:number){if(u.state===next&&transitions.has(u.id))return;const old=transitions.get(u.id);if(old&&old.start<t)segments.push({asset:u.id,state:old.state,start:old.start,end:t});u.state=next;transitions.set(u.id,{state:next,start:t})}
 // Base reference: same route, same deterministic trip-time variability, without charging stops.
 const reference:Array<{remaining:number;cycle:number;tonnes:number}>=units.map(()=>({remaining:0,cycle:0,tonnes:0}));
 for(let t=0;t<duration;t++){
  const hour=6+t/60,weather=hour>=10&&hour<12?1+s.weatherPct/100:1;
  const base=s.baseKw*(.94+.08*Math.sin((t+90)*Math.PI/360)**2)+(t>=240&&t<330?120:0);
  const price=s.tariff*(t>=240&&t<420?1.5:.85),available=Math.max(0,s.limitKw*(1-s.lossPct/100)-base),outage=t>=s.outageStart&&t<s.outageStart+s.outageMin;
  if(t===s.outageStart&&s.outageMin>0)event(t,'CH-01','outage',`Cargador 1 indisponible durante ${s.outageMin} min.`);
  if(t===s.outageStart+s.outageMin&&s.outageMin>0)event(t,'CH-01','restored','Cargador 1 vuelve a estar disponible.');
  reference.forEach((r,i)=>{if(r.remaining<=0){r.remaining=Math.ceil(route.minutes*(.94+noise(i,r.cycle)*.12)*weather);r.cycle++}r.remaining--;if(r.remaining===0){r.tonnes+=s.payloadT;dieselReferenceT+=s.payloadT}});
  for(let i=0;i<units.length;i++){
   const u=units[i];if(!transitions.has(u.id))transitions.set(u.id,{state:u.state,start:0});
   if(u.state==='working'){
    const draw=u.tripDraw/u.trip,recovery=u.tripRecovery/u.trip,accepted=Math.min(recovery,Math.max(0,capacity-u.energy+draw));
    u.energy=u.energy-draw+accepted;u.consumed+=draw;u.regenerated+=accepted;u.remaining--;u.productive++;u.minSoc=Math.min(u.minSoc,u.energy/capacity*100);
    if(u.remaining<=0){u.cycles++;delivered+=s.payloadT;state(u,'waiting',t+1);u.queueSince=t+1;event(t+1,u,'delivery',`Entrega ${s.payloadT} t; acumulado ${delivered} t.`)}
   }
   // Units finishing a trip at this minute choose their next action on the next minute.
   if(u.state==='waiting'&&u.queueSince<=t){
    const tripMin=Math.ceil(route.minutes*(.94+noise(i,u.cycles)*.12)*weather);
    const aux=s.auxKw*tripMin/60,draw=route.driveKwh+aux,recovery=route.recoverableKwh;
    // Conservative entire positive consumption reserve before departure; regeneration not borrowed.
    if(draw>target-reserve+1e-7){state(u,'blocked',t);event(t,u,'blocked','La batería objetivo no cubre el ciclo conservando reserva.');continue}
    if(u.energy>=reserve+draw-1e-7&&t+tripMin<duration){u.trip=tripMin;u.remaining=tripMin;u.tripDraw=draw;u.tripRecovery=recovery;state(u,'working',t);}
    else if(t+tripMin>=duration){state(u,'finished',t);}

   }
  }
  units.filter(u=>u.state==='waiting'&&u.queueSince<=t).forEach(u=>u.wait++);
  // FCFS: finite charging points; a failed occupied point keeps the vehicle blocked until restored.
  const queue=units.filter(u=>u.state==='waiting'&&u.queueSince<=t).sort((a,b)=>a.queueSince-b.queueSince||a.id.localeCompare(b.id));
  for(let j=0;j<charger.length;j++){
   if(charger[j]!==null||(j===0&&outage))continue;const u=queue.shift();if(!u)break;
   charger[j]=u.id;u.slot=j;u.remaining=s.connectionMin;state(u,s.connectionMin>0?'connecting':'charging',t);event(t,u,'plug',`Conecta a cargador ${j+1}.`);
  }
  const requests:{u:Vehicle;kw:number}[]=[];
  for(const u of units){
   if(u.state==='connecting'){
    if(u.slot===0&&outage){u.connect++;continue}
    u.remaining--;u.connect++;if(u.remaining<=0)state(u,'charging',t+1);continue;
   }
   if(u.state!=='charging')continue;
   if(u.slot===0&&outage){u.wait++;continue}
   if(u.energy>=target-1e-7){charger[u.slot!]=null;u.slot=null;u.queueSince=t;state(u,'waiting',t);continue}
   const soc=u.energy/capacity,taper=soc<=.8?1:Math.max(.25,1-(soc-.8)*3.75);
   requests.push({u,kw:Math.min(s.chargerKw*taper,(target-u.energy)*60/s.chargeEfficiency)});
  }
  const requested=requests.reduce((a,r)=>a+r.kw,0),scale=s.managed&&requested>0?Math.min(1,available/requested):1;
  let charge=0;
  for(const {u,kw} of requests){const actual=kw*scale,stored=actual/60*s.chargeEfficiency;u.energy+=stored;u.charged+=stored;charge+=actual;if(actual<.01)u.wait++;}
  curtailedKwh+=(requested-charge)/60;
  const grid=(base+charge)/(1-s.lossPct/100);gridKwh+=grid/60;baseKwh+=base/60;chargeGridKwh+=charge/60;distributionKwh+=(grid-base-charge)/60;gridCost+=grid/60*price;peakKw=Math.max(peakKw,grid);if(grid>s.limitKw+1e-6)overloadMinutes++;
  samples.push({minute:t,baseKw:base,chargeKw:charge,gridKw:grid,price,limitKw:s.limitKw,tonnes:delivered,queue:units.filter(u=>u.state==='waiting').length,soc:units.map(u=>u.energy/capacity*100),states:units.map(u=>u.state)});
 }
 for(const u of units){const old=transitions.get(u.id);if(old)segments.push({asset:u.id,state:old.state,start:old.start,end:duration});}
 const restoredBatteryKwh=units.reduce((sum,u)=>sum+Math.max(0,u.initial-u.energy),0),restoreGridKwh=restoredBatteryKwh/s.chargeEfficiency;
 const inventoryCorrectionKwh=units.reduce((sum,u)=>sum+u.initial-u.energy,0)/s.chargeEfficiency/(1-s.lossPct/100);
 const equivalentGridKwh=gridKwh+inventoryCorrectionKwh,energyDebtCost=inventoryCorrectionKwh*s.tariff;
 const balanceError=units.reduce((sum,u)=>sum+Math.abs(u.initial+u.charged+u.regenerated-u.consumed-u.energy),0);
 const cycles=units.reduce((a,u)=>a+u.cycles,0),dieselLitresSameTonnes=cycles*route.dieselLitres;
 const dieselGrid=baseKwh/(1-s.lossPct/100),dieselCostSameTonnes=dieselLitresSameTonnes*s.dieselUsdL+samples.reduce((a,p)=>a+p.baseKw/(1-s.lossPct/100)/60*p.price,0);
 const dieselCo2SameTonnes=dieselLitresSameTonnes*10.18/3.785411784+dieselGrid*s.gridFactor,co2Equivalent=equivalentGridKwh*s.gridFactor;
 const unmetT=Math.max(0,s.targetT-delivered),warnings:string[]=[];
 if(delivered<s.targetT)warnings.push('La producción no alcanza la meta; un menor costo total no prueba una alternativa mejor.');
 if(restoreGridKwh>.01)warnings.push('Queda energía por reponer después del turno; se contabiliza como deuda energética, sin calendario de reposición garantizado.');
 if(overloadMinutes)warnings.push('La demanda excede el suministro en algunos minutos. No es un plan eléctricamente factible.');
 if(units.some(u=>u.state==='blocked'))warnings.push('El ciclo no cabe entre carga objetivo y reserva en al menos un equipo.');
 if(s.managed&&samples.some(p=>p.baseKw>s.limitKw*(1-s.lossPct/100)))warnings.push('La carga crítica base supera por sí sola el límite; gestionar cargadores no lo resuelve.');
 return{config:s,route,capacityKwh:capacity,synthetic:true,minuteStep:1,deliveredT:delivered,dieselReferenceT,targetMet:delivered>=s.targetT,fulfillment:delivered/s.targetT,unmetT,opportunityCostUsd:unmetT*s.lostMarginUsdT,gridKwh,baseKwh,chargeGridKwh,distributionKwh,chargeLossKwh:chargeGridKwh*(1-s.chargeEfficiency),equivalentGridKwh,restoreGridKwh,inventoryCorrectionKwh,gridCost,energyDebtCost,costEquivalent:gridCost+energyDebtCost,co2Equivalent,dieselLitresSameTonnes,dieselCostSameTonnes,dieselCo2SameTonnes,energyCostPerT:delivered?(gridCost+energyDebtCost)/delivered:null,co2KgPerT:delivered?co2Equivalent/delivered:null,capexUsd:s.chargers*s.chargerCapexUsd,peakKw,overloadMinutes,curtailedKwh,totalQueueMinutes:units.reduce((a,u)=>a+u.wait,0),balanceError,units,samples,segments,events,warnings};
}
export type ShiftResult=ReturnType<typeof simulateShift>;
export const labAlternatives=[
 {id:'one',name:'1 cargador · límite actual',change:{}},
 {id:'two',name:'2 cargadores · misma red',change:{chargers:2}},
 {id:'upgrade',name:'2 cargadores + 350 kW de red',change:{chargers:2}},
 {id:'naive',name:'2 sin gestión del límite',change:{chargers:2,managed:false}},
] as const;
export function compareShiftAlternatives(s:ShiftConfig){return labAlternatives.map(a=>({id:a.id,name:a.name,result:simulateShift({...s,...a.change,...(a.id==='upgrade'?{limitKw:s.limitKw+350}:{})})}));}
export function replicateShift(s:ShiftConfig,count=12){if(!Number.isInteger(count)||count<3||count>30)throw Error('Usa entre 3 y 30 réplicas.');const runs=Array.from({length:count},(_,i)=>simulateShift({...s,seed:s.seed+i*101}));const sorted=runs.map(r=>r.deliveredT).sort((a,b)=>a-b);return{count,met:runs.filter(r=>r.targetMet).length,p10:sorted[Math.floor((count-1)*.1)],median:sorted[Math.floor((count-1)*.5)],p90:sorted[Math.floor((count-1)*.9)],note:'Dispersión sobre semillas sintéticas de tiempos de viaje; no probabilidad empírica de una faena.'};}
