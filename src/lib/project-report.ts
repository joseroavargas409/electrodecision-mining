import {assessProjectReadiness,getProjectContext,type ProjectContext} from './project-review.ts';
export const projectSelectionSchema={type:'object',properties:{focus:{type:'string',enum:['actions','context','cases']},priorityIds:{type:'array',items:{type:'string'},maxItems:3},caseIds:{type:'array',items:{type:'string'},maxItems:3},bottleneckIds:{type:'array',items:{type:'string'},maxItems:3}},required:['focus','priorityIds','caseIds','bottleneckIds'],additionalProperties:false};
/** Model selects existing evidence IDs. All displayed claims/numbers come from the validated registry. */
export function buildProjectReport(context:ProjectContext,raw:string,language:'es'|'en'='es'){
 if(raw.length>6000)throw Error('Selección demasiado extensa.');
 const selection=JSON.parse(raw) as {focus:string;priorityIds:string[];caseIds:string[];bottleneckIds:string[]};
 if(!selection||typeof selection!=='object'||Array.isArray(selection)||Object.keys(selection).some(k=>!['focus','priorityIds','caseIds','bottleneckIds'].includes(k))||!['actions','context','cases'].includes(selection.focus))throw Error('Selección no válida.');
 for(const key of ['priorityIds','caseIds','bottleneckIds'] as const){const ids=selection[key];if(!Array.isArray(ids)||ids.length>3||new Set(ids).size!==ids.length||ids.some(id=>typeof id!=='string'))throw Error('Referencias no válidas.');}
 const review=assessProjectReadiness(context,language),facts=getProjectContext(context,language);
 if(selection.priorityIds.some(id=>!review.findings.some(f=>f.id===id&&f.unresolved))||selection.caseIds.some(id=>!facts.cases.some(c=>c.id===id))||selection.bottleneckIds.some(id=>!facts.bottlenecks.some(b=>b.id===id)))throw Error('La selección refiere a evidencia inexistente o ajena al contexto.');
 if(selection.focus==='actions'&&review.unresolved>0&&!selection.priorityIds.length)throw Error('Incluye al menos una acción pendiente.');
 const actions=selection.priorityIds.map(id=>review.findings.find(f=>f.id===id)!);
 const cases=selection.caseIds.map(id=>facts.cases.find(c=>c.id===id)!);
 const bottlenecks=selection.bottleneckIds.map(id=>facts.bottlenecks.find(b=>b.id===id)!);
 const sourceIds=[...new Set([...actions.flatMap(f=>f.sourceIds),...cases.flatMap(c=>c.sourceIds),...bottlenecks.flatMap(b=>b.sourceIds),...facts.technology.sourceIds])];
 const sources=sourceIds.map(id=>facts.sources.find(s=>s.id===id)!).filter(Boolean);
 const projectReport={focus:selection.focus,technology:facts.technology.name,phase:context.phase,jurisdiction:context.jurisdiction,statusLabel:review.statusLabel,criticalOpen:review.criticalOpen,unresolved:review.unresolved,total:review.total,documented:review.documented,actions,cases,bottlenecks,sources,context:facts.technology,selectionValidated:true,complianceCertified:false,note:review.note};
 const english=language==='en';
 const message=[facts.technology.name+' · '+(context.phase==='integration'?(english?'Implementation':'Implementación'):(english?'Operation':'Operación')),review.statusLabel,english?`${review.criticalOpen} critical items open; ${review.unresolved} of ${review.total} without a declared document.`:`${review.criticalOpen} antecedentes críticos abiertos; ${review.unresolved} de ${review.total} sin documento declarado.`,...(selection.focus==='context'?[facts.technology.description,facts.technology.why,facts.technology.context]:[]),...actions.map(f=>`${f.id} · ${f.name}\n${f.action}`),...bottlenecks.map(b=>`${b.name}\n${b.cause}\n${english?'Review':'Qué revisar'}: ${b.measure}`),...cases.map(c=>`${c.name} · ${c.date} · ${c.status}\n${c.summary}\n${c.limit}`),...(selection.focus==='cases'&&!cases.length?[english?'No case from this family was selected in the sample.':'No hay un caso seleccionado de esta familia en la muestra.']:[]),(english?'Sources: ':'Fuentes: ')+sources.map(s=>`${s.title}: ${s.url}`).join('\n'),review.note].join('\n\n');
 return{projectReport,message};
}
export type ProjectReport=ReturnType<typeof buildProjectReport>['projectReport'];
