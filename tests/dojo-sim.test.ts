import {test} from 'node:test';
import assert from 'node:assert/strict';
import {labForTrack,runFailureLab,normalizeLabInputs,readLabArray,failureRecord,type LabModel} from '../lib/dojo-sim';
const defaults=(model:LabModel)=>Object.fromEntries(model.controls.map(c=>[c.name,c.initial]));
function run(track:string,change:Record<string,string>={}){
  const model=labForTrack(track)!;
  return runFailureLab(model,{...defaults(model),...change});
}
test('imported experiment inputs are normalized before display or restore',()=>{
  const model=labForTrack('Architecture')!,input=defaults(model);
  assert.deepEqual(normalizeLabInputs(model,{...input,reflection:{unexpected:'object'},reviewed:'yes'}),input);
  for(const bad of [null,[],{...input,traffic:{}},{...input,traffic:'1'.repeat(241)}])assert.throws(()=>normalizeLabInputs(model,bad));
  assert.deepEqual(runFailureLab(model,{...input,extra:{not:'renderable'}}),runFailureLab(model,input));
});
test('all allowed control combinations yield finite bounded deterministic reports',()=>{
  for(const track of ['Architecture','GenAI','Database','API','Algorithms','LLD']){
    const model=labForTrack(track)!;
    let inputs:Record<string,string>[]=[{}];
    for(const control of model.controls)inputs=inputs.flatMap(i=>(control.choices||[control.initial,'[]','[1]','[3,3]']).map(value=>({...i,[control.name]:value})));
    for(const input of inputs){
      const result=runFailureLab(model,input);
      assert.deepEqual(runFailureLab(model,input),result);
      assert.ok(model.predictions.includes(result.outcome),track);
      assert.ok(result.trace.length>0&&result.trace.length<=67);
      assert.ok(Object.values(result.metrics).every(v=>typeof v==='string'||Number.isFinite(v)));
      assert.throws(()=>runFailureLab(model,{...input,[model.controls[0].name]:'__invalid'}));
    }
  }
  assert.equal(labForTrack('__proto__'),undefined);
});
test('cache load conserves requests across completed queued and shed',()=>{
  for(const policy of ['Forward all misses','Admit up to 200 misses']){
    const r=run('Architecture',{gate:policy});
    assert.equal(Number(r.metrics['Reads completed'])+Number(r.metrics.Queued)+Number(r.metrics.Shed),1000);
  }
  assert.equal(run('Architecture').outcome,'Requests queue');
  assert.equal(run('Architecture',{gate:'Admit up to 200 misses'}).outcome,'Requests are shed');
  assert.equal(run('Architecture',{hits:'90%'}).outcome,'All reads finish');
});
test('retrieval distinguishes stale content, missing evidence and private prompt exposure',()=>{
  assert.equal(run('GenAI').outcome,'Current answer with citation');
  assert.equal(run('GenAI',{index:'Current policy missing'}).outcome,'Abstain');
  assert.equal(run('GenAI',{rule:'Quote first passage'}).outcome,'Unsupported answer');
  assert.equal(run('GenAI',{scope:'All documents'}).outcome,'Private passage exposed');
});
test('historical invoices survive catalogue changes only with recorded facts',()=>{
  assert.equal(run('Database').outcome,'Invoice total changed');
  assert.equal(run('Database',{change:'Product is discontinued'}).outcome,'Invoice unavailable');
  assert.equal(run('Database',{change:'Product is discontinued',pricing:'Snapshot on order line'}).metrics['Reprint total (minor units)'],1000);
});
test('retry identity handles overlapping duplicates, conflicts and new commands',()=>{
  assert.equal(run('API').outcome,'Create O2');
  assert.equal(run('API',{identity:'Shared and atomic',timing:'While A is committing'}).outcome,'Return O1');
  assert.equal(run('API',{identity:'Shared and atomic',retry:'Same key, changed body'}).outcome,'Reject conflicting body');
  assert.equal(run('API',{identity:'Shared and atomic',retry:'New key, same body'}).outcome,'Create O2');
});
test('duplicate detector stops within budget and handles empty singleton and repeated data',()=>{
  assert.equal(run('Algorithms',{values:'[]',budget:'0'}).outcome,'All values distinct');
  assert.equal(run('Algorithms',{values:'[1]',budget:'0',strategy:'Compare pairs'}).outcome,'All values distinct');
  assert.equal(run('Algorithms',{values:'[1]',budget:'0',strategy:'Scan with a set'}).outcome,'Budget exhausted');
  assert.equal(run('Algorithms',{values:'[4,4]',budget:'1'}).outcome,'Duplicate found');
  assert.equal(run('Algorithms',{values:'[4,4]',strategy:'Scan with a set',budget:'1'}).outcome,'Budget exhausted');
  for(const raw of ['null','[1.5]','[9007199254740992]','[NaN]',JSON.stringify(Array(13).fill(1))])assert.throws(()=>readLabArray(raw));
  assert.deepEqual(readLabArray('[-1,0,1]'),[-1,0,1]);
});
test('reservation validity is checked at the exact deadline even before cleanup',()=>{
  assert.equal(run('LLD').outcome,'Expired hold sold');
  assert.equal(run('LLD',{guard:'Check Held state and deadline'}).outcome,'Payment refused');
  assert.equal(run('LLD',{payment:'At t=29',guard:'Check Held state and deadline'}).outcome,'Valid sale');
  assert.equal(run('LLD',{payment:'At t=29',cancel:'Cancel at t=15'}).outcome,'Payment refused');
  assert.equal(failureRecord('dojo-order-schema'),'dojo-order-schema-failure-lab');
});
