'use client';
import {useState} from 'react';
import {experiments,observe,readProbe,type Experiment} from '@/lib/repair-lab/counterexamples';
import {updateRouteQuery,useRouteQuery} from '@/lib/workspace-location';
import {Field,useStudio} from '../studio/StudioContext';

function Attempt({experiment:x}:{experiment:Experiment}) {
  const {get,patch}=useStudio();
  const id='counterexample-'+x.id;
  const fields=get(id).fields;
  const [raw,setRaw]=useState(fields.lastInput||JSON.stringify(x.seed));
  const [guess,setGuess]=useState(fields.lastGuess||'');
  const [error,setError]=useState('');
  const [selected,setSelected]=useState('');
  function recover(raw?:string) {
    if(!raw)return null;
    try{return readProbe(raw)}catch{return null}
  }
  const last=recover(fields.lastInput);
  const witness=recover(fields.witness);
  const observation=last&&observe(x,last,x.bug.run);
  const evidence=witness&&!observe(x,witness,x.bug.run).match?witness:null;
  const tested=x.patches.find(p=>p.label===fields.tested);
  const checks=evidence&&tested?[evidence,...x.checks].map(v=>observe(x,v,tested.run)):null;
  const passed=checks?.every(check=>check.match);
  function run(){
    try {
      const input=readProbe(raw);
      let prediction;
      try{prediction=JSON.stringify(JSON.parse(guess))}catch{throw new Error('Predict the required output first. Use JSON, such as true, 6, null or [1,2].')}
      const result=observe(x,input,x.bug.run);
      const update:Record<string,string>={lastInput:JSON.stringify(input),lastGuess:prediction};
      if(!result.match&&prediction===JSON.stringify(result.expected)) {
        update.witness=update.lastInput;
        if(update.witness!==fields.witness)update.tested='';
      }
      patch(id,update);setError('');
    } catch(e){setError(e instanceof Error?e.message:'Check your input.')}
  }
  return <div className="counter-lab">
    <section className="repair-panel">
      <span className="repair-kicker">01 · DESIGN THE TEST</span><h3>{x.title}</h3><p>{x.contract}</p>
      <p>The starter input <code>{JSON.stringify(x.seed)}</code> passes. Change it until the implementation breaks its contract. Smaller counterexamples are easier to explain.</p>
      <pre><code>{x.bug.code}</code></pre>
      <div className="counter-inputs"><label>Your input<input value={raw} maxLength={180} onChange={e=>setRaw(e.target.value)}/></label>
      <label>Your predicted correct output<input value={guess} maxLength={180} placeholder="Predict before running" onChange={e=>setGuess(e.target.value)}/></label></div>
      <button className="primary" onClick={run}>Run my experiment</button>{error&&<p role="alert">{error}</p>}
      <details><summary>Give me a nudge</summary><p>{x.hint}</p></details>
      {observation&&<div role="status" className="counter-output"><strong>Tested {JSON.stringify(observation.input)}</strong><p>Your prediction: <code>{fields.lastGuess}</code><br/>Implementation returned: <code>{JSON.stringify(observation.actual)}</code><br/>Contract requires: <code>{JSON.stringify(observation.expected)}</code></p>
      {observation.match?'Both outputs agree on this input. Try an input that separates them.':fields.lastGuess===JSON.stringify(observation.expected)?'Counterexample found. Now repair the rule.':'You exposed a failure. Predict the contract’s output correctly to unlock the repair.'}</div>}
    </section>
    {evidence&&<section className="repair-panel"><span className="repair-kicker">02 · TEST A REPAIR</span><h3>Which rule survives new inputs?</h3>
      <p>Your counterexample is <code>{JSON.stringify(evidence)}</code>. Choose a replacement and run it against your example and additional cases.</p>
      <fieldset><legend>Candidate implementations</legend>{x.patches.map(p=><label className="counter-candidate" key={p.label}><span><input name={id} type="radio" checked={selected===p.label} onChange={()=>setSelected(p.label)}/> {p.label}</span><code>{p.code}</code></label>)}</fieldset>
      <button className="primary" disabled={!selected} onClick={()=>patch(id,{tested:selected})}>Test selected repair</button>
      {checks&&<div className="counter-output" role="status"><strong>{tested?.label}: {checks.filter(c=>c.match).length}/{checks.length} checks passed</strong>
        <ul>{checks.map((c,i)=><li key={i}>{c.match?'Pass':'Fail'} · <code>{JSON.stringify(c.input)}</code> → {JSON.stringify(c.actual)}{!c.match&&' (expected '+JSON.stringify(c.expected)+')'}</li>)}</ul>
        <p>{passed?'The repair passes these cases. Try the change of constraints below.':'Inspect a failing input and try the other repair.'}</p></div>}
    </section>}
    {passed&&<section className="repair-panel"><span className="repair-kicker">03 · CHANGE THE CONSTRAINT</span><h3>{x.transfer}</h3><Field id={id} name="explanation" label="Explain how you would adapt the solution" placeholder="The assumption that changes is… so I would…" rows={3}/></section>}
  </div>;
}

export default function CounterexampleLab() {
  const id=useRouteQuery().get('case');
  const current=experiments.find(x=>x.id===id)||experiments[0];
  return <><div className="repair-panel"><span className="repair-kicker">COUNTEREXAMPLE LAB</span><h2>Can you make this code fail?</h2>
    <p>You design the input, predict the answer, and test a repair. Each case ends by changing one assumption so you can practise adapting the idea.</p>
    <label>Choose a case <select value={current.id} onChange={e=>updateRouteQuery({case:e.target.value})}>{experiments.map(x=><option key={x.id} value={x.id}>{x.title}</option>)}</select></label></div>
    <Attempt key={current.id} experiment={current}/></>;
}
