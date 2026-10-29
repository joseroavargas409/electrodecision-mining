import {writeFileSync,mkdirSync} from 'node:fs';
import {projectDefaults,assessProjectReadiness,getProjectContext} from '../src/lib/project-review.ts';
const root=new URL('../examples/project-review/',import.meta.url);mkdirSync(root,{recursive:true});
const definitions=[{id:'trolley-integracion',technology:'trolley',phase:'integration'},{id:'swap-operacion',technology:'swap',phase:'operation'},{id:'bev-chile',technology:'underground_bev',phase:'integration'}];
for(const example of definitions){const context={...projectDefaults,technology:example.technology,phase:example.phase,answers:{duty:{state:'documented',reference:'EJEMPLO SINTÉTICO · ciclo declarado, sin documento real validado.'},grid:{state:'pending',reference:'EJEMPLO SINTÉTICO · demanda y conexión por estudiar.'}}};writeFileSync(new URL(example.id+'.json',root),JSON.stringify({schemaVersion:10,synthetic:true,context,review:assessProjectReadiness(context),evidence:getProjectContext(context)},null,2));}
console.log('Tres expedientes sintéticos exportados con referencias y acciones.');
