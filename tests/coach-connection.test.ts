import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handleCoachRequest} from '../supabase/functions/auto-coach/handler';
import {coachErrorMessage} from '../lib/coach-errors';
const config:Record<string,string>={COACH_ALLOWED_ORIGINS:'https://questproj-rho.vercel.app',COACH_DEV_ORIGINS:'http://localhost:3015,http://127.0.0.1:3015',SUPABASE_URL:'https://project.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-only'};
const runtime={env:(name:string)=>config[name],fetch:(async()=>{throw new Error('No network should be used for these checks')}) as typeof fetch};
test('exact configured production and development origins receive valid preflight headers',async()=>{
 for(const origin of ['http://localhost:3015','http://127.0.0.1:3015','https://questproj-rho.vercel.app']){
  const res=await handleCoachRequest(new Request('https://project.supabase.co/functions/v1/auto-coach',{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'POST'}}),runtime);
  assert.equal(res.status,204);assert.equal(res.headers.get('Access-Control-Allow-Origin'),origin);assert.match(res.headers.get('Access-Control-Allow-Headers')||'',/authorization/);
 }
});
test('unlisted origins stay denied; enabling localhost does not weaken user authentication',async()=>{
 for(const origin of ['https://attacker.invalid','http://localhost:9999','http://localhost:3015.attacker.invalid']){
  const res=await handleCoachRequest(new Request('https://project.supabase.co',{method:'OPTIONS',headers:{Origin:origin}}),runtime);assert.equal(res.status,403);assert.equal(res.headers.get('Access-Control-Allow-Origin'),null);
 }
 const res=await handleCoachRequest(new Request('https://project.supabase.co',{method:'POST',headers:{Origin:'http://localhost:3015'}}),runtime);assert.equal(res.status,401);assert.equal(res.headers.get('Access-Control-Allow-Origin'),'http://localhost:3015');
});
test('network errors provide actionable diagnostics without mislabelling provider errors',()=>{
 assert.match(coachErrorMessage(new TypeError('Failed to fetch'),'http://localhost:3015'),/COACH_DEV_ORIGINS/);
 assert.match(coachErrorMessage(new Error('NetworkError when attempting to fetch resource.')),/draft is saved/);
 assert.equal(coachErrorMessage(new Error('Daily app limit reached.')),'Daily app limit reached.');
 assert.match(coachErrorMessage(new DOMException('Operation aborted','AbortError')),/timed out/);
});
