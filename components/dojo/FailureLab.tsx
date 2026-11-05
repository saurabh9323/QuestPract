'use client';
import {useEffect,useState} from 'react';
import {failureRecord,labForTrack,runFailureLab,normalizeLabInputs,type LabReport} from '@/lib/dojo-sim';
import {useStudio} from '../studio/StudioContext';
import DojoField from './DojoField';
import '@/app/dojo-sim.css';

type SavedRun={inputs:Record<string,string>;prediction:string;report:LabReport};
export default function FailureLab({track,recordId}:{track:string;recordId:string}) {
  const {get,patch,submit,notice}=useStudio(),model=labForTrack(track),id=failureRecord(recordId);
  const record=get(id);
  const [step,setStep]=useState(0),[playing,setPlaying]=useState(false),[error,setError]=useState('');
  const last=record.attempts.filter(a=>a.outcome.startsWith('Model experiment')).at(-1);
  let run:SavedRun|null=null;
  if(model&&last) {
    try {
      const inputs=normalizeLabInputs(model,JSON.parse(last.fields.inputs));
      run={inputs,prediction:last.fields.prediction,report:runFailureLab(model,inputs)};
    } catch { /* An invalid legacy snapshot must not break the lab. */ }
  }
  const inputs=Object.fromEntries((model?.controls||[]).map(c=>[c.name,record.fields[c.name]??c.initial]));
  const prediction=record.fields.prediction||'';
  const dirty=run && (JSON.stringify(inputs)!==JSON.stringify(run.inputs)||prediction!==run.prediction);
  const traceLength=run?.report.trace.length||0;
  const current=Math.min(step,Math.max(0,traceLength-1));
  useEffect(()=>{
    if(!playing)return;
    const timer=setTimeout(()=>{
      if(current>=traceLength-1)setPlaying(false);
      else setStep(current+1);
    },1400);
    return()=>clearTimeout(timer);
  },[playing,traceLength,current]);
  if(!model)return <p>No teaching model is available for this track.</p>;
  function execute(){
    setError('');setPlaying(false);
    if(!model)return;
    try {
      if(!model.predictions.includes(prediction))throw new Error('Choose a prediction before running the experiment.');
      const report=runFailureLab(model,inputs);
      if(patch(id,{...inputs,inputs:JSON.stringify(inputs),prediction,result:JSON.stringify(report),modelVersion:'1'}) &&
        submit(id,'Model experiment · '+(report.outcome===prediction?'prediction matched':'prediction differed'))) {
        setStep(0);
        if(get(recordId).fields.reviewed==='yes')patch(recordId,{reviewed:'no'});
      }
    }catch(e){setError(e instanceof Error?e.message:'The model could not run.');}
  }
  return <section className="card dojo-lab">
    <span className="mini-tag">{track} track experiment · teaching model</span>
    <h2>{model.title}</h2>
    <p>{model.setup}</p>
    <p className="studio-callout">This experiment is shared across the {track} track. It runs the fixed model described above, independently of your diagram. It does not execute your code or external services.</p>
    <div className="dojo-lab-inputs">{model.controls.map(c=><label key={c.name}>{c.label}
      {c.choices?<select value={inputs[c.name]} onChange={e=>{patch(id,{[c.name]:e.target.value});setPlaying(false);setError('')}}>{c.choices.map(v=><option key={v}>{v}</option>)}</select>:
        <input maxLength={240} value={inputs[c.name]} onChange={e=>{patch(id,{[c.name]:e.target.value});setPlaying(false);setError('')}}/>}
    </label>)}</div>
    <label className="dojo-predict">Predict the outcome<select value={prediction} onChange={e=>patch(id,{prediction:e.target.value})}><option value="">Choose before running…</option>{model.predictions.map(v=><option key={v}>{v}</option>)}</select></label>
    <div className="button-row"><button className="primary" onClick={execute}>Run experiment</button><small>{record.attempts.filter(a=>a.outcome.startsWith('Model experiment')).length} runs saved</small></div>
    {error&&<p role="alert">{error}</p>}
    {run&&<div className="dojo-lab-result">
      {dirty&&<p role="status">Inputs or prediction changed. The result below belongs to your last saved run. Run again to compare.</p>}
      <h3>Last run: {run.report.outcome}</h3>
      <p>Your prediction: <strong>{run.prediction}</strong> · {run.prediction===run.report.outcome?'Matched the model':'Different from the model'}</p>
      <details><summary>Inputs used for this result</summary><dl>{Object.entries(run.inputs).map(([k,v])=><div key={k}><dt>{model.controls.find(c=>c.name===k)?.label||k}</dt><dd>{v}</dd></div>)}</dl></details>
      <div className="dojo-lab-metrics">{Object.entries(run.report.metrics).map(([k,v])=><div key={k}><b>{v}</b><span>{k}</span></div>)}</div>
      <div className="button-row">
        <button className="secondary" disabled={current===0} onClick={()=>{setPlaying(false);setStep(current-1)}}>← Back</button>
        <button className="secondary" onClick={()=>{if(current===traceLength-1)setStep(0);setPlaying(p=>!p)}}>{playing?'Pause':'Play steps'}</button>
        <button className="secondary" disabled={current===traceLength-1} onClick={()=>{setPlaying(false);setStep(current+1)}}>Next →</button>
      </div>
      <label>Step {current+1} of {traceLength}<input aria-label="Experiment step" type="range" min={0} max={traceLength-1} value={current} onChange={e=>{setPlaying(false);setStep(Number(e.target.value))}}/></label>
      <ol className="dojo-model-trace">{run.report.trace.map((text,i)=><li key={i} aria-current={i===current?'step':undefined} className={i===current?'is-current':i<current?'is-past':''}><button onClick={()=>{setPlaying(false);setStep(i)}} aria-label={'Jump to experiment step '+(i+1)}>{i+1}</button><span>{text}</span></li>)}</ol>
      <p aria-live="polite" className="dojo-active-step">Step {current+1}: {run.report.trace[current]}</p>
      <h3>Connect the experiment to your design</h3><p>{model.debrief} Which assumption applies to your case, and which does not?</p>
      <DojoField id={id} ownerId={recordId} name="reflection" label="What I learned, and what I would change"/>
    </div>}
    <details><summary>Run history</summary>{record.attempts.length?record.attempts.slice().reverse().map(a=><article key={a.id}><strong>{new Date(a.at).toLocaleString()} · {a.outcome}</strong><pre>{a.fields.inputs}</pre><p>Prediction: {a.fields.prediction}</p><button className="secondary" onClick={()=>{try{const restored=normalizeLabInputs(model,JSON.parse(a.fields.inputs));runFailureLab(model,restored);if(patch(id,{...restored,prediction:a.fields.prediction})){setPlaying(false);notice('Inputs restored. Run again to create a new experiment.')}}catch{notice('That run could not be restored.')}}}>Use these inputs again</button></article>):<p>Your experiments will appear here after you run the model.</p>}</details>
  </section>;
}
