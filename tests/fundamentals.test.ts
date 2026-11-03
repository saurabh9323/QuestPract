import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fundamentalTracks,trackQuestions,fundamentalsMarkdown} from '../lib/fundamentals';
import {fundamentalCatalog} from '../lib/fundamentals/catalog';
import {commonFoundations} from '../lib/fundamentals/common';
import {fundamentalLessons} from '../lib/fundamentals/commute';
import {fundamentalProgress,fundamentalRecord} from '../lib/fundamentals/progress';
import {parseWorkspacePath,workspaceStaticPaths} from '../lib/workspace-routes';
import {freshProgress,validateProgress} from '../lib/progress';
import {blankStudio} from '../lib/studio-state';
import {fundamentalTutorContext} from '../lib/fundamentals/tutor';

test('all requested tracks have 20 complete concepts and 100 stable question IDs',()=>{
 assert.equal(fundamentalTracks.length,17);
 assert.deepEqual(fundamentalTracks.map(t=>t.id),fundamentalCatalog.map(t=>t.id));
 const ids=new Set<string>();
 for(const t of fundamentalTracks){
  assert.equal(t.concepts.length,20,t.id);
  assert.equal(new Set(t.concepts.map(c=>c.id)).size,20,t.id);
  assert.equal(new Set(t.concepts.map(c=>c.title.toLowerCase())).size,20,t.id);
  assert.ok(t.runtime.length>=3,t.id);assert.ok(t.threading.length>60,t.id);
  assert.ok(t.sources.length>=1,t.id);t.sources.forEach(s=>assert.equal(new URL(s.url).protocol,'https:'));
  for(const c of t.concepts){
   assert.match(c.id,/^[a-z0-9-]+$/);
   for(const field of ['definition','why','example','code','output','execution','pitfall','exercise'] as const)assert.ok(c[field]?.trim().length>(field==='output'?0:10),`${t.id}/${c.id}/${field}`);
  }
  const qs=trackQuestions(t);assert.equal(qs.length,100);
  for(const q of qs){assert.ok(!ids.has(q.id),q.id);ids.add(q.id);assert.ok(t.concepts.some(c=>c.id===q.conceptId));assert.ok(q.answer.length>10);}
 }
 assert.equal(ids.size,1700);
});
test('tutor handoff stays within the existing pinned context limit and reports trimming',()=>{
 const t=fundamentalTracks[0],c=t.concepts[0],q=trackQuestions(t)[0];
 const bounded=fundamentalTutorContext(t,c,q,'My explanation '.repeat(300));
 assert.ok(bounded.text.length<=1600);assert.equal(bounded.trimmed,true);assert.ok(bounded.text.includes(q.question));assert.ok(bounded.text.includes('My draft: My explanation'));
 const short=fundamentalTutorContext(t,{...c,code:'x=1',output:'1'},{...q,answer:'A value.'},'Short answer');
 assert.equal(short.trimmed,false);assert.ok(short.text.includes('Short answer'));
});
test('new direct routes are generated and reject unknown tracks while existing routes remain intact',()=>{
 assert.deepEqual(parseWorkspacePath('/fundamentals/'),{view:'fundamentals'});
 for(const {id} of fundamentalCatalog){assert.deepEqual(parseWorkspacePath(`/fundamentals/${id}/`),{view:'fundamentals'});assert.ok(workspaceStaticPaths.some(p=>p.join('/')===`fundamentals/${id}`));}
 assert.equal(parseWorkspacePath('/fundamentals/not-a-track/'),null);
 assert.equal(parseWorkspacePath('/fundamentals/react/extra'),null);
 assert.deepEqual(parseWorkspacePath('/day/20/'),{view:'quest',day:20});
 assert.deepEqual(parseWorkspacePath('/practice/'),{view:'studio'});
});
test('commute lessons and cross-track links resolve to the same authored concepts',()=>{
 assert.equal(fundamentalLessons.length,340);assert.equal(new Set(fundamentalLessons.map(l=>l.id)).size,340);
 for(const t of fundamentalTracks)for(const c of t.concepts){const l=fundamentalLessons.find(l=>l.id===`guide-fundamentals-${t.id}-${c.id}`)!;assert.ok(l);assert.equal(l.code,c.code);assert.equal(l.questions?.length,5);assert.ok(l.steps.some(s=>s.detail===c.execution));}
 for(const c of commonFoundations)c.tracks.forEach(id=>assert.ok(fundamentalTracks.some(t=>t.id===id),id));
 const p=freshProgress(),at='2026-11-03T08:00:00Z';
 p.reading=Object.fromEntries(fundamentalLessons.map(l=>[l.id,{bookmarked:true,notes:'Review this.',visitedAt:at,updatedAt:at,readAt:at}]));
 assert.doesNotThrow(()=>validateProgress(p),'Every new lesson ID must be accepted by existing account backup validation');
});
test('self-assessments persist per concept without completing course days or inferring readiness from notes',()=>{
 const p=freshProgress(),t=fundamentalTracks[0],c=t.concepts[0],id=fundamentalRecord(t.id,c.id),at='2026-11-03T08:00:00Z';
 p.studio={[id]:{...blankStudio(),updatedAt:at,fields:{rating_Explain:'ready',rating_Trace:'revise',answer_Explain:'A value has a type and an owner.',notes:'I still need to practise.'}}};
 const before=JSON.stringify(p.days);validateProgress(p);
 assert.deepEqual(fundamentalProgress(t,p.studio),{ready:1,revise:1,attempted:1,total:100});
 assert.equal(JSON.stringify(p.days),before);
 p.studio[id].fields.rating_Explain='';
 assert.equal(fundamentalProgress(t,p.studio).ready,0);
 assert.equal(fundamentalProgress(t,p.studio).attempted,1);
 assert.equal(fundamentalProgress(fundamentalTracks[1],p.studio).ready,0);
});
test('download includes every question, worked code, execution caveat and references',()=>{
 for(const t of fundamentalTracks){const md=fundamentalsMarkdown(t);for(const q of trackQuestions(t))assert.ok(md.includes(q.question));for(const c of t.concepts)assert.ok(md.includes(c.code));assert.ok(md.includes('not executed or judged'));assert.ok(md.includes(t.sources[0].url));}
});
