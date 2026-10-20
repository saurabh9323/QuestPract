import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Worker} from 'node:worker_threads';
import {instrument} from '../lib/playground/instrument';
import {playgroundModules} from '../lib/playground/modules';
import {validateModule,validValue} from '../lib/playground/schema';
import {validateRunResult} from '../lib/playground/runner';
import {buildPlaygroundContext,CONTEXT_CAP,citationParts,attemptConfidence} from '../lib/playground/ai';
import {parseWorkspacePath,workspaceStaticPaths} from '../lib/workspace-routes';
import type {RunResult,Value} from '../lib/playground/types';

const runtime=readFileSync(new URL('../public/playground-worker.js',import.meta.url),'utf8');
function execute(code:string,args:Value[],limit=5000,expected?:Value):Promise<RunResult>{
  const source=instrument(code);
  return new Promise((resolve,reject)=>{
    const worker=new Worker(`const {parentPort}=require('node:worker_threads');globalThis.self=globalThis;self.postMessage=x=>parentPort.postMessage(x);${runtime}\nparentPort.on('message',data=>self.onmessage({data}));`,{eval:true});
    const timer=setTimeout(()=>{void worker.terminate();reject(new Error('Test worker timed out'))},15000);
    worker.once('message',value=>{clearTimeout(timer);void worker.terminate();try{resolve(validateRunResult(value))}catch(e){reject(e)}});
    worker.once('error',e=>{clearTimeout(timer);void worker.terminate();reject(e)});
    worker.postMessage({source,args,limit,test:expected!==undefined,expected});
  });
}
test('all five modules pass their real tests in the same worker runtime',async()=>{
  for(const module of playgroundModules){
    validateModule(module);
    for(const t of module.tests){
      const result=await execute(module.starterCode,t.args,5000,t.expected);
      assert.equal(result.error,undefined,`${module.id}: ${t.name}: ${result.error}`);
      assert.deepEqual(result.output,t.expected,`${module.id}: ${t.name}`);
      assert.equal(result.passed,true);
      assert.ok(result.trace.length>0);
      assert.ok(result.trace.every((e,i)=>e.step===i&&e.line>=1&&e.line<=module.starterCode.split('\n').length));
    }
  }
});
test('tracing preserves short circuit, postfix return, array writes and function returns',async()=>{
  const result=await execute(`function solve(a) {
    let i = 0;
    let old = i++;
    if (false && ++i) i++;
    a[i] = a[0] + old;
    return [old, i, a[1]];
  }`,[[9,2]]);
  assert.deepEqual(result.output,[0,1,9]);
  assert.ok(result.trace.some(e=>e.kind==='read'&&e.target==='a[0]'));
  assert.ok(result.trace.some(e=>e.kind==='write'&&e.target==='a[i]'&&(e.snapshot.a as Value[])[1]===9));
  const postfix=result.trace.find(e=>e.kind==='write'&&e.target==='i'&&e.value===0&&e.snapshot.i===1);
  assert.ok(postfix);
  assert.equal(result.trace.at(-1)?.kind,'return');
});
test('snapshots preserve lexical shadowing, loop pointers and earlier states',async()=>{
  const result=await execute(`function solve(a) {
    let i = 9;
    for (let i = 0; i < a.length; i++) { a[i] = i; }
    return i;
  }`,[[4,5]]);
  assert.equal(result.output,9);
  assert.ok(result.trace.some(e=>e.snapshot.i===0));
  assert.deepEqual(result.trace.find(e=>e.target==='a[i]')?.snapshot.a,[0,5]);
  assert.deepEqual(result.trace.at(-1)?.snapshot.a,[0,1]);
});
test('recursion uses separate frames and balances return scopes',async()=>{
  const result=await execute('function solve(n) { if (n <= 1) return 1; return n * solve(n - 1); }',[4]);
  assert.equal(result.output,24);
  assert.equal(new Set(result.trace.map(e=>e.frame)).size,4);
  assert.equal(result.trace.at(-1)?.snapshot.n,4);
});
test('infinite loops and excessive recursion stop with partial traces',async()=>{
  const result=await execute('function solve() { while (true) {} }',[],25);
  assert.equal(result.trace.length,25);
  assert.match(result.error!,/Step cap/);
  const recursion=await execute('function solve() { return solve(); }',[]);
  assert.match(recursion.error!,/Recursion depth/);
});
test('bad code, unsupported syntax and reflective access fail clearly',async()=>{
  for(const code of ['function solve( {','function solve(){ return ()=>1; }','async function solve(){return 1}','function solve(){fetch("https://example.com")}','function solve(){let __get=2;}']){
    assert.throws(()=>instrument(code));
  }
  const access=await execute('function solve(a){return a["constructor"]}',[[]]);
  assert.match(access.error!,/Prototype/);
  const outOfRange=await execute('function solve(a){a[10000]=1;return a}',[[]]);
  assert.match(outOfRange.error!,/Array writes/);
});
test('a wrong implementation fails actual test comparison',async()=>{
  const result=await execute('function solve(){ return []; }',[[2,7],9],5000,[0,1]);
  assert.notDeepEqual(result.output,[0,1]);
  assert.equal(result.passed,false);
  // Snapshot display markers must never make a wrong output pass a test.
  assert.equal((await execute('function solve(){ return undefined; }',[],5000,'[undefined]')).passed,false);
  assert.equal((await execute('function solve(){ return Infinity; }',[],5000,'Infinity')).passed,false);
});
test('module schema rejects malformed inputs, tests and unknown renderers',()=>{
  const module=playgroundModules[0];
  for(const mutation of [{tests:[]},{inputs:[Infinity]},{renderers:['tree']},{starterCode:''},{hints:['one']},{id:'../bad'}]){
    assert.throws(()=>validateModule({...module,...mutation}));
  }
  assert.equal(validValue(Array(129).fill(1)),false);
  assert.equal(validValue(JSON.parse('{"__proto__":1}')),false);
});
test('AI context is bounded, identifies trimming and contains only nearby steps',()=>{
  const trace=Array.from({length:100},(_,step)=>({step,line:2,kind:'write' as const,target:'i',value:step,snapshot:{i:step},frame:1}));
  const normal=buildPlaygroundContext({moduleId:'two-pointers',code:'function solve(){}',trace,step:50,tests:[]});
  assert.deepEqual(normal.steps,Array.from({length:11},(_,i)=>45+i));
  assert.equal(normal.trimmed,false);
  const huge=buildPlaygroundContext({moduleId:'x',code:'"\\\n'.repeat(10000),trace,step:50,pinned:'\\'.repeat(2000),tests:[{name:'x'.repeat(2000),passed:false,actual:null,expected:null}]});
  assert.ok(huge.text.length<=CONTEXT_CAP,`actual size ${huge.text.length}`);
  assert.equal(huge.trimmed,true);
  assert.ok(huge.steps.includes(50));
  assert.equal(JSON.parse(huge.text).contextTrimmed,true);
});
test('AI citations never link nonexistent or unsent steps',()=>{
  const parts=citationParts('At [step 5], then [step 99], then [step 4].',[4,5]);
  assert.deepEqual(parts.filter(p=>p.step!==undefined).map(p=>p.valid),[true,false,true]);
  assert.equal(attemptConfidence(0), 'independent');
  assert.equal(attemptConfidence(0,true), 'assisted');
  assert.equal(attemptConfidence(2), 'assisted');
  assert.equal(attemptConfidence(4), 'learning');
});
test('playground is a static-export route without replacing existing paths',()=>{
  assert.deepEqual(parseWorkspacePath('/playground/'),{view:'playground'});
  assert.ok(workspaceStaticPaths.some(path=>path.join('/')==='playground'));
  assert.deepEqual(parseWorkspacePath('/commute/'),{view:'commute'});
});

