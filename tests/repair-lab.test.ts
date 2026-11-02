import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Worker} from 'node:worker_threads';
import {spawnSync} from 'node:child_process';
import {repairModules} from '../lib/repair-lab/modules';
import {repairDownload,repairGuide} from '../lib/repair-lab/export';
import {recallQuestions,recallRecordId,recallSelection,recallSummary,completedRecallDays,selectRecallSprint} from '../lib/repair-lab/recall';
import {instrument} from '../lib/playground/instrument';
import {validateModule} from '../lib/playground/schema';
import {validateRunResult} from '../lib/playground/runner';
import type {RunResult,Value} from '../lib/playground/types';
import {freshProgress,emptyDay,validateProgress} from '../lib/progress';
import {mergeStudio,type StudioRecord,type StudioState} from '../lib/studio-state';
import {dayAssignments} from '../lib/course';
import {parseWorkspacePath,workspaceStaticPaths,workspaceUrl} from '../lib/workspace-routes';

const runtime=readFileSync(new URL('../public/playground-worker.js',import.meta.url),'utf8');
function execute(code:string,args:Value[],expected:Value):Promise<RunResult>{
  const source=instrument(code);
  return new Promise((resolve,reject)=>{
    const worker=new Worker(`const {parentPort}=require('node:worker_threads');globalThis.self=globalThis;self.postMessage=x=>parentPort.postMessage(x);${runtime}\nparentPort.on('message',data=>self.onmessage({data}));`,{eval:true});
    const timer=setTimeout(()=>{void worker.terminate();reject(new Error('Worker timed out'))},15000);
    worker.once('message',value=>{clearTimeout(timer);void worker.terminate();try{resolve(validateRunResult(value))}catch(e){reject(e)}});
    worker.once('error',e=>{clearTimeout(timer);void worker.terminate();reject(e)});
    worker.postMessage({source,args,expected,test:true,limit:5000});
  });
}
// Test-only references; learners receive the unfinished starter, never these implementations.
const fixes:Record<string,string>={
  'cart-total':`function lineTotal(price, quantity) { return price * quantity; }
function solve(items) { let total = 0; for (let i = 0; i < items.length; i++) { total += lineTotal(items[i][0], items[i][1]); } return total; }`,
  'guest-list':`function solve(ids) { const seen = new Set(); const result = []; for (let i = 0; i < ids.length; i++) { if (!seen.has(ids[i])) { result.push(ids[i]); seen.add(ids[i]); } } return result; }`,
  'first-unique':`function solve(text) { const counts = new Map(); for (let i = 0; i < text.length; i++) { counts.set(text[i], (counts.get(text[i]) || 0) + 1); } for (let i = 0; i < text.length; i++) { if (counts.get(text[i]) === 1) return i; } return -1; }`,
  'sorted-pair':`function solve(weights, capacity) { let left = 0; let right = weights.length - 1; while (left < right) { const sum = weights[left] + weights[right]; if (sum === capacity) return [left, right]; if (sum < capacity) left++; else right--; } return []; }`,
  'sensor-window':`function solve(readings, k) { if (k < 1 || k > readings.length) return null; let sum = 0; let best = -Infinity; for (let right = 0; right < readings.length; right++) { sum += readings[right]; if (right >= k) sum -= readings[right-k]; if (right >= k-1 && sum > best) best = sum; } return best; }`,
  'range-report':`function solve(nums, queries) { const prefix = [0]; for (let i = 0; i < nums.length; i++) { prefix.push(prefix[i] + nums[i]); } const totals = []; for (let i = 0; i < queries.length; i++) { const left = queries[i][0]; const right = queries[i][1]; totals.push(prefix[right+1] - prefix[left]); } return totals; }`,
};
test('all six repair starters are runnable and demonstrably fail a supplied case',async()=>{
  assert.equal(repairModules.length,6);
  for(const m of repairModules){
    validateModule(m);
    let failures=0;
    for(const t of m.tests){
      const result=await execute(m.starterCode,t.args,t.expected);
      assert.equal(result.error,undefined,`${m.id}: starter should be runnable`);
      if(!result.passed)failures++;
    }
    assert.ok(failures>0,`${m.id} must require a repair`);
  }
});
test('test-only repairs pass actual worker comparisons and produce real traces',async()=>{
  for(const m of repairModules)for(const t of m.tests){
    const result=await execute(fixes[m.id],t.args,t.expected);
    assert.equal(result.error,undefined,`${m.id}: ${t.name}: ${result.error}`);
    assert.equal(result.passed,true,`${m.id}: ${t.name}`);
    assert.deepEqual(result.output,t.expected);
    assert.ok(result.trace.length>0);
  }
});
test('downloads execute in Node, fail for unfinished code and pass after repair',()=>{
  for(const m of repairModules){
    const starter=spawnSync(process.execPath,['--input-type=module'],{input:repairDownload(m),encoding:'utf8',timeout:5000});
    assert.equal(starter.status,1,`${m.id}: unfinished download must fail`);
    assert.match(starter.stdout,/FAIL/);
    const fixed=spawnSync(process.execPath,['--input-type=module'],{input:repairDownload(m,fixes[m.id]),encoding:'utf8',timeout:5000});
    assert.equal(fixed.status,0,`${m.id}: ${fixed.stderr}`);
    assert.match(fixed.stdout,new RegExp(`${m.tests.length}/${m.tests.length} supplied tests passed`));
    assert.ok(repairGuide(m).includes('does not create or fork'));
    assert.ok(repairDownload(m).includes(m.starterCode));
  }
});
test('22 unique recall decisions match every assigned DSA question in the first 20 days',()=>{
  const assigned=Array.from({length:20},(_,i)=>dayAssignments(i+1).dsa.map(q=>q.id)).flat();
  assert.equal(recallQuestions.length,22);
  assert.deepEqual(recallQuestions.map(q=>q.id).sort(),assigned.sort());
  assert.equal(new Set(recallQuestions.map(q=>q.prompt)).size,22);
  for(const q of recallQuestions){assert.ok(q.answer>=0&&q.answer<q.choices.length);assert.equal(new Set(q.choices).size,4);assert.ok(q.explanation&&q.dryRun&&q.transfer);}
});
test('completed-only revision uses actual completed day IDs and leaves course data unchanged',()=>{
  const p=freshProgress();
  p.days['2']={...emptyDay(),completedAt:'2026-10-02T12:00:00Z'};
  p.days['9']={...emptyDay(),completedAt:'2026-10-09T12:00:00Z'};
  p.days['3']={...emptyDay(),notes:'unfinished'};
  p.days['20']={...emptyDay(),completedAt:'2026-12-01T12:00:00Z'};
  p.days['21']={...emptyDay(),completedAt:'2026-10-21T12:00:00Z'};
  const before=JSON.stringify(p);
  assert.deepEqual(completedRecallDays(p,'2026-11-02'),[2,9]);
  assert.deepEqual(recallSelection(p,true,'2026-11-02').map(q=>q.day),[2,9,9]);
  assert.equal(recallSelection(p,false,'2026-11-02').length,22);
  assert.deepEqual(recallSelection(freshProgress(),true,'2026-11-02'),[]);
  assert.equal(JSON.stringify(p),before);
});
function answered(index:number,choice:number,at='2026-10-20T12:00:00Z'):StudioRecord{
  return {updatedAt:at,fields:{kind:'recall-choice',choice:String(choice)},attempts:[{id:`answer-${index}-${at}`,at,fields:{kind:'recall-choice',choice:String(choice)},outcome:choice===recallQuestions[index].answer?'Correct decision':'Review this decision',hints:0}]};
}
test('retries never inflate first-attempt accuracy and recovered drafts do not count as answers',()=>{
  const q=recallQuestions[0],r=answered(0,(q.answer+1)%4);
  r.attempts.unshift({...r.attempts[0],id:'draft',fields:{kind:'recall-choice',choice:String(q.answer)},outcome:'Recovered earlier draft'});
  r.attempts.push({...answered(0,q.answer,'2026-10-21T12:00:00Z').attempts[0]});
  const state={[recallRecordId(q.id)]:r};
  assert.deepEqual(recallSummary([q],state),{answered:1,firstCorrect:0,total:1});
  r.attempts.reverse();
  assert.deepEqual(recallSummary([q],state),{answered:1,firstCorrect:0,total:1});
});
test('five-question sprint prioritizes mistakes then unseen, stays in selected scope',()=>{
  const state:StudioState={};
  state[recallRecordId(recallQuestions[0].id)]=answered(0,recallQuestions[0].answer);
  state[recallRecordId(recallQuestions[4].id)]=answered(4,(recallQuestions[4].answer+1)%4);
  const sprint=selectRecallSprint(recallQuestions,state);
  assert.equal(sprint.length,5);
  assert.equal(sprint[0].id,recallQuestions[4].id);
  assert.equal(sprint[1].id,recallQuestions[1].id);
  assert.equal(new Set(sprint.map(q=>q.id)).size,5);
  assert.deepEqual(selectRecallSprint([],state),[]);
  assert.equal(selectRecallSprint([recallQuestions[0]],state).length,1);
});
test('new records use the existing progress validator and merge without erasing earlier attempts',()=>{
  const p=freshProgress(),q=recallQuestions[0],id=recallRecordId(q.id);
  const old={[id]:answered(0,0)},newer={[id]:answered(0,1,'2026-10-22T12:00:00Z')};
  p.studio=mergeStudio(old,newer);
  validateProgress(p);
  assert.equal(p.studio[id].attempts.length,2);
  assert.equal(Object.keys(p.days).length,0);
});
test('Repair & Recall has a direct static route without changing existing routes',()=>{
  assert.deepEqual(parseWorkspacePath('/repair-lab/'),{view:'repairLab'});
  assert.equal(workspaceUrl('repairLab'),'/repair-lab/');
  assert.ok(workspaceStaticPaths.some(parts=>parts.join('/')==='repair-lab'));
  assert.deepEqual(parseWorkspacePath('/practice/'),{view:'studio'});
  assert.deepEqual(parseWorkspacePath('/playground/'),{view:'playground'});
});
