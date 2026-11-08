import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshProgress,validateProgress} from '../lib/progress';
import {blankStudio,mergeStudio,validateStudio,type StudioRecord} from '../lib/studio-state';
import {appendEvent,staleOpenSource,weekSummary,wipWarning,careerSettings} from '../lib/career/logic';
import {indiaDay,consistencySummary,dailyRecord} from '../lib/consistency/logic';
import {blankPractice} from '../lib/learning';
const now=new Date('2026-11-08T12:00:00Z');
function item(status:string,updatedAt='2026-11-01T12:00:00Z'):StudioRecord{return {fields:{schemaVersion:'1',title:'Fix a test',status,notes:'',careerHistory:'[]'},attempts:[],updatedAt}}
test('soft limits count active statuses, exclude the current item and allow exits',()=>{
 const studio={'career-os-a':item('working'),'career-os-b':item('pr_open')};
 assert.equal(wipWarning(studio,'opensource','career-os-c','commented',now).exceeded,true);
 assert.equal(wipWarning(studio,'opensource','career-os-a','changes_requested',now).exceeded,false);
 assert.equal(wipWarning(studio,'opensource','career-os-a','merged',now).exceeded,false);
 const configured={...studio,[careerSettings]:{...blankStudio(),updatedAt:now.toISOString(),fields:{opensource:'3',hackathon:'0'}}};
 assert.equal(wipWarning(configured,'opensource','career-os-c','working',now).exceeded,false);
 assert.equal(wipWarning(configured,'hackathon','radar-b','registered',now).exceeded,true);
 assert.equal(wipWarning({'radar-a':item('building')},'hackathon','radar-b','registered',now).exceeded,true);
});
test('stale boundary is exactly 14 days, terminal items excluded, future updates not stale',()=>{
 assert.equal(staleOpenSource(item('working','2026-10-25T12:00:00Z'),now),true);
 assert.equal(staleOpenSource(item('working','2026-10-25T12:00:01Z'),now),false);
 assert.equal(staleOpenSource(item('merged','2026-10-01T12:00:00Z'),now),false);
 assert.equal(staleOpenSource(item('dropped','2026-10-01T12:00:00Z'),now),false);
 assert.equal(staleOpenSource(item('working','2026-11-09T00:00:00Z'),now),false);
});
test('weekly summary uses Monday India time, unique items and no inferred legacy events',()=>{
 const p=freshProgress();const r=item('new');
 r.fields.careerHistory=appendEvent(r.fields,'working',new Date('2026-11-02T00:00:00Z'));r.fields.status='working';
 r.fields.careerHistory=appendEvent(r.fields,'merged',new Date('2026-11-04T00:00:00Z'));r.fields.status='merged';
 const h=item('building');h.fields.careerHistory=JSON.stringify([{at:'2026-11-03T00:00:00Z',from:'registered',to:'building'},{at:'2026-11-04T00:00:00Z',from:'building',to:'submitted'}]);
 p.studio={'career-os-a':r,'career-os-legacy':item('merged'),'radar-a':h};
 p.practice={'dsa-one':{...blankPractice(),solvedAt:'2026-11-03T00:00:00Z'},'dsa-old':{...blankPractice(),solvedAt:'2026-11-01T18:29:59Z'},'dsa-future':{...blankPractice(),solvedAt:'2026-11-09T00:00:00Z'},'sql-one':{...blankPractice(),solvedAt:'2026-11-03T00:00:00Z'}};
 p.days={1:{steps:[],answers:{},notes:'',updatedAt:now.toISOString(),reviewLevel:0,completedAt:'2026-11-01T18:30:00Z'},2:{steps:[],answers:{},notes:'',updatedAt:now.toISOString(),reviewLevel:0,completedAt:'2026-11-01T18:29:59Z'}};
 const summary=weekSummary(p,now);
 assert.equal(summary.start,'2026-11-02');assert.equal(summary.end,'2026-11-08');
 assert.equal(summary.dsaSolved,1);
 assert.equal(summary.questsCompleted,1);assert.equal(summary.openSourceMoved,1);assert.equal(summary.openSourceMerged,1);assert.equal(summary.hackathonsProgressed,1);
 assert.equal(weekSummary(p,new Date('2026-11-09T00:00:00Z')).openSourceMerged,0);
});
test('review snapshots round-trip and do not generate mutable merge attempts',()=>{
 const p=freshProgress(),createdAt=now.toISOString(),fields={schemaVersion:'1',createdAt,summary:JSON.stringify(weekSummary(p,now)),shipped:'A small fix',stuck:'Testing',priority:'Finish the tests'};
 const record={fields,attempts:[],updatedAt:createdAt};p.studio={'career-review-a':record};
 assert.deepEqual(validateProgress(JSON.parse(JSON.stringify(p))).studio,p.studio);
 const newer={...record,fields:{...fields,priority:'Changed'},updatedAt:'2026-11-09T00:00:00Z'};
 assert.deepEqual(mergeStudio(p.studio,{'career-review-a':newer})['career-review-a'],record);
 assert.deepEqual(mergeStudio({'career-review-a':newer},p.studio)['career-review-a'],record);
 assert.throws(()=>validateStudio({'career-review-a':{...record,fields:{...fields,schemaVersion:'2'}}}));
 assert.throws(()=>validateStudio({[careerSettings]:{...record,fields:{opensource:'-1'}}}));
});
test('India midnight and daily restart do not infer course completion',()=>{
 assert.equal(indiaDay(new Date('2026-11-08T18:29:59Z')),'2026-11-08');
 assert.equal(indiaDay(new Date('2026-11-08T18:30:00Z')),'2026-11-09');
 const p=freshProgress();p.studio={'consistency-settings':{fields:{started:'2026-11-06',enabled:'yes'},attempts:[],updatedAt:now.toISOString()}};
 assert.equal(consistencySummary(p,now).restart,true);
 p.studio[dailyRecord('2026-11-08')]={fields:{status:'done',minutes:'10',target:'10',note:'Traced an array'},attempts:[],updatedAt:now.toISOString()};
 assert.equal(consistencySummary(p,now).status,'done');assert.equal(Object.keys(p.days).length,0);
 assert.deepEqual(validateProgress(JSON.parse(JSON.stringify(p))).studio,p.studio);
});
