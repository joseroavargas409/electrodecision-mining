export type CaseInputs={hours:number;workKwh:number;dieselEfficiency:number;bevEfficiency:number;chargeEfficiency:number;dieselKwhL:number;dieselCo2KgL:number;dieselUsdL:number;gridCo2KgKwh:number;gridUsdKwh:number;ventKw:number;otherKw:number;ventReductionPct:number;electricPct:number};
export const caseDefaults:CaseInputs={hours:12,workKwh:3000,dieselEfficiency:.32,bevEfficiency:.85,chargeEfficiency:.93,dieselKwhL:9.8,dieselCo2KgL:10.18/3.785411784,dieselUsdL:1.2,gridCo2KgKwh:.25,gridUsdKwh:.12,ventKw:1000,otherKw:700,ventReductionPct:20,electricPct:100};
export const caseSources=[
 {title:'NRCan · Borden Mine of the Future · resultados publicados, revisión 30 mayo 2025',url:'https://prod-natural-resources.azure.cloud.nrcan-rncan.gc.ca/funding-partnerships/borden-mine-future-energy-innovations',basis:'Proyecto BEV, ventilación bajo demanda y eliminación de compresión central en superficie. Reporta 1,6 millones L/año de diésel eliminados y 40% de reducción de GEI frente a su línea base; son resultados del proyecto, no del simulador ni inventario de flota actual.'},
 {title:'Discovery Mining · Porcupine Operations · Borden',url:'https://dsvmining.com/English/operations/porcupine-operations/default.aspx',basis:'Confirma acceso por rampa, explotación longhole con relleno y traslado de mineral a Dome, a unos 190 km. Justifica la tipología, sin aportar coordenadas a esta escena.'},
 {title:'US EPA · factor de combustión de diésel',url:'https://www.epa.gov/energy/greenhouse-gas-equivalencies-calculator-calculations-and-references',basis:'10,180 kg CO₂ por galón estadounidense; convertido a litros. Sólo CO₂ de combustión. El factor eléctrico de la demo es un supuesto independiente, no el de Ontario.'}
];

/** Equal useful mechanical work; a hypothetical shift, independent of Aurora and Borden telemetry. */
export function compareElectricCase(input:CaseInputs){
 const s={...input};
 for(const [key,value] of Object.entries(s))if(!Number.isFinite(value))throw Error(`Valor inválido: ${key}`);
 if(s.hours<=0||s.hours>24||s.workKwh<=0||s.dieselKwhL<=0||[s.dieselEfficiency,s.bevEfficiency,s.chargeEfficiency].some(v=>v<=0||v>1)||[s.ventKw,s.otherKw,s.dieselCo2KgL,s.dieselUsdL,s.gridCo2KgKwh,s.gridUsdKwh].some(v=>v<0)||s.electricPct<0||s.electricPct>100||s.ventReductionPct<0||s.ventReductionPct>50)throw Error('Revisa horas, eficiencias, potencias y porcentajes.');
 const fraction=s.electricPct/100;
 const baselineLitres=s.workKwh/s.dieselEfficiency/s.dieselKwhL;
 const baselineVentKwh=s.ventKw*s.hours,otherKwh=s.otherKw*s.hours;
 const baseGridKwh=baselineVentKwh+otherKwh;
 const batteryKwh=s.workKwh*fraction/s.bevEfficiency;
 const chargeGridKwh=batteryKwh/s.chargeEfficiency;
 const ventSavedKwh=baselineVentKwh*s.ventReductionPct/100*fraction;
 const candidateVentKwh=baselineVentKwh-ventSavedKwh;
 const litres=baselineLitres*(1-fraction);
 const gridKwh=otherKwh+candidateVentKwh+chargeGridKwh;
 const baseFuelKwh=baselineLitres*s.dieselKwhL,candidateFuelKwh=litres*s.dieselKwhL;
 const baseline={litres:baselineLitres,gridKwh:baseGridKwh,ventKwh:baselineVentKwh,fuelKwh:baseFuelKwh,inputKwh:baseGridKwh+baseFuelKwh,co2Kg:baselineLitres*s.dieselCo2KgL+baseGridKwh*s.gridCo2KgKwh,costUsd:baselineLitres*s.dieselUsdL+baseGridKwh*s.gridUsdKwh,driveLossKwh:baseFuelKwh-s.workKwh};
 const candidate={litres,gridKwh,ventKwh:candidateVentKwh,fuelKwh:candidateFuelKwh,inputKwh:gridKwh+candidateFuelKwh,co2Kg:litres*s.dieselCo2KgL+gridKwh*s.gridCo2KgKwh,costUsd:litres*s.dieselUsdL+gridKwh*s.gridUsdKwh,driveLossKwh:candidateFuelKwh-s.workKwh*(1-fraction)+batteryKwh-s.workKwh*fraction};
 const extraGridKwh=gridKwh-baseGridKwh,avoidedLitres=baselineLitres-litres;
 return {input:s,baseline,candidate,batteryKwh,chargeGridKwh,chargeLossKwh:chargeGridKwh-batteryKwh,otherKwh,ventSavedKwh,extraGridKwh,avoidedLitres,co2SavedKg:baseline.co2Kg-candidate.co2Kg,costSavedUsd:baseline.costUsd-candidate.costUsd,inputSavedKwh:baseline.inputKwh-candidate.inputKwh,gridMeanKw:gridKwh/s.hours,chargingMeanKw:chargeGridKwh/s.hours,breakEvenGridFactor:extraGridKwh>1e-9?avoidedLitres*s.dieselCo2KgL/extraGridKwh:null};
}
