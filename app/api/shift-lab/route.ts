import {getServerEnv} from '../../../src/lib/server-env';
import {DEFAULT_MODEL} from '../../../src/lib/assistant';
import {prepareShiftDiagnosis} from '../../../src/lib/shift-diagnosis';
export async function POST(request:Request){
 const headers={'Cache-Control':'no-store'};
 if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Origen no permitido'},{status:403,headers});
 let facts:ReturnType<typeof prepareShiftDiagnosis>;
 try{const text=await request.text();if(text.length>30000)throw Error('Solicitud demasiado extensa');facts=prepareShiftDiagnosis(JSON.parse(text).config)}catch{return Response.json({error:'Revisa los datos del turno.'},{status:400,headers})}
 const env=getServerEnv();if(!env.NEBIUS_API_KEY?.trim())return Response.json({mode:'demo',message:facts.message,alternatives:facts.alternatives},{headers});
 const model=env.NEBIUS_MODEL||DEFAULT_MODEL;if(!/^nvidia\/[A-Za-z0-9_.\-/]{1,120}$/.test(model))return Response.json({error:'Modelo NVIDIA no válido.'},{status:503,headers});
 try{
  const r=await fetch('https://api.tokenfactory.nebius.com/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${env.NEBIUS_API_KEY}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(25000),body:JSON.stringify({model,temperature:.1,max_tokens:1400,messages:[{role:'system',content:'Eres ElectroDecision. Explica en español la comparación recalculada. Cita sólo cifras adjuntas. Distingue hipótesis, resultados y datos faltantes. No prometas ahorro industrial, ventilación segura, óptimo global o disponibilidad. Si no cumple producción o sobrecarga la red, dilo. Reposición de batería fuera de turno no garantizada; costo equivalente incluye inventario final. CAPEX sólo de cargadores: no TCO ni payback. No mezcles con Borden ni Aurora. No modifiques parámetros. Resume cuello de botella, alternativas y siguiente medición. Datos: '+JSON.stringify(facts)},{role:'user',content:'¿Qué demuestra el caso y qué alternativa debería investigarse primero, con sus límites?'}]})});
  if(!r.ok)throw Error('Proveedor no disponible');const d=await r.json() as {choices?:{message?:{content?:string}}[];usage?:unknown};const message=d.choices?.[0]?.message?.content?.replace(/<think>[\s\S]*?<\/think>/g,'').trim();if(!message)throw Error('Respuesta vacía');return Response.json({mode:'nebius',model,message:message.slice(0,7000),usage:d.usage,alternatives:facts.alternatives},{headers});
 }catch{return Response.json({error:'No se pudo completar la consulta real a Nebius. Los cálculos locales siguen disponibles.'},{status:502,headers})}
}
