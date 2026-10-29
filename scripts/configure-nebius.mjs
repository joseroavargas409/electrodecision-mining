/** Local interactive setup: the secret arrives only over stdin, never arguments/logs. */
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {homedir} from 'node:os';
class SetupError extends Error {}
const root=join(homedir(),'Documents','Codex','ElectroDecision-App');
let raw='';for await(const chunk of process.stdin){raw+=chunk;if(raw.length>10000)throw new SetupError('Entrada demasiado extensa.')}
async function main(){
 const input=JSON.parse(raw.replace(/^\uFEFF/,'')),key=typeof input.key==='string'?input.key.trim():'';
 if(!key||key.length>4096||/[\r\n]/.test(key))throw new SetupError('La clave está vacía o no es válida.');
 const api='https://api.tokenfactory.nebius.com/v1';
 async function call(path,body){const response=await fetch(api+path,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(45000),...(body?{body:JSON.stringify(body)}:{})});if(!response.ok)throw new SetupError(response.status===401||response.status===403?'Nebius rechazó la clave o sus permisos.':response.status===429?'Revisa el saldo o límite de uso de Nebius.':`Nebius respondió HTTP ${response.status}; no se guardó la clave.`);return response.json()}
 const catalog=await call('/models'),available=(catalog.data??[]).map(m=>m.id).filter(id=>typeof id==='string'&&/^nvidia\//.test(id));
 const requested=typeof input.model==='string'?input.model.trim():'';
 const model=requested||available.find(id=>/nemotron.*lightning/i.test(id))||available.find(id=>/nemotron.*nano/i.test(id))||available.find(id=>/nemotron/i.test(id));
 if(!model||!available.includes(model))throw new SetupError('No se encontró el modelo NVIDIA solicitado en esta cuenta. Modelos NVIDIA disponibles: '+available.slice(0,12).join(', '));
 console.log('Verificando inferencia y llamada a herramientas con '+model+' (dos consultas breves como máximo).');
 const tool={type:'function',function:{name:'read_demo_balance',description:'Devuelve el balance sintético de comprobación.',parameters:{type:'object',properties:{},additionalProperties:false}}};
 const messages=[{role:'system',content:'Verifica la integración: llama read_demo_balance sin argumentos y después confirma el valor que devuelve. No inventes resultados.'},{role:'user',content:'Consulta el balance de prueba.'}];
 const first=await call('/chat/completions',{model,messages,tools:[tool],tool_choice:{type:'function',function:{name:'read_demo_balance'}},max_tokens:256,temperature:0});
 const assistant=first.choices?.[0]?.message,toolCall=assistant?.tool_calls?.[0];
 if(toolCall?.function?.name!=='read_demo_balance')throw new SetupError('Hubo respuesta del modelo, pero no una llamada de herramienta verificable. No se guardó la clave.');
 const args=JSON.parse(toolCall.function.arguments||'{}');if(Object.keys(args).length)throw new SetupError('La herramienta de prueba devolvió argumentos no admitidos.');
 const second=await call('/chat/completions',{model,messages:[...messages,{role:'assistant',content:null,tool_calls:[toolCall]},{role:'tool',tool_call_id:toolCall.id,content:JSON.stringify({synthetic:true,energyKwh:42})}],max_tokens:256,temperature:0});
 if(!/\b42\b/.test(second.choices?.[0]?.message?.content??''))throw new SetupError('La respuesta final no confirmó el valor de la herramienta. No se guardó la clave.');
 mkdirSync(root,{recursive:true});const path=join(root,'.dev.vars');let existing=existsSync(path)?readFileSync(path,'utf8'):'';
 existing=existing.split(/\r?\n/).filter(line=>!/^\s*(NEBIUS_API_KEY|NEBIUS_MODEL)\s*=/.test(line)).join('\n').trim();
 writeFileSync(path,(existing?existing+'\n':'')+'NEBIUS_API_KEY='+JSON.stringify(key)+'\nNEBIUS_MODEL='+JSON.stringify(model)+'\n',{mode:0o600});
 const usage={promptTokens:(first.usage?.prompt_tokens??0)+(second.usage?.prompt_tokens??0),completionTokens:(first.usage?.completion_tokens??0)+(second.usage?.completion_tokens??0)};
 writeFileSync(join(root,'.nebius-verification.json'),JSON.stringify({checkedAt:new Date().toISOString(),model,inferenceVerified:true,toolCallingVerified:true,usage,secretStoredOutsideVault:true},null,2));
 console.log('Conexión real verificada. Clave guardada sólo en la carpeta local de ejecución, fuera de Obsidian.');
 console.log('Modelo: '+model+' · tokens de entrada '+usage.promptTokens+' · salida '+usage.completionTokens+'.');
 console.log('Reinicia ElectroDecision para cargar la configuración. Nunca compartas .dev.vars.');
}
try{await main()}catch(error){console.error(error instanceof SetupError?error.message:'No se pudo completar la conexión. Revisa la entrada, conexión y modelo; no se guardó la clave.');process.exitCode=1}
