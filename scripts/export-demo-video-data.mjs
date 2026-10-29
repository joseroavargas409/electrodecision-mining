import {writeFileSync,mkdirSync} from 'node:fs';
import {shiftDefaults,compareShiftAlternatives} from '../src/lib/shift-lab.ts';
import {simulateCampaign} from '../src/lib/shift-campaign.ts';
import {assessProjectReadiness,getProjectContext} from '../src/lib/project-review.ts';

// Renderable numerical output, not browser footage or a simulated provider response.
const target=new URL('../examples/demo-video/',import.meta.url);
mkdirSync(target,{recursive:true});
const alternatives=compareShiftAlternatives(shiftDefaults);
const campaign=simulateCampaign({...shiftDefaults,chargers:2,limitKw:1400},60);
const project={technology:'trolley',phase:'integration',jurisdiction:'CL',answers:{}};
const review=assessProjectReadiness(project,'en');
const declaredReview=assessProjectReadiness({...project,answers:{grid:{state:'documented',reference:'SYNTHETIC DEMO: declared reference; document contents not verified.'}}},'en');
const data={schemaVersion:1,release:'0.11.0',synthetic:true,
  provenance:'Direct execution of the same TypeScript calculation and evidence modules used by /demo. No browser or screen capture.',
  config:shiftDefaults,alternatives,campaign,project,review,declaredReview,context:getProjectContext(project,'en')};
writeFileSync(new URL('module-output.json',target),JSON.stringify(data));
console.log(JSON.stringify({alternatives:alternatives.map(a=>({id:a.id,tonnes:a.result.deliveredT,overloadMinutes:a.result.overloadMinutes})),secondShiftTonnes:campaign.second.deliveredT,criticalOpen:review.criticalOpen}));
