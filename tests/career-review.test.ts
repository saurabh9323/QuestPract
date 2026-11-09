import {test} from 'node:test';
import assert from 'node:assert/strict';
import {questionBank} from '../lib/bank';
import {quests} from '../lib/curriculum';
import {emptyDay,type Progress} from '../lib/progress';
import {blankPractice} from '../lib/learning';
import type {StudioRecord,StudioState} from '../lib/studio-state';
import {weekSummary,type Event} from '../lib/career/logic';
import {latestReviewPriority,reviewWeek} from '../lib/career/review';

const now=new Date('2026-11-11T12:00:00.000Z');
const currentMonday='2026-11-08T18:30:00.000Z';
const previousMonday='2026-11-01T18:30:00.000Z';
function progress():Progress{return {version:1,startDate:'2026-09-14',days:{},todos:[],updatedAt:now.toISOString()};}
function item(title:string,events:Event[]=[],status='merged'):StudioRecord{
 return {fields:{schemaVersion:'1',title,status,careerHistory:JSON.stringify(events)},attempts:[],updatedAt:now.toISOString()};
}
function event(at:string,from='new',to='working'):Event{return {at,from,to};}
function snapshot(createdAt:string,priority:string):StudioRecord{
 return {fields:{schemaVersion:'1',createdAt,priority,shipped:'A fix',stuck:'Testing',summary:JSON.stringify(reviewWeek(progress(),new Date(createdAt),0).summary)},attempts:[],updatedAt:createdAt};
}

test('review weeks switch exactly at Monday midnight IST, including a year boundary',()=>{
 const p=progress();
 const sunday=reviewWeek(p,new Date('2026-11-08T18:29:59.999Z'),0).summary;
 assert.equal(sunday.start,'2026-11-02');assert.equal(sunday.end,'2026-11-08');
 const monday=reviewWeek(p,new Date(currentMonday),0).summary;
 assert.equal(monday.start,'2026-11-09');assert.equal(monday.end,'2026-11-15');
 const previous=reviewWeek(p,new Date(currentMonday),-1).summary;
 assert.equal(previous.start,'2026-11-02');assert.equal(previous.end,'2026-11-08');
 assert.equal(previous.asOf,currentMonday);assert.equal(previous.timezone,'Asia/Kolkata');
 const newYear=reviewWeek(p,new Date('2027-01-01T06:00:00.000Z'),0).summary;
 assert.equal(newYear.start,'2026-12-28');assert.equal(newYear.end,'2027-01-03');
});

test('previous week includes both India boundaries but excludes the following Monday',()=>{
 const p=progress();
 const times=[previousMonday,'2026-11-08T18:29:59.999Z',currentMonday,'2026-11-01T18:29:59.999Z'];
 p.practice=Object.fromEntries(times.map((at,i)=>[`dsa-${i}`,{...blankPractice(),solvedAt:at}]));
 p.days=Object.fromEntries(times.map((at,i)=>[String(i+1),{...emptyDay(),completedAt:at}]));
 p.studio=Object.fromEntries(times.flatMap((at,i)=>[[`career-os-${i}`,item(`Contribution ${i}`,[event(at,'working','merged')])],[`radar-${i}`,item(`Hackathon ${i}`,[event(at,'registered','building')])]]));
 const {summary,evidence}=reviewWeek(p,now,-1);
 for(const key of ['dsaSolved','questsCompleted','openSourceMoved','openSourceMerged','hackathonsProgressed'] as const){
  assert.equal(summary[key],2);assert.equal(evidence[key].length,2);
  assert.deepEqual(evidence[key].map(row=>row.at),[times[1],times[0]]);
 }
 assert.equal(summary.asOf,now.toISOString());
});

test('current evidence preserves existing summary counts, deduplicates changes and excludes future/undated work',()=>{
 const p=progress(),at=now.toISOString(),future='2026-11-11T12:00:00.001Z';
 p.practice={
  'dsa-now':{...blankPractice(),solvedAt:at},'dsa-start':{...blankPractice(),solvedAt:currentMonday},
  'dsa-future':{...blankPractice(),solvedAt:future},'dsa-undated':blankPractice(),
  'dsa-invalid':{...blankPractice(),solvedAt:'invalid'},'sql-now':{...blankPractice(),solvedAt:at}
 };
 p.days={1:{...emptyDay(),completedAt:at},2:{...emptyDay(),completedAt:future},3:{...emptyDay(),updatedAt:at}};
 p.studio={
  'career-os-repeat':item('Repeated transitions',[event(currentMonday),event(at,'working','merged'),event(at,'working','merged'),event(future,'merged','working')]),
  'career-os-noop':item('No-op',[event(at,'merged','merged')]),
  'career-os-legacy':item('Undated existing merge'),
  'career-os-future':item('Future merge',[event(future,'working','merged')]),
  'radar-repeat':item('Build demo',[event(currentMonday,'interested','registered'),event(at,'registered','building'),event(at,'registered','building'),event(future,'building','submitted')]),
  'radar-regressed':item('Regressed',[event(at,'building','registered')]),
  'radar-noop':item('No-op',[event(at,'building','building')]),
  'radar-legacy':item('Undated submission',[],'submitted')
 };
 const before=JSON.stringify(p),{summary,evidence}=reviewWeek(p,now,0);
 assert.deepEqual(summary,weekSummary(p,now));
 assert.deepEqual([summary.dsaSolved,summary.questsCompleted,summary.openSourceMoved,summary.openSourceMerged,summary.hackathonsProgressed],[2,1,1,1,1]);
 assert.deepEqual(evidence.openSourceMoved,[{id:'career-os-repeat',title:'Repeated transitions',at}]);
 assert.deepEqual(evidence.openSourceMerged,evidence.openSourceMoved);
 assert.deepEqual(evidence.hackathonsProgressed,[{id:'radar-repeat',title:'Build demo',at}]);
 assert.equal(JSON.stringify(p),before);
});

test('evidence uses authored titles, honest ID fallbacks and stable ordering',()=>{
 const p=progress(),question=questionBank.find(q=>q.kind==='DSA')!,at=now.toISOString();
 p.practice={'dsa-unknown-z':{...blankPractice(),solvedAt:at},[question.id]:{...blankPractice(),solvedAt:at},'dsa-unknown-a':{...blankPractice(),solvedAt:at}};
 p.days={1:{...emptyDay(),completedAt:at}};
 const {evidence}=reviewWeek(p,now,0);
 assert.equal(evidence.dsaSolved.find(row=>row.id===question.id)?.title,question.title);
 assert.equal(evidence.dsaSolved.find(row=>row.id==='dsa-unknown-a')?.title,'DSA problem · dsa-unknown-a');
 assert.deepEqual(evidence.dsaSolved.map(row=>row.id),Object.keys(p.practice).sort((a,b)=>a.localeCompare(b)));
 assert.deepEqual(evidence.questsCompleted,[{id:'quest-1',title:`Day 1 · ${quests[0].title}`,at}]);
});

test('empty weeks stay empty and never infer career activity from current status or update time',()=>{
 const p=progress();p.studio={'career-os-old':item('Old merge'),'radar-old':item('Old submission',[],'submitted')};
 for(const offset of [0,-1] as const){
  const {summary,evidence}=reviewWeek(p,now,offset);
  for(const key of ['dsaSolved','questsCompleted','openSourceMoved','openSourceMerged','hackathonsProgressed'] as const){assert.equal(summary[key],0);assert.deepEqual(evidence[key],[]);}
 }
});

test('latest priority reads immutable creation dates and skips malformed snapshots without mutation',()=>{
 const old=snapshot('2026-11-08T12:00:00.000Z','Finish the parser'),latest=snapshot('2026-11-10T12:00:00.000Z','Ship the demo');
 old.updatedAt='2026-11-12T12:00:00.000Z';
 const badJson={...snapshot('2026-11-11T12:00:00.000Z','Ignore'),fields:{...latest.fields,summary:'broken'}};
 const badDate={...latest,fields:{...latest.fields,createdAt:'not a date'}};
 const emptyPriority={...latest,fields:{...latest.fields,priority:' '}};
 const badSummary={...latest,fields:{...latest.fields,summary:JSON.stringify({...reviewWeek(progress(),new Date(latest.fields.createdAt),0).summary,start:'2026-02-30'})}};
 const studio:StudioState={'career-review-old':old,'career-review-latest':latest,'career-review-bad-json':badJson,'career-review-bad-date':badDate,'career-review-empty':emptyPriority,'career-review-bad-summary':badSummary,'career-os-priority':latest};
 const before=JSON.stringify(studio);
 assert.deepEqual(latestReviewPriority(studio),{id:'career-review-latest',priority:'Ship the demo',createdAt:'2026-11-10T12:00:00.000Z',weekStart:'2026-11-09'});
 assert.equal(JSON.stringify(studio),before);
 assert.equal(latestReviewPriority(),null);
 assert.equal(latestReviewPriority({'career-review-malformed':null} as unknown as StudioState),null);
});
