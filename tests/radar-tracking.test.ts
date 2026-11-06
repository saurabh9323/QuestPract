import {test} from 'node:test';
import assert from 'node:assert/strict';
import {radarRecordId,readRadarTracking,radarTrackingFields,acknowledgeRadarTracking,ensureRadarCapacity} from '../lib/radar/tracking';
import {validateProgress,exportBackup,type Progress} from '../lib/progress';
import {mergeStudio,type StudioState} from '../lib/studio-state';
const namespace='https://radar.example.test/v1',id='devpost/project-1',at='2026-11-06T09:00:00.000Z';
const draft=()=>radarTrackingFields({},namespace,id,{status:'interested',notes:'Build a map'},'revision-1',true);
const progress=(studio:StudioState):Progress=>({version:1,startDate:'2026-11-06',days:{},todos:[],updatedAt:at,studio});

test('tracking persists inside the existing version-1 export/import envelope',()=>{
  const key=radarRecordId(namespace,id),fields=radarTrackingFields(draft(),namespace,id,{checked:['register-team','scope-mvp']},'revision-1');
  const p=progress({[key]:{fields,attempts:[],updatedAt:at}});
  validateProgress(p);
  const imported=validateProgress(JSON.parse(JSON.stringify(exportBackup(p))).progress);
  assert.equal(imported.version,1);
  assert.deepEqual(imported,p);
  assert.deepEqual(readRadarTracking(imported.studio![key].fields,namespace,id),{
    id,namespace,status:'interested',notes:'Build a map',checked:['register-team','scope-mvp'],revision:'revision-1',pending:true,
  });
  assert.doesNotThrow(()=>validateProgress({...p,studio:undefined}));
});
test('stable bounded keys isolate mock and API progress even for arbitrary IDs',()=>{
  assert.equal(radarRecordId(namespace,id),radarRecordId(namespace,id));
  assert.notEqual(radarRecordId('mock',id),radarRecordId(namespace,id));
  for(const externalId of ['__proto__','constructor','a/b?c=1#2','题'.repeat(160)]){
    const key=radarRecordId(namespace,externalId);
    assert.match(key,/^[a-z0-9-]{1,120}$/);
    assert.equal(readRadarTracking(radarTrackingFields({},namespace,externalId,{},'r'),namespace,externalId)?.id,externalId);
  }
});
test('late PATCH responses cannot overwrite a newer local edit',()=>{
  const first=draft(),second=radarTrackingFields(first,namespace,id,{notes:'Newer idea'},'revision-2',true);
  assert.equal(acknowledgeRadarTracking(second,namespace,id,'revision-1',{status:'registered',notes:'Old idea'}),null);
  const acknowledged=acknowledgeRadarTracking(second,namespace,id,'revision-2',{status:'interested'})!;
  assert.equal(readRadarTracking(acknowledged,namespace,id)?.notes,'Newer idea');
  assert.equal(readRadarTracking(acknowledged,namespace,id)?.pending,false);
  assert.equal(second.pending,'yes');
});
test('local checklist edits preserve pending revision and survive acknowledgement',()=>{
  const updated=radarTrackingFields(draft(),namespace,id,{checked:['readme']},'revision-1');
  const acknowledged=acknowledgeRadarTracking(updated,namespace,id,'revision-1',{status:'interested',notes:'Build a map'})!;
  assert.equal(acknowledged.checked,'["readme"]');
  assert.equal(acknowledged.pending,'no');
  const local=radarTrackingFields(acknowledged,namespace,id,{checked:['readme','demo-video']},'revision-1');
  assert.equal(local.pending,'no');
});
test('bad or mismatched saved records fail safely rather than being replaced',()=>{
  assert.equal(readRadarTracking({},namespace,id),null);
  for(const change of [{schemaVersion:'2'},{opportunityId:'someone-else'},{status:'winner'},{notes:'x'.repeat(1001)},{checked:'null'},{checked:'["unknown"]'},{checked:'["readme","readme"]'},{pending:'maybe'},{revision:''}]){
    assert.throws(()=>readRadarTracking({...draft(),...change},namespace,id));
  }
  assert.throws(()=>radarTrackingFields({},namespace,id,{notes:'x'.repeat(1001)},'r'));
  assert.throws(()=>acknowledgeRadarTracking(draft(),namespace,id,'revision-1',{status:'new',notes:'x'.repeat(1001)}));
  assert.throws(()=>radarRecordId(namespace,''));
});
test('existing Studio merge keeps different opportunities and recovers old tracking drafts',()=>{
  const key=radarRecordId(namespace,id),other=radarRecordId(namespace,'other');
  const a:StudioState={[key]:{fields:draft(),attempts:[],updatedAt:at}};
  const b:StudioState={
    [key]:{fields:radarTrackingFields(draft(),namespace,id,{status:'building'},'r2',true),attempts:[],updatedAt:'2026-11-06T10:00:00.000Z'},
    [other]:{fields:radarTrackingFields({},namespace,'other',{status:'registered'},'r3',false),attempts:[],updatedAt:at},
  };
  const merged=mergeStudio(a,b);
  assert.equal(readRadarTracking(merged[key].fields,namespace,id)?.status,'building');
  assert.equal(merged[key].attempts[0].fields.status,'interested');
  assert.ok(merged[other]);
  assert.doesNotThrow(()=>validateProgress(progress(merged)));
});
test('Radar respects its record cap while allowing edits of existing records',()=>{
  const full:StudioState={};
  for(let i=0;i<100;i++)full[radarRecordId(namespace,String(i))]={fields:radarTrackingFields({},namespace,String(i),{},'r'),attempts:[],updatedAt:at};
  assert.doesNotThrow(()=>ensureRadarCapacity(full,radarRecordId(namespace,'0')));
  assert.throws(()=>ensureRadarCapacity(full,radarRecordId(namespace,'new')));
  const overflow={...progress(full),studio:{...full,bad:{fields:{text:'x'.repeat(40001)},attempts:[],updatedAt:at}}};
  assert.throws(()=>validateProgress(overflow));
});
