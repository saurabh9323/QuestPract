'use client';
import {useEffect,useRef,useState} from 'react';
import {useRouteQuery,updateRouteQuery} from '@/lib/workspace-location';
import {useStudio} from '@/components/studio/StudioContext';
import {playgroundModules} from '@/lib/playground/modules';
import {validateModule,validValue} from '@/lib/playground/schema';
import {runModule} from '@/lib/playground/runner';
import {attemptConfidence} from '@/lib/playground/ai';
import type {LabModule,LabRun} from '@/lib/playground/types';
import TracePlayer from './TracePlayer';
import PlaygroundAI from './PlaygroundAI';
import LearningDataPanel from '../learning/LearningDataPanel';

export default function ModulePlayground(){
  const params=useRouteQuery();
  const id=playgroundModules.find(m=>m.id===params.get('module'))?.id||playgroundModules[0].id;
  return <section className="module-playground">
    <div className="pg-heading"><span className="pg-badge">MODULE PLAYGROUND · PHASE 1</span><h2>Edit it. Run it. See each step.</h2><p>Real JavaScript execution in an isolated worker. Five small DSA labs, one trace player.</p></div>
    <a className="primary" href="/flows/">Build my own flowchart or system design →</a> <a className="secondary" href="/sql-game/">Play SQL Expedition →</a>
    <label className="pg-module-select">Choose a module<select value={id} onChange={e=>updateRouteQuery({module:e.target.value})}>{playgroundModules.map(m=><option key={m.id} value={m.id}>{m.title}</option>)}</select></label>
    <Lab key={id} module={validateModule(playgroundModules.find(m=>m.id===id)!)}/>
    <LearningDataPanel/>
  </section>;
}
function Lab({module}:{module:LabModule}){
  const studio=useStudio(),{get,patch,submit}=studio,id=`playground-${module.id}`,record=get(id);
  const [code,setCode]=useState(record.fields.code??module.starterCode),[inputs,setInputs]=useState(record.fields.inputs??JSON.stringify(module.inputs));
  const [run,setRun]=useState<LabRun|null>(null),[runCode,setRunCode]=useState(''),[runInputs,setRunInputs]=useState(''),[runId,setRunId]=useState('');
  const [step,setStep]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(false);
  const controller=useRef<AbortController|null>(null),latest=useRef(studio);latest.current=studio;
  const draft=useRef({code,inputs});draft.current={code,inputs};
  const hintLevel=Number(record.fields.hintLevel||0),explained=record.fields.explained==='yes';
  useEffect(()=>{
    const timer=setTimeout(()=>{const api=latest.current;if(api.get(id).fields.code!==code||api.get(id).fields.inputs!==inputs)api.patch(id,{code,inputs})},600);
    return()=>clearTimeout(timer);
  },[code,inputs,id]);
  useEffect(()=>{
    let last=Date.now(),lastActivity=Date.now();
    const activity=()=>{lastActivity=Date.now()};
    window.addEventListener('pointerdown',activity);
    window.addEventListener('keydown',activity);
    window.addEventListener('scroll',activity,{passive:true});
    const timer=setInterval(()=>{
      const now=Date.now(),seconds=Math.min(10,Math.round((now-last)/1000));last=now;
      if(document.visibilityState!=='visible'||!document.hasFocus()||now-lastActivity>60000)return;
      const api=latest.current;api.patch(id,{timeSeconds:String(Number(api.get(id).fields.timeSeconds||0)+seconds)});
    },10000);
    return()=>{
      clearInterval(timer);controller.current?.abort();
      window.removeEventListener('pointerdown',activity);
      window.removeEventListener('keydown',activity);
      window.removeEventListener('scroll',activity);
      const api=latest.current,current=api.get(id).fields;
      if(current.code!==draft.current.code||current.inputs!==draft.current.inputs)api.patch(id,draft.current);
    };
  },[id]);
  async function execute(){
    if(busy)return;
    setBusy(true);setError('');setRun(null);setSaved(false);
    const abort=new AbortController();controller.current=abort;
    try{
      const args:unknown=JSON.parse(inputs);
      if(!Array.isArray(args)||args.length>8||!validValue(args))throw new Error('Provide a JSON array of arguments, up to 128 items per collection.');
      const result=await runModule(code,args,module,abort.signal);
      if(abort.signal.aborted)return;
      setRun(result);setRunCode(code);setRunInputs(inputs);setRunId(crypto.randomUUID());setStep(0);
      patch(id,{code,inputs,runCount:String(Number(get(id).fields.runCount||0)+1)});
    }catch(e){if(!abort.signal.aborted)setError(e instanceof Error?e.message:'Could not run code.')}
    finally{if(!abort.signal.aborted)setBusy(false)}
  }
  function help(level:number){patch(id,{hintLevel:String(Math.max(hintLevel,level)),explained:'yes'});setSaved(false)}
  function saveAttempt(){
    if(!run||saved)return;
    const passed=run.tests.length===module.tests.length&&run.tests.every(t=>t.passed),confidence=attemptConfidence(hintLevel,explained);
    patch(id,{code:runCode,inputs:runInputs,tests:JSON.stringify(run.tests),traceSteps:String(run.trace.length),executionError:run.error||'',confidence,hintLevel:String(hintLevel),lastRun:runId,...(passed?{completedAt:record.fields.completedAt||new Date().toISOString()}:{})});
    if(submit(id,`${passed?'All supplied tests passed':'Tests need work'} · ${confidence}`,hintLevel))setSaved(true);
  }
  const stale=!!run&&(code!==runCode||inputs!==runInputs);
  return <>
    <section className="pg-brief"><h3>{module.title}</h3><p>{module.goal}</p><small>Pattern to explore: {module.expectedPattern}. Passing these tests is evidence for these cases, not proof of correctness.</small></section>
    <details className="pg-limits"><summary>JavaScript execution limits & supported syntax</summary>
      <p>Define synchronous function solve(...). Supports variables, numeric/string/array expressions, if, for, while, break, named function calls, return, Map/Set, and selected collection/Math methods. Async, callbacks, classes, imports, destructuring, continue, and object literals are rejected in Phase 1.</p>
      <p>Maximum 10,000 code characters, 128 entries per collection, 5,000 recorded events, 100 nested calls, 4 MB trace budget and 3 seconds per worker. Snapshots are bounded. Array writes are separate events; a swap appears as its individual writes. Callbacks and platform internals are not traced. No network or application storage access is provided.</p>
      <p>Other languages are not executed. Phase 2–5 simulators and complexity estimates are not included yet.</p>
    </details>
    <div className="pg-edit-grid">
      <label>JavaScript editor<textarea className="pg-editor" spellCheck={false} maxLength={10000} value={code} onChange={e=>setCode(e.target.value)} aria-describedby="pg-code-help"/></label>
      <div><label>Arguments · JSON<textarea value={inputs} maxLength={5000} rows={5} onChange={e=>setInputs(e.target.value)}/></label><p id="pg-code-help">Example: {JSON.stringify(module.inputs)}. Run executes the edited code, then checks every module test with fresh inputs.</p><button onClick={()=>{setCode(module.starterCode);setInputs(JSON.stringify(module.inputs));setRun(null);setRunId('');patch(id,{hintLevel:'0',explained:'no'});setSaved(false)}} disabled={busy}>Reset to starter</button><small>Starter code is a worked example. “Independent” means no hints recorded; it does not claim unaided authorship.</small></div>
    </div>
    <div className="pg-toolbar"><button className="primary" onClick={execute} disabled={busy}>{busy?'Running trace & tests…':'Run JavaScript'}</button>{busy&&<button onClick={()=>{controller.current?.abort();setBusy(false);setError('Run cancelled.')}}>Cancel</button>}<span>{record.attempts.length} saved attempts · {Math.floor(Number(record.fields.timeSeconds||0)/60)} min active here</span></div>
    {error&&<p className="pg-error" role="alert">{error}</p>}
    {run&&<><div className="pg-result"><strong>{run.tests.filter(t=>t.passed).length}/{run.tests.length} tests passed · {run.trace.length} recorded events</strong><p>Selected input returned: <code>{JSON.stringify(run.output)}</code></p>{run.error&&<p role="alert">Selected input: {run.error} The player shows the partial trace.</p>}{stale&&<p>Code or input changed. The trace below belongs to the previous run; run again before saving.</p>}</div>
      <TracePlayer key={runId} trace={run.trace} code={runCode} step={step} onStep={setStep}/>
      <section className="pg-tests"><h3>Actual test results</h3>{run.tests.map(t=><details key={t.name}><summary>{t.passed?'PASS':'FAIL'} · {t.name}</summary><p>Expected: <code>{JSON.stringify(t.expected)}</code></p><p>Actual: <code>{JSON.stringify(t.actual)}</code></p>{t.error&&<p>{t.error}</p>}</details>)}</section>
      <button onClick={saveAttempt} disabled={saved||stale}>{saved?'Attempt saved':'Save this attempt'}</button><small>Support used: {attemptConfidence(hintLevel,explained)} · highest hint {hintLevel}/4. Completion counts only saved runs passing every supplied test.</small>
    </>}
    <details><summary>Offline hints · no AI needed</summary>{module.hints.map((hint,i)=><div key={hint}><button onClick={()=>help(i+1)}>Reveal hint {i+1}</button>{hintLevel>=i+1&&<p>{hint}</p>}</div>)}</details>
    <PlaygroundAI module={module} run={run} code={run?runCode:code} step={step} runId={runId} onStep={setStep} onHelp={help}/>
    <label>My notes<textarea value={record.fields.notes||''} maxLength={5000} rows={4} onChange={e=>patch(id,{notes:e.target.value})}/></label>
    <details><summary>Saved attempt history</summary>{[...record.attempts].reverse().map(a=><article key={a.id}><strong>{a.outcome}</strong><p>{new Date(a.at).toLocaleString()} · hint level {a.hints} · {a.fields.traceSteps||0} events</p><details><summary>Code and results from this attempt</summary><pre>{a.fields.code}</pre><pre>{a.fields.tests}</pre></details></article>)}</details>
  </>;
}
