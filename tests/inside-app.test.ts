import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Worker} from 'node:worker_threads';
import {createRequire} from 'node:module';
import {bookingScenarios,concepts} from '../lib/inside-app/catalog';
import {defaultBookingOptions,type BookingResult,type BookingOptions,type ScenarioId} from '../lib/inside-app/types';
import {bookingSummary,bookingReport,insideProgress,insideRecord} from '../lib/inside-app/progress';
import {freshProgress,validateProgress} from '../lib/progress';
import {mergeStudio,type StudioState} from '../lib/studio-state';
import {parseWorkspacePath,workspaceStaticPaths} from '../lib/workspace-routes';

const require=createRequire(import.meta.url),engine=require.resolve('sql.js'),wasm=require.resolve('sql.js/dist/sql-wasm.wasm');
const runtime=readFileSync(new URL('../public/inside-app-worker.js',import.meta.url),'utf8');
function run(scenario:ScenarioId|string,options:BookingOptions=defaultBookingOptions):Promise<BookingResult>{
  return new Promise((resolve,reject)=>{
    const worker=new Worker(`const {parentPort}=require('node:worker_threads');global.self=global;global.importScripts=()=>{};global.initSqlJs=()=>require(${JSON.stringify(engine)})({locateFile:()=>${JSON.stringify(wasm)}});self.postMessage=x=>parentPort.postMessage(x);${runtime};parentPort.on('message',data=>self.onmessage({data}));`,{eval:true});
    const timer=setTimeout(()=>{void worker.terminate();reject(new Error('Worker timeout'))},10000);
    worker.once('message',data=>{clearTimeout(timer);void worker.terminate();data.error?reject(new Error(data.error)):resolve(data)});
    worker.once('error',error=>{clearTimeout(timer);void worker.terminate();reject(error)});
    worker.postMessage({scenario,options});
  });
}
test('seven scenarios execute real SQLite and produce the expected protected outcomes',async()=>{
  const expected:Record<ScenarioId,number>={normal:1,'double-click':1,competing:1,'lost-response':1,offline:0,'stale-cache':1,'expired-session':0};
  for(const scenario of bookingScenarios){
    const result=await run(scenario.id);
    assert.equal(result.final.tables.bookings.rows.length,expected[scenario.id],scenario.id);
    assert.ok(result.checks.every(c=>c.passed),scenario.id);
    assert.ok(result.steps.length>2&&result.steps.length<=120);
    assert.equal(result.steps[0].before.tables.bookings.rows.length,scenario.id==='stale-cache'?1:0);
    assert.deepEqual(result.final,result.steps.at(-1)!.after);
    result.steps.forEach((step,index)=>{
      assert.equal(step.step,index+1);assert.ok(concepts[step.concept],step.concept);
      if(index)assert.deepEqual(step.before,result.steps[index-1].after,`Snapshot continuity: ${scenario.id} step ${step.step}`);
    });
    assert.equal(result.final.counters.sql,result.steps.filter(s=>s.sql).length,'Every counted SQL statement has a trace step');
  }
});
test('two stale preflight reads can overbook even though both writes use transactions',async()=>{
  const result=await run('competing',{atomic:false,unique:false,idempotency:true});
  assert.deepEqual(result.final.tables.bookings.rows,[[1,'A7','Asha'],[2,'A7','Ravi']]);
  assert.equal(result.checks[0].passed,false);
  const reads=result.steps.filter(s=>s.title.includes('preflight read'));
  assert.equal(reads.length,2);assert.ok(reads.every(s=>s.after.tables.bookings.rows.length===0));
  assert.equal(result.final.counters.commits,2);
  assert.equal(result.final.requests[1].http,201);
});
test('unique constraint rejects the second actual insert and rolls its transaction back',async()=>{
  const result=await run('competing',{atomic:false,unique:true,idempotency:true});
  assert.deepEqual(result.final.tables.bookings.rows,[[1,'A7','Asha']]);
  assert.equal(result.final.counters.commits,1);assert.equal(result.final.counters.rollbacks,1);
  assert.ok(result.steps.some(s=>s.detail.includes('UNIQUE constraint failed: bookings.seat_id')));
  assert.deepEqual(result.final.tables.request_keys.rows,[['Asha','intent-asha-a7','A7',1]]);
  assert.equal(result.final.requests[1].http,409);
});
test('conditional reservation also protects the seat without a unique index',async()=>{
  const result=await run('competing',{atomic:true,unique:false,idempotency:false});
  assert.equal(result.final.tables.bookings.rows.length,1);
  assert.ok(result.steps.some(s=>s.title==='0 seat row changed'));
  assert.equal(result.final.requests[1].http,409);
});
test('all protection combinations keep stable, bounded traces and honest invariants',async()=>{
  for(const atomic of [false,true])for(const unique of [false,true])for(const idempotency of [false,true]){
    const result=await run('competing',{atomic,unique,idempotency});
    assert.equal(result.final.tables.bookings.rows.length,atomic||unique?1:2);
    assert.equal(result.checks[0].passed,atomic||unique);
    assert.ok(result.steps.length<=120);
  }
});
test('same-intention repeat requests replay the real booking ID rather than inserting again',async()=>{
  const result=await run('double-click');
  assert.deepEqual(result.final.requests.map(r=>[r.http,r.bookingId,r.status]),[[201,1,'confirmed'],[200,1,'replayed']]);
  assert.equal(result.steps.filter(s=>s.sql?.startsWith('INSERT INTO bookings')).length,1);
  const without=await run('double-click',{...defaultBookingOptions,idempotency:false});
  assert.deepEqual(without.final.requests.map(r=>r.http),[201,409]);
  assert.equal(without.final.tables.bookings.rows.length,1);
});
test('lost reply preserves the committed row and retry recovers the original ID',async()=>{
  const result=await run('lost-response');
  const lost=result.steps.find(s=>s.title==='The committed response is lost')!;
  assert.equal(lost.after.tables.bookings.rows.length,1);
  assert.equal(lost.after.counters.commits,1);
  assert.equal(lost.after.requests[0].http,null);
  assert.equal(result.final.requests[1].http,200);
  assert.equal(result.final.ui.bookingId,1);
  assert.equal(result.final.ui.status,'confirmed');
  const without=await run('lost-response',{...defaultBookingOptions,idempotency:false});
  assert.equal(without.final.tables.bookings.rows.length,1);assert.equal(without.final.requests[1].http,409);
});
test('offline and expired identity cannot run booking SQL; stale cache cannot override rows',async()=>{
  const offline=await run('offline'),expired=await run('expired-session'),stale=await run('stale-cache');
  assert.equal(offline.final.counters.requests,0);assert.equal(offline.final.counters.sql,0);
  assert.equal(expired.final.counters.sql,0);assert.equal(expired.final.requests[0].http,401);
  assert.equal(stale.steps[0].after.cache,'available');
  assert.deepEqual(stale.steps[0].after.tables.bookings.rows,[[1,'A7','Ravi']]);
  assert.deepEqual(stale.final.tables.bookings.rows,[[1,'A7','Ravi']]);
  assert.equal(stale.final.cache,'booked');assert.equal(stale.final.requests[0].http,409);
});
test('database resets between runs and malformed scenario controls are rejected',async()=>{
  await run('competing',{atomic:false,unique:false,idempotency:false});
  assert.deepEqual((await run('normal')).final.tables.bookings.rows,[[1,'A7','Asha']]);
  await assert.rejects(()=>run('not-a-scenario'),/Invalid/);
  await assert.rejects(()=>run('normal',{atomic:'yes',unique:true,idempotency:true} as unknown as BookingOptions),/Invalid/);
});
test('bounded saved evidence merges through existing progress without completing course days',async()=>{
  const result=await run('normal'),id=insideRecord('normal'),at='2026-11-02T08:00:00Z';
  const fields={type:'inside-app',runSummary:bookingSummary(result),runPrediction:'1',investigated:'4:data',explanation:'Step 12 commits the booking before a confirmation.'};
  const studio:StudioState={[id]:{fields,updatedAt:at,attempts:[{id:'attempt-1',at,fields,outcome:'Inside a Real App · reflected',hints:0}]}};
  const recovered:StudioState={[id]:{fields,updatedAt:at,attempts:[{id:'draft-1',at,fields,outcome:'Recovered earlier draft',hints:0}]}};
  const progress={...freshProgress(),studio:mergeStudio(studio,recovered)};
  validateProgress(progress);assert.deepEqual(progress.days,{});
  assert.deepEqual(insideProgress(progress.studio),{scenarios:1,attempts:1,predictions:1,investigations:1,explanations:1});
  assert.ok(fields.runSummary.length<40000);
  const report=bookingReport(result,'1','My evidence');assert.ok(report.includes('Real SQLite'));assert.ok(report.includes('My evidence'));assert.ok(report.includes('INSERT INTO bookings'));
});
test('Inside a Real App has a static route and retains the existing practice routes',()=>{
  assert.deepEqual(parseWorkspacePath('/inside-app/'),{view:'insideApp'});
  assert.ok(workspaceStaticPaths.some(p=>p.join('/')==='inside-app'));
  assert.deepEqual(parseWorkspacePath('/practice/'),{view:'studio'});
  assert.deepEqual(parseWorkspacePath('/repair-lab/'),{view:'repairLab'});
  assert.deepEqual(parseWorkspacePath('/sql-game/'),{view:'sqlGame'});
});
