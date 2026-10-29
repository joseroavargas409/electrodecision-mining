import {getServerEnv} from '../../../src/lib/server-env';
import {runMiningAgent} from '../../../src/lib/mining-agent';
import {validateShift,type ShiftConfig} from '../../../src/lib/shift-lab';
import {validateProjectContext,type ProjectContext} from '../../../src/lib/project-review';
export async function POST(request:Request){
 const headers={'Cache-Control':'no-store'};
 if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Origen no permitido.'},{status:403,headers});
 let config:ShiftConfig,question:string,project:ProjectContext|undefined,language:'es'|'en';
 try{const text=await request.text();if(text.length>30000)throw Error();const body=JSON.parse(text);if((body.language!==undefined&&!['es','en'].includes(body.language))||Object.keys(body).some(k=>!['config','question','project','language'].includes(k))||!validateShift(body.config).valid||typeof body.question!=='string'||!body.question.trim()||body.question.length>2000||(body.project!==undefined&&!validateProjectContext(body.project)))throw Error();config=body.config;question=body.question;project=body.project;language=body.language??'es'}catch{return Response.json({error:'Revisa la configuración, el expediente y la consulta (máximo 2000 caracteres).'},{status:400,headers})}
 const env=getServerEnv();try{return Response.json(await runMiningAgent(config,question,{key:env.NEBIUS_API_KEY,model:env.NEBIUS_MODEL,project,language}),{headers})}catch{return Response.json({error:'No se pudo verificar la consulta a Nebius. Revisa conexión, modelo, saldo y credencial; los cálculos locales siguen disponibles.'},{status:502,headers})}
}
