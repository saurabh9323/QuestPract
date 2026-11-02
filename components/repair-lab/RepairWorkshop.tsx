'use client';
import {useEffect,useRef,useState} from 'react';
import {useStudio,saveFile,copyText,Attempts} from '../studio/StudioContext';
import {repairDownload,repairGuide} from '@/lib/repair-lab/export';
import type {RepairModule} from '@/lib/repair-lab/modules';
import {runModule} from '@/lib/playground/runner';
import {attemptConfidence} from '@/lib/playground/ai';
import type {LabRun} from '@/lib/playground/types';
import TracePlayer from '../playground/TracePlayer';

export default function RepairWorkshop({module}:{module:RepairModule}){
  const api=useStudio(),id=`repair-code-${module.id}`,record=api.get(id);
  const [code,setCode]=useState(record.fields.code??module.starterCode);
  const [result,setResult]=useState<{run:LabRun;code:string}|null>(null);
  const [baseline,setBaseline]=useState<LabRun|null>(null);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[step,setStep]=useState(0);
  const [saved,setSaved]=useState(false),[reset,setReset]=useState(false);
  const controller=useRef<AbortController|null>(null),latest=useRef(api),draft=useRef(code);
  latest.current=api;draft.current=code;
  const hints=Number(record.fields.hints||0);
  useEffect(()=>{
    const timer=setTimeout(()=>{if(latest.current.get(id).fields.code!==code)latest.current.patch(id,{code})},500);
    return()=>clearTimeout(timer);
  },[code,id]);
  useEffect(()=>()=>{
    controller.current?.abort();
    if(latest.current.get(id).fields.code!==draft.current)latest.current.patch(id,{code:draft.current});
  },[id]);
  async function run(){
    if(busy)return;
    const abort=new AbortController();controller.current=abort;
    setBusy(true);setError('');setResult(null);setSaved(false);
    api.patch(id,{code});
    try{
      const run=await runModule(code,module.inputs,module,abort.signal);
      if(!abort.signal.aborted){setResult({run,code});if(code===module.starterCode)setBaseline(run);setStep(0);}
    }catch(e){if(!abort.signal.aborted)setError(e instanceof Error?e.message:'Unable to run the tests.');}
    finally{if(!abort.signal.aborted)setBusy(false);}
  }
  async function compareStarter(){
    if(busy)return;
    const abort=new AbortController();controller.current=abort;
    setBusy(true);setError('');
    try{const run=await runModule(module.starterCode,module.inputs,module,abort.signal);if(!abort.signal.aborted)setBaseline(run);}
    catch(e){if(!abort.signal.aborted)setError(e instanceof Error?e.message:'Could not compare the starter.');}
    finally{if(!abort.signal.aborted)setBusy(false);}
  }
  function saveAttempt(){
    if(!result||result.code!==code||saved)return;
    const passed=!result.run.error&&result.run.tests.length===module.tests.length&&result.run.tests.every(t=>t.passed);
    api.patch(id,{code:result.code,kind:'repair-run',tests:JSON.stringify(result.run.tests),traceSteps:String(result.run.trace.length),confidence:attemptConfidence(hints),hints:String(hints),...(passed?{passedAt:new Date().toISOString()}:{} )});
    if(api.submit(id,`${passed?'Supplied tests passed':'Repair in progress'} · ${attemptConfidence(hints)}`,hints))setSaved(true);
  }
  const stale=!!result&&result.code!==code;
  return <div className="repair-workshop module-playground">
    <section className="repair-panel repair-brief">
      <span className="repair-kicker">REPAIR BRIEF · DAY {module.day} FOUNDATION</span><h2>{module.title}</h2><p>{module.scenario}</p>
      <div className="repair-contract"><strong>The contract</strong><p>{module.goal}</p></div>
      <ol>{module.tasks.map(t=><li key={t}>{t}</li>)}</ol>
      <p><strong>Optimization challenge:</strong> {module.optimization}</p>
      <div className="repair-journey" aria-label="Suggested workflow"><span>01 Predict failure</span><span>02 Repair</span><span>03 Run tests</span><span>04 Explain the improvement</span></div>
    </section>
    <section className="repair-panel">
      <div className="repair-section-top"><div><span className="repair-kicker">YOUR WORKSPACE</span><h3>Start here. Finish it your way.</h3></div><span className="repair-chip">JavaScript · isolated worker</span></div>
      <p>The starter is intentionally unfinished or wrong. Run it first to see which supplied cases fail.</p>
      <div className="repair-actions">
        <button className="secondary" onClick={()=>saveFile(`${module.id}-starter.mjs`,repairDownload(module),'text/javascript')}>Download starter + tests</button>
        <button className="secondary" onClick={()=>saveFile(`${module.id}.mjs`,repairDownload(module,code),'text/javascript')}>Download my version</button>
        <button className="secondary" onClick={()=>copyText(code,api.notice)}>Copy functions</button>
        <button className="secondary" onClick={()=>saveFile(`${module.id}-README.md`,repairGuide(module))}>Download instructions</button>
      </div>
      <details><summary>Use a local editor, an online compiler or your own repository</summary><p>Downloads contain functions and Node.js tests. Rename the starter to <code>{module.id}.mjs</code> and run <code>node {module.id}.mjs</code>. A Node.js online editor must support ES modules and <code>node:util</code>. Save the file in your own repository if you want to version or fork it later; this button does not create a GitHub fork.</p><p>Return here and paste only your function declarations to trace them. Local execution has no portal timeout; use Ctrl+C to stop a loop.</p></details>
      <label className="repair-field">Before running: where do you expect it to fail?<textarea rows={2} maxLength={3000} value={record.fields.prediction||''} onChange={e=>api.patch(id,{prediction:e.target.value})} placeholder="Name an input, the expected result and the line you suspect."/></label>
      <label className="repair-field">JavaScript functions<textarea className="pg-editor" spellCheck={false} maxLength={10000} value={code} onChange={e=>{setCode(e.target.value);setReset(false)}} disabled={busy}/></label>
      <small>Define synchronous functions including solve. Supported: loops, arrays, Map/Set, basic methods. No imports, callbacks, classes, object literals or async code. Each worker has a 3-second timeout and 5,000-event cap.</small>
      <div className="repair-actions">
        <button className="primary" disabled={busy} onClick={run}>{busy?'Running actual tests…':'Run & inspect'}</button>
        {busy&&<button className="secondary" onClick={()=>{controller.current?.abort();setBusy(false);setError('Run cancelled. Your draft is kept.')}}>Cancel run</button>}
        <button className="secondary" disabled={busy} onClick={()=>setReset(!reset)}>Reset draft…</button>
      </div>
      {reset&&<div className="repair-feedback"><p>Replace this code draft with the unfinished starter? Saved attempts, revealed clues and notes will remain.</p><div className="repair-actions"><button className="secondary" onClick={()=>{setCode(module.starterCode);setResult(null);setReset(false);api.patch(id,{code:module.starterCode})}}>Replace draft</button><button className="secondary" onClick={()=>setReset(false)}>Keep my code</button></div></div>}
      {error&&<p role="alert" className="repair-feedback">{error}</p>}
    </section>
    {result&&<section className="repair-panel">
      <h3>{result.run.tests.filter(t=>t.passed).length}/{result.run.tests.length} supplied tests passed</h3>
      <p>These are actual executions. Passing supplied tests does not prove correctness or verify the optimization.</p>
      {stale&&<p className="repair-feedback" role="status">The code changed. This trace belongs to your previous run; run again before saving.</p>}
      {result.run.error&&<p role="alert">Example run: {result.run.error}</p>}
      <div className="repair-test-list">{result.run.tests.map(t=><details key={t.name}><summary>{t.passed?'PASS':'FAIL'} · {t.name}</summary><pre>{`Expected: ${JSON.stringify(t.expected)}\nActual: ${JSON.stringify(t.actual)}${t.error?'\n'+t.error:''}`}</pre></details>)}</div>
      {baseline?<div className="repair-feedback"><h4>Starter → your run</h4><div className="repair-comparison"><table><caption>Same example input and supplied test cases</caption><thead><tr><th scope="col">Recorded evidence</th><th scope="col">Starter</th><th scope="col">Your run</th></tr></thead><tbody><tr><th scope="row">Tests passed</th><td>{baseline.tests.filter(t=>t.passed).length}/{baseline.tests.length}</td><td>{result.run.tests.filter(t=>t.passed).length}/{result.run.tests.length}</td></tr><tr><th scope="row">Trace events on example</th><td>{baseline.trace.length}</td><td>{result.run.trace.length}</td></tr></tbody></table></div><small>A broken or unfinished function may do less work. These are instrumented events on one input, not a speed benchmark or a Big-O estimate.</small></div>:<button className="secondary" disabled={busy||stale} onClick={compareStarter}>Compare tests & events with starter</button>}
      <TracePlayer trace={result.run.trace} code={result.code} step={step} onStep={setStep}/>
      <button className="primary" onClick={saveAttempt} disabled={saved||stale}>{saved?'Attempt recorded':'Save tested attempt'}</button>
      <p>{result.run.trace.length} events on the example input · support: {attemptConfidence(hints)}. “Independent” means no hints recorded here; it does not certify unaided authorship.</p>
    </section>}
    <section className="repair-panel"><h3>A nudge, when you need it</h3><p>Reveal one clue at a time. There is no full solution button.</p>{module.hints.slice(0,hints).map((h,i)=><p key={h}><strong>{i+1}.</strong> {h}</p>)}<button className="secondary" disabled={hints>=4} onClick={()=>{api.patch(id,{hints:String(hints+1)});setSaved(false)}}>{hints>=4?'All four clues revealed':`Reveal clue ${hints+1}`}</button></section>
    <section className="repair-panel"><h3>Keep the evidence</h3>
      <label className="repair-field">My fix, extra test and optimization reasoning<textarea rows={4} maxLength={5000} value={record.fields.notes||''} onChange={e=>api.patch(id,{notes:e.target.value})} placeholder="The bug was… My smallest failing case was… The repair works because… The cost changes from… to…"/></label>
      <label className="repair-field">Repository or online-editor URL (optional)<input type="url" maxLength={1000} placeholder="https://…" value={record.fields.externalUrl||''} onChange={e=>api.patch(id,{externalUrl:e.target.value})}/></label><small>Saved as your reference. External code is not fetched or judged automatically.</small>
      <Attempts id={id}/>
    </section>
  </div>;
}
