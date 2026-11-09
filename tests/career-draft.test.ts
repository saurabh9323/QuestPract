import {test} from 'node:test';
import assert from 'node:assert/strict';
import {careerDraftId,weekSummary} from '../lib/career/logic';
import {shiftDay} from '../lib/consistency/logic';
import {exportBackup,freshProgress,validateProgress} from '../lib/progress';
import {mergeStudio,validateStudio,type StudioRecord,type StudioState} from '../lib/studio-state';

const now=new Date('2026-11-09T12:00:00Z');
function draft(weekStart='2026-11-09',responses:Record<string,string>={}):StudioRecord{return {fields:{schemaVersion:'1',weekStart,...responses},attempts:[],updatedAt:now.toISOString()}}
function snapshot():StudioRecord{return {fields:{schemaVersion:'1',createdAt:now.toISOString(),summary:JSON.stringify(weekSummary(freshProgress(),now)),shipped:'A tested fix',stuck:'CI setup',priority:'Finish the workflow'},attempts:[],updatedAt:now.toISOString()}}

test('weekly draft backups accept missing, blank and partial responses without changing progress schema',()=>{
 const responseVariants:Record<string,string>[]=[{},{shipped:'',stuck:' ',priority:''},{shipped:'A useful fix'},{shipped:'x'.repeat(2000),stuck:'y'.repeat(2000),priority:'z'.repeat(2000)}];
 for(const responses of responseVariants){
  const progress=freshProgress(),record=draft('2026-11-09',responses);
  progress.studio={[careerDraftId('2026-11-09')]:record,'career-review-saved':snapshot()};
  const imported=JSON.parse(JSON.stringify(exportBackup(progress))).progress;
  assert.doesNotThrow(()=>validateStudio(imported.studio));
  assert.deepEqual(validateProgress(imported),progress);
  assert.equal(imported.version,1);
  assert.deepEqual(imported.days,{});
 }
 assert.doesNotThrow(()=>validateStudio({[careerDraftId('2016-02-29')]:draft('2016-02-29')}));
});

test('weekly drafts require an exact calendar Monday matching their record ID',()=>{
 for(const weekStart of ['2026-11-08','2026-11-10','2026-02-30','2026-02-29','2026-13-01','2026-00-01','2026-11-00','2026-1-09','26-11-09','2026-11-09T00:00:00Z','']){
  assert.throws(()=>validateStudio({[careerDraftId(weekStart)]:draft(weekStart)}),weekStart);
 }
 for(const id of ['career-draft','career-draft-','career-draft-a','career-draft-2026-11-02','career-draft-2026-11-09-extra']){
  assert.throws(()=>validateStudio({[id]:draft()}),id);
 }
 const missing=draft();delete missing.fields.weekStart;
 assert.throws(()=>validateStudio({[careerDraftId('2026-11-09')]:missing}));
});

test('weekly drafts reject unsupported versions, oversized answers and attempts',()=>{
 const id=careerDraftId('2026-11-09');
 for(const schemaVersion of ['','0','2'])assert.throws(()=>validateStudio({[id]:{...draft(),fields:{...draft().fields,schemaVersion}}}));
 const missing=draft();delete missing.fields.schemaVersion;
 assert.throws(()=>validateStudio({[id]:missing}));
 for(const field of ['shipped','stuck','priority'])assert.throws(()=>validateStudio({[id]:draft('2026-11-09',{[field]:'x'.repeat(2001)})}));
 assert.throws(()=>validateStudio({[id]:{...draft(),attempts:[{id:'attempt',at:now.toISOString(),fields:{},outcome:'Saved',hints:0}]}}));
});

test('draft merges select the newest edit in either direction without creating attempts',()=>{
 const id=careerDraftId('2026-11-09'),older=draft('2026-11-09',{shipped:'Earlier answer'});
 const newer={...draft('2026-11-09',{shipped:'New answer',stuck:''}),updatedAt:'2026-11-09T18:00:00+05:30'};
 for(const [left,right] of [[older,newer],[newer,older]]){
  const result=mergeStudio({[id]:left},{[id]:right});
  assert.deepEqual(result[id],newer);
  assert.deepEqual(result[id].attempts,[]);
  assert.doesNotThrow(()=>validateStudio(JSON.parse(JSON.stringify(result))));
 }
 assert.deepEqual(older.fields,{schemaVersion:'1',weekStart:'2026-11-09',shipped:'Earlier answer'});
});

test('draft timestamp ties converge deterministically in both merge directions',()=>{
 const id=careerDraftId('2026-11-09'),left=draft('2026-11-09',{priority:'Alpha'}),right=draft('2026-11-09',{priority:'Zulu'});
 const forward=mergeStudio({[id]:left},{[id]:right}),backward=mergeStudio({[id]:right},{[id]:left});
 assert.deepEqual(forward,backward);
 assert.deepEqual(forward[id],right);
 assert.deepEqual(forward[id].attempts,[]);
 assert.doesNotThrow(()=>validateStudio(JSON.parse(JSON.stringify(forward))));
});

test('drafts and immutable reviews have separate 104-record limits',()=>{
 const drafts:StudioState=Object.fromEntries(Array.from({length:104},(_,index)=>{const start=shiftDay('2024-01-01',index*7);return [careerDraftId(start),draft(start)]}));
 const reviews:StudioState=Object.fromEntries(Array.from({length:104},(_,index)=>['career-review-'+index,snapshot()]));
 assert.doesNotThrow(()=>validateStudio({...drafts,...reviews}));
 const extraStart=shiftDay('2024-01-01',104*7);
 assert.throws(()=>validateStudio({...drafts,[careerDraftId(extraStart)]:draft(extraStart)}),/Career storage limit/);
 assert.throws(()=>validateStudio({...reviews,'career-review-extra':snapshot()}),/Career storage limit/);
});

test('mutable drafts preserve immutable review snapshot merge behavior',()=>{
 const id=careerDraftId('2026-11-09'),saved=snapshot(),changed={...saved,fields:{...saved.fields,priority:'Changed after saving'},updatedAt:'2026-11-10T12:00:00Z'};
 const original:StudioState={[id]:draft('2026-11-09',{priority:'Original draft'}),'career-review-saved':saved};
 const edited:StudioState={[id]:{...draft('2026-11-09',{priority:'Edited draft'}),updatedAt:'2026-11-10T12:00:00Z'},'career-review-saved':changed};
 for(const [left,right] of [[original,edited],[edited,original]]){
  const merged=mergeStudio(left,right);
  assert.deepEqual(merged['career-review-saved'],saved);
  assert.deepEqual(merged[id],edited[id]);
  assert.deepEqual(merged['career-review-saved'].attempts,[]);
  assert.equal(validateProgress({...freshProgress(),studio:merged}).version,1);
 }
});
