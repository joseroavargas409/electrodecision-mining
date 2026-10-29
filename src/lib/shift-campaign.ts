import {simulateShift,type ShiftConfig} from './shift-lab.ts';

/** Two finite work shifts, one managed charging break, no SOC reset. */
export function simulateCampaign(config:ShiftConfig,breakMinutes=60){
 if(!Number.isInteger(breakMinutes)||breakMinutes<0||breakMinutes>240)throw Error('La pausa debe durar entre 0 y 240 minutos enteros.');
 const first=simulateShift(config),capacity=first.capacityKwh,target=capacity*config.initialSocPct/100;
 const energy=first.units.map(u=>u.energy),before=[...energy],charged=energy.map(()=>0),slots:Array<{unit:number;connect:number}|null>=Array(config.chargers).fill(null);
 const queue=energy.map((_,i)=>i).filter(i=>energy[i]<target-1e-8);
 const samples:{minute:number;gridKw:number;chargeKw:number;baseKw:number;soc:number[]}[]=[];
 let gridKwh=0,chargeGridKwh=0,gridCost=0,overloadMinutes=0;
 for(let t=0;t<breakMinutes;t++){
  const absoluteMinute=Math.round(config.hours*60)+t;
  const failed=absoluteMinute>=config.outageStart&&absoluteMinute<config.outageStart+config.outageMin;
  for(let j=0;j<slots.length;j++)if(!slots[j]&&queue.length&&!(j===0&&failed))slots[j]={unit:queue.shift()!,connect:config.connectionMin};
  const requests:{unit:number;kw:number}[]=[];
  for(let j=0;j<slots.length;j++){
   const slot=slots[j];if(!slot||(j===0&&failed))continue;
   if(slot.connect>0){slot.connect--;continue}
   if(energy[slot.unit]>=target-1e-8){slots[j]=null;continue}
   const soc=energy[slot.unit]/capacity,taper=soc<=.8?1:Math.max(.25,1-(soc-.8)*3.75);
   requests.push({unit:slot.unit,kw:Math.min(config.chargerKw*taper,(target-energy[slot.unit])*60/config.chargeEfficiency)});
  }
  // Critical services stay on during the break; this base is an explicit constant assumption.
  const base=config.baseKw,available=Math.max(0,config.limitKw*(1-config.lossPct/100)-base);
  const requested=requests.reduce((a,r)=>a+r.kw,0),scale=requested?Math.min(1,available/requested):0;
  let charge=0;for(const r of requests){const kw=r.kw*scale,stored=kw/60*config.chargeEfficiency;energy[r.unit]+=stored;charged[r.unit]+=stored;charge+=kw}
  const grid=(base+charge)/(1-config.lossPct/100);gridKwh+=grid/60;chargeGridKwh+=charge/60;gridCost+=grid/60*config.tariff;if(grid>config.limitKw+1e-6)overloadMinutes++;
  samples.push({minute:t,gridKw:grid,chargeKw:charge,baseKw:base,soc:energy.map(e=>e/capacity*100)});
 }
 // The same duty/profile repeats; a single charger incident does not recur in shift 2.
 const second=simulateShift({...config,outageMin:0},energy);
 const deficitKwh=energy.reduce((sum,e)=>sum+Math.max(0,target-e),0);
 const actualGridKwh=first.gridKwh+gridKwh+second.gridKwh;
 const actualGridCost=first.gridCost+gridCost+second.gridCost;
 const finalInventoryCorrectionKwh=first.units.reduce((sum,u,i)=>sum+u.initial-second.units[i].energy,0)/config.chargeEfficiency/(1-config.lossPct/100);
 const balanceError=energy.reduce((sum,e,i)=>sum+Math.abs(before[i]+charged[i]-e),0)+first.balanceError+second.balanceError;
 return{synthetic:true,first,second,breakMinutes,elapsedHours:config.hours*2+breakMinutes/60,breakBaseKw:config.baseKw,breakSamples:samples,breakGridKwh:gridKwh,breakChargeGridKwh:chargeGridKwh,breakStoredKwh:charged.reduce((a,b)=>a+b,0),breakOverloadMinutes:overloadMinutes,readyForInitialSoc:deficitKwh<1e-6,deficitKwh,startSecondSoc:energy.map(e=>e/capacity*100),deliveredT:first.deliveredT+second.deliveredT,targetT:config.targetT*2,actualGridKwh,actualGridCost,finalInventoryCorrectionKwh,equivalentGridKwh:actualGridKwh+finalInventoryCorrectionKwh,equivalentCostUsd:actualGridCost+finalInventoryCorrectionKwh*config.tariff,balanceError,assumptions:['Dos turnos con igual ruta, semilla y perfil de demanda; una sola falla de cargador, en el primero.','La pausa mantiene base crítica constante y tarifa base; carga siempre gestionada, con conexión y reducción de potencia por SOC.','Objetivo de reposición: SOC inicial declarado por equipo. El segundo turno conserva el inventario individual real, aunque no se alcance ese objetivo.','No incluye cambio de operadores, mantenimiento ni validación térmica. Dos turnos no demuestran estabilidad indefinida.']};
}
export function campaignSummary(config:ShiftConfig,minutes=60){const c=simulateCampaign(config,minutes);return{breakMinutes:minutes,firstTonnes:c.first.deliveredT,secondTonnes:c.second.deliveredT,targetPerShift:config.targetT,ready:c.readyForInitialSoc,startSecondSoc:c.startSecondSoc,deficitBatteryKwh:c.deficitKwh,breakChargeGridKwh:c.breakChargeGridKwh,elapsedHours:c.elapsedHours,actualGridKwh:c.actualGridKwh,finalInventoryCorrectionKwh:c.finalInventoryCorrectionKwh,overloadMinutes:c.first.overloadMinutes+c.second.overloadMinutes+c.breakOverloadMinutes,assumptions:c.assumptions};}
