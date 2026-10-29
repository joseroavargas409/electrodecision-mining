import {projectKnowledge as knowledge,type TechnologyId,type ProjectPhase} from './project-knowledge.ts';
import {projectKnowledgeEnglish} from './project-knowledge-en.ts';
export type EvidenceState='missing'|'pending'|'documented'|'not_applicable';
export type ProjectContext={technology:TechnologyId;phase:ProjectPhase;jurisdiction:'CL'|'other';answers:Record<string,{state:EvidenceState;reference:string}>};
export const projectDefaults:ProjectContext={technology:'underground_bev',phase:'integration',jurisdiction:'CL',answers:{}};
const chileanRegulatorySources=new Set(['sec','ric15','mining','sea26','environmentLaw','seia','waste','energyLaw','ds44','ds594']);
export function requirementsFor(context:Pick<ProjectContext,'technology'|'phase'|'jurisdiction'>){return knowledge.requirements.filter(r=>(!r.technologies.length||r.technologies.includes(context.technology))&&(!r.phases.length||r.phases.includes(context.phase))&&(!r.jurisdictions.length||r.jurisdictions.includes(context.jurisdiction)));}
export function validateProjectContext(value:unknown):value is ProjectContext{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;const p=value as ProjectContext;
 if(Object.keys(p).some(k=>!['technology','phase','jurisdiction','answers'].includes(k))||!knowledge.technologies.some(t=>t.id===p.technology)||!['integration','operation'].includes(p.phase)||!['CL','other'].includes(p.jurisdiction)||!p.answers||typeof p.answers!=='object'||Array.isArray(p.answers))return false;
 const allowed=new Set(requirementsFor(p).map(r=>r.id));
 return Object.entries(p.answers).every(([id,a])=>allowed.has(id)&&a&&typeof a==='object'&&!Array.isArray(a)&&Object.keys(a).every(k=>['state','reference'].includes(k))&&['missing','pending','documented','not_applicable'].includes(a.state)&&typeof a.reference==='string'&&a.reference.length<=600&&(!['documented','not_applicable'].includes(a.state)||a.reference.trim().length>0));
}
export function sourceIdsFor(context:ProjectContext,ids:string[]){return context.jurisdiction==='CL'?ids:ids.filter(id=>!chileanRegulatorySources.has(id));}
export function assessProjectReadiness(context:ProjectContext,language:'es'|'en'='es'){
 if(!validateProjectContext(context))throw Error('Revisa tecnología, etapa, jurisdicción y referencias de los antecedentes.');
 const catalog=language==='en'?projectKnowledgeEnglish:knowledge;
 const findings=requirementsFor(context).map(original=>{const r=catalog.requirements.find(r=>r.id===original.id)!;
  const answer=context.answers[r.id]??{state:'missing' as EvidenceState,reference:''};
  const unresolved=answer.state!=='documented';
  return{id:'RQ-'+r.id,name:r.name,category:r.category,critical:r.critical,state:answer.state,reference:answer.reference.trim(),unresolved,action:r[context.phase],sourceIds:sourceIdsFor(context,r.sourceIds),verified:false};
 });
 const criticalOpen=findings.filter(f=>f.critical&&f.unresolved),documented=findings.filter(f=>f.state==='documented').length;
 return{reviewedAt:knowledge.reviewedAt,technology:context.technology,phase:context.phase,jurisdiction:context.jurisdiction,total:findings.length,documented,unresolved:findings.length-documented,criticalOpen:criticalOpen.length,status:criticalOpen.length?'critical_information_missing':'declared_for_expert_review',statusLabel:language==='en'?(criticalOpen.length?'Critical information is missing':'Declared information ready for specialist review'):(criticalOpen.length?'Faltan antecedentes críticos para evaluar':'Antecedentes declarados para revisión especializada'),findings,priorityActions:[...findings].filter(f=>f.unresolved).sort((a,b)=>Number(b.critical)-Number(a.critical)).slice(0,6),complianceCertified:false,note:language==='en'?'User-declared evidence inventory. A reference does not verify document contents, validity or compliance. Declaring non-applicability does not automatically close a critical item. No engineering, environmental or regulatory approval is issued.':'Inventario de antecedentes declarados por el usuario. Una referencia no verifica su contenido, vigencia ni cumplimiento. No aplica o justificar no cierra automáticamente un requisito crítico. No se emite aprobación técnica, ambiental ni regulatoria.'};
}
export function getProjectContext(context:ProjectContext,language:'es'|'en'='es'){
 const catalog=language==='en'?projectKnowledgeEnglish:knowledge;
 const review=assessProjectReadiness(context,language),technology=catalog.technologies.find(t=>t.id===context.technology)!;
 const cases=catalog.cases.filter(c=>c.technology===context.technology),bottlenecks=catalog.bottlenecks.filter(b=>b.phase===context.phase&&(!b.technologies.length||b.technologies.includes(context.technology))).map(b=>({...b,sourceIds:sourceIdsFor(context,b.sourceIds)}));
 const sourceIds=[...new Set([...technology.sourceIds,...cases.flatMap(c=>c.sourceIds),...review.findings.flatMap(f=>f.sourceIds),...bottlenecks.flatMap(b=>b.sourceIds)])];
 return{reviewedAt:knowledge.reviewedAt,scope:catalog.scope,technology,cases,bottlenecks,requirements:review.findings.map(({id,name,action,sourceIds})=>({id,name,action,sourceIds})),sources:sourceIds.map(id=>catalog.sources[id]),limitations:language==='en'?['Qualitative classification, not a global statistical frequency ranking.','Cases retain source dates and states; announcements, contracts, pilots and operations differ.','The numerical lab models generic directly charged LHDs, not trolley, swapping or these actual mines.','Chilean rules provide an indicative review path; other jurisdictions require local assessment.']:['Clasificación cualitativa de familias; no ranking estadístico de proyectos más frecuentes.','Cada caso conserva la fecha y el estado de su fuente; anuncio, contrato, piloto y operación son estados distintos.','El laboratorio numérico actual representa LHD genéricos de carga directa. No simula trolley, intercambio ni estos casos reales.','La normativa de Chile se presenta como ruta de revisión; otros países requieren verificación local.']};
}
