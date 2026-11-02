import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshProgress,emptyDay,validateProgress,toggleStep,type Progress} from '../lib/progress';
import {submitQuest} from '../lib/planning';
import {readCoachPack} from '../lib/auto-coach';
import {validCoachInput} from '../lib/coach-contract';
import {dayAssignments} from '../lib/course';
import {quests} from '../lib/curriculum';
import {prepareLoginRevision,revisionDay,revisionStatus,revisionDays,revisionTargets,revisionEntries,revisionContext,revisionPack,duplicateRevision,REVISION_SETTINGS,REVISION_CONTEXT_CAP} from '../lib/repair-lab/adaptive';
import {recallQuestions,recallRecordId} from '../lib/repair-lab/recall';
import {autoCoachAfterSubmission,addCoachPack} from '../lib/auto-coach';
import type {StudioRecord} from '../lib/studio-state';
import {handleCoachRequest} from '../supabase/functions/auto-coach/handler';

const now=new Date('2026-11-02T04:00:00Z'),day='2026-11-02';
function progress(days:number[]):Progress{
  const p=freshProgress();
  for(const d of days)p.days[d]={...emptyDay(),steps:quests[d-1].steps.map(s=>s.id),updatedAt:'2026-10-30T12:00:00Z',completedAt:'2026-10-30T12:00:00Z'};
  return p;
}
test('fresh accounts and paused automation never queue Gemini',()=>{
  const empty=freshProgress();assert.equal(prepareLoginRevision(empty,now),empty);
  const p=progress([1,2]);p.studio={[REVISION_SETTINGS]:{fields:{enabled:'no'},attempts:[],updatedAt:now.toISOString()}};
  assert.equal(prepareLoginRevision(p,now),p);assert.equal(revisionStatus(p,day).reason,'paused');
});
test('uses exact completed IDs across all 90 days, not calendar day or assumed first 20',()=>{
  const p=progress([2,18,42,90]);p.days[3]={...emptyDay(),notes:'not finished'};
  p.days[4]={...emptyDay(),completedAt:'2026-12-01T10:00:00Z'};
  assert.deepEqual(revisionDays(p,day),[2,18,42,90]);
  const targets=revisionTargets(p,revisionDays(p,day),day);
  assert.ok(targets.length>0&&targets.length<=3);
  assert.ok(targets.every(t=>[2,18,42,90].includes(t.day)));
  assert.ok(targets.some(t=>t.day===90));
  for(const t of targets.filter(t=>t.kind==='DSA'))assert.ok(dayAssignments(t.day).dsa.some(q=>q.id===t.id));
});
test('one completed day has a small set, larger histories have three unique targets',()=>{
  for(const days of [[1],[9],[1,2,3],Array.from({length:90},(_,i)=>i+1)]){
    const p=progress(days),targets=revisionTargets(p,days,day);
    assert.equal(new Set(targets.map(t=>t.id)).size,targets.length);
    assert.ok(targets.length>=2&&targets.length<=3);
    assert.ok(targets.some(t=>t.kind==='Concept'));
  }
});
test('reopened course days no longer count even when completed submissions exist in history',()=>{
  const p=submitQuest(progress([1,2]),1,'complete','',20,now);
  const reopened=toggleStep(p,1,quests[0].steps[0].id,now);
  assert.equal(reopened.days[1].submissions?.[0].status,'complete');
  assert.deepEqual(revisionDays(reopened,day),[2]);
});
test('each login reuses a same-day completion set, with stable requests across simultaneous tabs',()=>{
  const p=progress([1,2,3]),before=JSON.stringify(p),a=prepareLoginRevision(p,now);
  const b=prepareLoginRevision(structuredClone(p),new Date('2026-11-02T08:00:00Z'));
  assert.notEqual(a,p);assert.equal(JSON.stringify(p),before);
  assert.equal(prepareLoginRevision(a,new Date('2026-11-02T09:00:00Z')),a);
  assert.deepEqual(revisionEntries(a).map(([id,r])=>[id,r.fields.pack,r.fields.requestId]),revisionEntries(b).map(([id,r])=>[id,r.fields.pack,r.fields.requestId]));
  validateProgress(a);
  for(const [id,r] of revisionEntries(a)){
    const pack=readCoachPack(r.fields.pack)!;
    assert.equal(pack.lesson.id,id);assert.ok(validCoachInput(pack.input));
    assert.match(r.fields.requestId,/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/);
    assert.equal(r.fields.cloudStatus,'pending');assert.equal(r.fields.research,'no');
  }
});
test('new completions refresh once, a third same-day set is capped, next day resumes',()=>{
  const first=prepareLoginRevision(progress([1,2]),now);
  const changed={...first,days:{...first.days,3:progress([3]).days[3]}};
  const second=prepareLoginRevision(changed,now);
  assert.equal(new Set(revisionEntries(second).map(([,r])=>r.fields.revisionBatch)).size,2);
  const again={...second,days:{...second.days,4:progress([4]).days[4]}};
  assert.equal(revisionStatus(again,day).reason,'daily-limit');assert.equal(prepareLoginRevision(again,now),again);
  const tomorrow=prepareLoginRevision(again,new Date('2026-11-03T04:00:00Z'));
  assert.equal(revisionEntries(tomorrow).length,9);
});
test('pending and failed jobs do not auto-retry on login or overwrite work',()=>{
  const p=prepareLoginRevision(progress([1,2,3]),now),[id,r]=revisionEntries(p)[0];
  p.studio![id]={...r,fields:{...r.fields,cloudStatus:'failed',cloudError:'Rate limit'}};
  assert.equal(prepareLoginRevision(p,now),p);assert.equal(p.studio![id].fields.cloudError,'Rate limit');
  assert.equal(autoCoachAfterSubmission(progress([1,2,3]),p),p);
});
test('completed quiz mistakes influence selection without leaking answers, notes, email or history',()=>{
  const p=progress(Array.from({length:20},(_,i)=>i+1)),q=recallQuestions[1];
  p.profile={fullName:'DO-NOT-SEND-NAME',communicationGoal:'DO-NOT-SEND-PROFILE'};
  p.days[2].notes='DO-NOT-SEND-NOTES';
  p.studio={[recallRecordId(q.id)]:{updatedAt:now.toISOString(),fields:{reasoning:'DO-NOT-SEND-REASON'},attempts:[{id:'miss',at:now.toISOString(),outcome:'Review this decision',hints:0,fields:{kind:'recall-choice',choice:String((q.answer+1)%4),reasoning:'DO-NOT-SEND-ANSWER'}}]}};
  const targets=revisionTargets(p,revisionDays(p,day),day);
  assert.equal(targets[0].id,q.id);assert.match(targets[0].reason,/mistake/);
  const next=prepareLoginRevision(p,now);
  for(const [,r] of revisionEntries(next))assert.doesNotMatch(r.fields.pack,/DO-NOT-SEND/);
  assert.deepEqual(next.days,p.days);
});
test('context size is bounded, valid JSON, and visibly records trimming',()=>{
  const target=revisionTargets(progress([1]),[1],day)[0];
  const result=revisionContext(Array.from({length:90},(_,i)=>i+1),{...target,title:'x'.repeat(5000),prompt:'p'.repeat(20000),reason:'r'.repeat(5000)},Array(20).fill('q'.repeat(2000)));
  assert.ok(result.text.length<=REVISION_CONTEXT_CAP);assert.equal(result.trimmed,true);
  const parsed=JSON.parse(result.text);assert.equal(parsed.contextTrimmed,true);assert.equal(parsed.completedCount,90);
});
function completed(id:string,record:StudioRecord,question='Which earlier value is needed?'){
  const pack=readCoachPack(record.fields.pack)!;
  const ai={...pack,mode:'gemini' as const,lesson:{...pack.lesson,id,quiz:{question,choices:['A','B'],answer:1,why:'B meets the contract.'}}};
  return {...record,fields:{...record.fields,cloudStatus:'complete',aiPack:JSON.stringify(ai)}};
}
test('only validated matching Gemini questions are displayed, not local scaffolds or stale responses',()=>{
  const [id,r]=revisionEntries(prepareLoginRevision(progress([1,2,3]),now))[0];
  assert.equal(revisionPack(id,r),null);
  const good=completed(id,r);assert.ok(revisionPack(id,good));
  const ai=JSON.parse(good.fields.aiPack);ai.input.topic='different question';
  assert.equal(revisionPack(id,{...good,fields:{...good.fields,aiPack:JSON.stringify(ai)}}),null);
  const duplicateOptions=JSON.parse(good.fields.aiPack);duplicateOptions.lesson.quiz.choices=['Same','same!'];
  assert.equal(revisionPack(id,{...good,fields:{...good.fields,aiPack:JSON.stringify(duplicateOptions)}}),null);
  assert.equal(revisionPack(id,{...good,fields:{...good.fields,cloudStatus:'pending'}}),null);
});
test('exact-text duplicates have one visible original and a later flagged copy',()=>{
  const entries=revisionEntries(prepareLoginRevision(progress([1,2,3]),now)).slice(0,2).map(([id,r])=>[id,completed(id,r)] as [string,StudioRecord]);
  const flags=entries.map(([id,r])=>duplicateRevision(id,revisionPack(id,r)!,entries));
  assert.equal(flags.filter(Boolean).length,1);
});
test('revision calendar uses India midnight and account storage limits prevent unbounded queues',()=>{
  assert.equal(revisionDay(new Date('2026-11-02T18:29:59Z')),'2026-11-02');
  assert.equal(revisionDay(new Date('2026-11-02T18:30:00Z')),'2026-11-03');
  const p=progress([1]);p.studio=Object.fromEntries(Array.from({length:1797},(_,i)=>[`saved-${i}`,{fields:{},attempts:[],updatedAt:now.toISOString()}]));
  assert.equal(revisionStatus(p,day).reason,'storage-limit');assert.equal(prepareLoginRevision(p,now),p);
});
test('personal revision records do not consume the regular submission-coach shelf capacity',()=>{
  const p=progress([1]),sample=readCoachPack(revisionEntries(prepareLoginRevision(p,now))[0][1].fields.pack)!;
  p.studio=Object.fromEntries(Array.from({length:110},(_,i)=>[`auto-pack-${i.toString(16)}-aaaa`,{fields:{loginRevision:'yes'},attempts:[],updatedAt:now.toISOString()}]));
  const next=addCoachPack(p,{...sample.input,source:'question:dsa-arrays-01',attemptId:'new-real-submission'},now);
  assert.notEqual(next,p);
  validateProgress(next);
});
test('queued revision uses the existing authenticated Edge Function contract end to end with a mocked provider',async()=>{
  const [id,record]=revisionEntries(prepareLoginRevision(progress([1,2,3]),now))[0],input=readCoachPack(record.fields.pack)!.input;
  const sample=JSON.parse(completed(id,record).fields.aiPack);
  const settings:Record<string,string>={COACH_ALLOWED_ORIGINS:'https://portal.test',SUPABASE_URL:'https://project.test',SUPABASE_SERVICE_ROLE_KEY:'test-service',GEMINI_API_KEY:'test-gemini'};
  let providerCalls=0;
  const fetcher:typeof fetch=async(url,options)=>{
    const endpoint=String(url);
    if(endpoint.endsWith('/auth/v1/user'))return Response.json({id:'test-owner'});
    if(endpoint.endsWith('/rpc/quest90_coach_reserve'))return Response.json({status:'reserved'});
    if(endpoint.startsWith('https://generativelanguage.googleapis.com/')){
      providerCalls++;
      const body=JSON.parse(String(options?.body));
      assert.deepEqual(JSON.parse(body.contents[0].parts[0].text).submission,input);
      return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(sample)}]}}]});
    }
    if(endpoint.includes('/rest/v1/quest90_coach_jobs?'))return new Response(null,{status:204});
    throw new Error(`Unexpected request: ${endpoint}`);
  };
  const response=await handleCoachRequest(new Request('https://project.test/functions/v1/auto-coach',{method:'POST',headers:{Origin:'https://portal.test',Authorization:'Bearer test-session','Content-Type':'application/json'},body:JSON.stringify({input,lessonId:id,requestId:record.fields.requestId,research:false})}),{env:name=>settings[name],fetch:fetcher});
  assert.equal(response.status,200);assert.equal(providerCalls,1);
  const body=await response.json();
  assert.ok(revisionPack(id,{...record,fields:{...record.fields,cloudStatus:'complete',aiPack:JSON.stringify(body.pack)}}));
});
