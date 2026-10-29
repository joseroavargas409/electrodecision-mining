import test from 'node:test';
import assert from 'node:assert/strict';
import {caseDefaults,compareElectricCase} from './electric-case.ts';
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('zero conversion exactly preserves the diesel baseline, including ventilation',()=>{
 const d=compareElectricCase({...caseDefaults,electricPct:0});assert.deepEqual(d.baseline,d.candidate);near(d.co2SavedKg,0);near(d.costSavedUsd,0);assert.equal(d.breakEvenGridFactor,null);
});
test('equal useful work closes fuel, battery and grid energy ledgers independently',()=>{
 const d=compareElectricCase({...caseDefaults,electricPct:50}),s=d.input;
 near(d.candidate.litres*s.dieselKwhL*s.dieselEfficiency+d.batteryKwh*s.bevEfficiency,s.workKwh);
 near(d.candidate.gridKwh,d.otherKwh+d.candidate.ventKwh+d.chargeGridKwh);
 near(d.candidate.inputKwh,s.workKwh+d.candidate.driveLossKwh+d.chargeLossKwh+d.candidate.ventKwh+d.otherKwh);
});
test('electrification can increase grid demand and worsen emissions on a carbon intensive supply',()=>{
 const d=compareElectricCase({...caseDefaults,ventReductionPct:0,gridCo2KgKwh:1});assert.ok(d.extraGridKwh>0);assert.ok(d.co2SavedKg<0);assert.ok(d.avoidedLitres>0);
 const atBreakEven=compareElectricCase({...d.input,gridCo2KgKwh:d.breakEvenGridFactor!});near(atBreakEven.co2SavedKg,0);
});
test('ventilation savings require an explicit independent assumption and scale with converted work',()=>{
 const zero=compareElectricCase({...caseDefaults,ventReductionPct:0}),full=compareElectricCase(caseDefaults),half=compareElectricCase({...caseDefaults,electricPct:50});near(zero.ventSavedKwh,0);near(half.ventSavedKwh,full.ventSavedKwh/2);assert.ok(full.candidate.gridKwh<zero.candidate.gridKwh);
});
test('invalid comparative scenarios are rejected instead of returning fabricated advantages',()=>{
 for(const change of [{gridCo2KgKwh:NaN},{hours:0},{dieselEfficiency:0},{bevEfficiency:2},{electricPct:101},{ventReductionPct:80},{workKwh:-1}])assert.throws(()=>compareElectricCase({...caseDefaults,...change}));
});
