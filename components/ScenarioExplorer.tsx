'use client';

import {useEffect,useMemo,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Bookmark,Check,Copy,Eye,Pause,Play,RotateCcw,Search,Shuffle} from 'lucide-react';
import {visualScenarios,type VisualScenario} from '@/lib/visual-scenarios';
import {validateProgress,type Progress} from '@/lib/progress';
import {blankStudio,type StudioRecord} from '@/lib/studio-state';

type Props={p:Progress;commit:(p:Progress)=>void;notice:(message:string)=>void};
const recordKey=(id:string)=>`visual-case-${id}`;
const display=(value:unknown)=>JSON.stringify(value,null,2)??String(value);

export default function ScenarioExplorer({p,commit,notice}:Props){
 const current=useRef(p);current.current=p;
 const [selected,setSelected]=useState(()=>{
  const saved=p.studio?.['visual-explorer']?.fields.selected;
  return visualScenarios.find(s=>s.id===saved)?.id||visualScenarios.find(s=>!p.studio?.[recordKey(s.id)]?.fields.reviewedAt)?.id||visualScenarios[0]?.id||'';
 });
 const [query,setQuery]=useState(''),[topic,setTopic]=useState('All'),[level,setLevel]=useState('All'),[status,setStatus]=useState('All'),[limit,setLimit]=useState(12);
 const roomRef=useRef<HTMLDivElement>(null);
 const topics=useMemo(()=>Array.from(new Set(visualScenarios.map(s=>s.topic))),[]);
 const record=(id:string)=>p.studio?.[recordKey(id)]||blankStudio();
 const reviewed=visualScenarios.filter(s=>record(s.id).fields.reviewedAt).length;
 const bookmarked=visualScenarios.filter(s=>record(s.id).fields.bookmarked==='true').length;
 const filtered=visualScenarios.filter(s=>{
  const f=record(s.id).fields;
  return (topic==='All'||s.topic===topic)&&(level==='All'||s.difficulty===level)&&
   (status==='All'||(status==='Unreviewed'&&!f.reviewedAt)||(status==='Reviewed'&&!!f.reviewedAt)||(status==='Bookmarked'&&f.bookmarked==='true'))&&
   `${s.title} ${s.topic} ${s.prompt}`.toLowerCase().includes(query.trim().toLowerCase());
 });
 const scenario=visualScenarios.find(s=>s.id===selected)||visualScenarios[0];
 function patch(id:string,fields:Record<string,string>){
  const old=current.current.studio?.[id]||blankStudio(),at=new Date().toISOString();
  const next={...current.current,updatedAt:at,studio:{...current.current.studio,[id]:{...old,fields:{...old.fields,...fields},updatedAt:at}}};
  try{validateProgress(next);current.current=next;commit(next);return true}catch(error){notice(error instanceof Error?error.message:'Unable to save this change.');return false}
 }
 function open(id:string,scroll=true){
  setSelected(id);patch('visual-explorer',{selected:id});
  if(scroll)requestAnimationFrame(()=>roomRef.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'}));
 }
 function next(random=false){
  const remaining=filtered.filter(s=>s.id!==scenario.id&&!record(s.id).fields.reviewedAt);
  if(!remaining.length){notice('No other unreviewed scenarios match your filters. Change the filters or revisit a reviewed example.');return}
  const after=remaining.find(s=>visualScenarios.indexOf(s)>visualScenarios.indexOf(scenario));
  open(random?remaining[Math.floor(Math.random()*remaining.length)].id:(after||remaining[0]).id);
 }
 function changeFilter(action:()=>void){action();setLimit(12)}
 if(!scenario)return <section className="card">Scenarios are not available.</section>;
 return <div className="scenario-explorer">
  <section className="scenario-intro card">
   <div><span className="eyebrow">A DIFFERENT INPUT. A DIFFERENT DECISION.</span><h2>Your visual scenario collection</h2><p>Trace the algorithm, inspect its memory, and explain why it works. Each scenario has its own input, expected result and walkthrough.</p></div>
   <dl className="scenario-totals"><div><dt>Scenarios</dt><dd>{visualScenarios.length}</dd></div><div><dt>Reviewed by you</dt><dd>{reviewed}<small> / {visualScenarios.length}</small></dd></div><div><dt>Bookmarked</dt><dd>{bookmarked}</dd></div></dl>
  </section>
  <section className="scenario-catalog card" aria-label="Find visual scenarios">
   <div className="scenario-filters">
    <label className="scenario-search"><span><Search size={16}/>Search scenarios</span><input type="search" value={query} onChange={e=>changeFilter(()=>setQuery(e.target.value))} placeholder="Try duplicates, negative, window…"/></label>
    <label>Topic<select value={topic} onChange={e=>changeFilter(()=>setTopic(e.target.value))}><option>All</option>{topics.map(t=><option key={t}>{t}</option>)}</select></label>
    <label>Difficulty<select value={level} onChange={e=>changeFilter(()=>setLevel(e.target.value))}>{['All',...new Set(visualScenarios.map(q=>q.difficulty))].map(v=><option key={v}>{v}</option>)}</select></label>
    <label>Your status<select value={status} onChange={e=>changeFilter(()=>setStatus(e.target.value))}>{['All','Unreviewed','Reviewed','Bookmarked'].map(v=><option key={v}>{v}</option>)}</select></label>
   </div>
   <div className="scenario-catalog-heading"><p>{filtered.length} matching scenarios · {topics.length} algorithm families</p><div className="scenario-actions"><button className="secondary" onClick={()=>next(true)}><Shuffle size={16}/>Random unreviewed</button><button className="secondary" onClick={()=>next()}>Next unreviewed<ArrowRight size={16}/></button></div></div>
   <div className="scenario-card-grid">{filtered.slice(0,limit).map(s=>{
    const f=record(s.id).fields;
    return <button key={s.id} className="scenario-choice" aria-pressed={s.id===scenario.id} onClick={()=>open(s.id)}>
     <span className="scenario-choice-meta"><span>{s.difficulty} · {s.topic}</span>{f.bookmarked==='true'&&<Bookmark size={15} fill="currentColor" aria-label="Bookmarked"/>}</span>
     <strong>{s.title}</strong><code>{display(s.input.nums)}{s.input.target!==undefined?` · target ${s.input.target}`:''}{s.input.window!==undefined?` · window ${s.input.window}`:''}</code>
     <span className="scenario-choice-status">{f.reviewedAt?<><Check size={15}/>Reviewed by you</>:`${s.frames.length} steps to explore`}<ArrowRight size={15}/></span>
    </button>
   })}</div>
   {!filtered.length&&<p className="scenario-empty">No scenarios match these filters. <button className="secondary" onClick={()=>{setQuery('');setTopic('All');setLevel('All');setStatus('All');setLimit(12)}}>Clear filters</button></p>}
   {filtered.length>limit&&<button className="secondary scenario-show-more" onClick={()=>setLimit(n=>n+12)}>Show {Math.min(12,filtered.length-limit)} more scenarios</button>}
  </section>
  <div ref={roomRef} className="scenario-room-anchor" tabIndex={-1}><ScenarioRoom key={scenario.id} scenario={scenario} record={record(scenario.id)} patch={fields=>patch(recordKey(scenario.id),fields)} notice={notice} next={()=>next()}/></div>
 </div>;
}

function ScenarioRoom({scenario:s,record,patch,notice,next}:{scenario:VisualScenario;record:StudioRecord;patch:(fields:Record<string,string>)=>boolean;notice:(message:string)=>void;next:()=>void}){
 const [step,setStep]=useState(0),[playing,setPlaying]=useState(false),[speed,setSpeed]=useState(1600),[revealed,setRevealed]=useState(false),[hints,setHints]=useState(0);
 const frame=s.frames[Math.min(step,s.frames.length-1)];
 useEffect(()=>{if(!playing)return;if(step>=s.frames.length-1){setPlaying(false);return}const timer=setTimeout(()=>setStep(n=>n+1),speed);return()=>clearTimeout(timer)},[playing,step,s.frames.length,speed]);
 async function copy(){try{await navigator.clipboard.writeText(`Help me reason about ${s.title}. Review my prediction and notes, give a hint, then ask one follow-up.\n\nQuestion: ${s.prompt}\nInput: ${display(s.input)}\nMy prediction: ${record.fields.prediction||'(not written)'}\nMy notes: ${record.fields.notes||'(not written)'}${revealed?`\nReference output: ${display(s.expected)}\nReference explanation: ${s.explanation}`:''}`);notice('Scenario and your work copied as a review prompt.')}catch{notice('Clipboard unavailable. Select and copy your notes manually.')}}
 return <div className="scenario-room">
  <section className="card scenario-contract"><div className="scenario-room-title"><div><span className="eyebrow">{s.topic} · {s.difficulty}</span><h2>{s.title}</h2></div><button className="secondary" aria-pressed={record.fields.bookmarked==='true'} onClick={()=>patch({bookmarked:record.fields.bookmarked==='true'?'false':'true'})}><Bookmark size={17} fill={record.fields.bookmarked==='true'?'currentColor':'none'}/>{record.fields.bookmarked==='true'?'Bookmarked':'Bookmark'}</button></div><p>{s.prompt}</p><div className="scenario-io"><div><h3>Given input</h3><pre>{display(s.input)}</pre></div><div><label className="scenario-field">Predict the return value<textarea rows={3} maxLength={2000} value={record.fields.prediction||''} onChange={e=>patch({prediction:e.target.value})} placeholder="Write the result and your reasoning before stepping through."/></label><small>Saved with this scenario. This prediction is for practice, not an automatic grade.</small></div></div></section>
  <div className="scenario-study-layout">
   <div className="scenario-main-column">
    {frame&&<section className="card scenario-stage"><span className="eyebrow">FOLLOW THE ALGORITHM STATE</span><div className="scenario-stage-heading"><h3>{frame.title}</h3><span>Step {step+1} / {s.frames.length}</span></div><div className="scenario-array" aria-label="Array state with zero-based indices">{frame.values.length?frame.values.map((value,i)=><div key={i} className={frame.active.includes(i)?'is-active':''}><small>index {i}</small><strong>{value}</strong><span>{frame.active.includes(i)?'Active':' '}</span></div>):<p>Empty array — there are no values to inspect.</p>}</div>
     <dl className="scenario-variables">{Object.entries(frame.variables).map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>
     <div className="scenario-explanation" aria-live="polite"><p>{frame.detail}</p>{frame.result!==undefined&&revealed&&<p><strong>Return value:</strong> <code>{display(frame.result)}</code></p>}</div>
     <div className="scenario-playback"><button className="secondary" disabled={step===0} onClick={()=>{setPlaying(false);setStep(n=>n-1)}} aria-label="Previous step"><ArrowLeft size={17}/></button><button className="primary" onClick={()=>{if(step===s.frames.length-1)setStep(0);setPlaying(v=>!v)}}>{playing?<Pause size={17}/>:<Play size={17}/>} {playing?'Pause':'Play steps'}</button><button className="secondary" disabled={step===s.frames.length-1} onClick={()=>{setPlaying(false);setStep(n=>n+1)}} aria-label="Next step"><ArrowRight size={17}/></button><button className="secondary" onClick={()=>{setPlaying(false);setStep(0)}} aria-label="Restart walkthrough"><RotateCcw size={17}/></button><label>Speed<select value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value={2400}>Slow</option><option value={1600}>Normal</option><option value={800}>Fast</option></select></label></div>
     <label className="scenario-scrubber">Explore any step<input type="range" min="0" max={Math.max(0,s.frames.length-1)} value={step} onChange={e=>{setPlaying(false);setStep(Number(e.target.value))}}/></label><small>The displayed algorithm produces these state snapshots for the given input. This view does not execute your submitted code.</small>
    </section>}
    <section className="card scenario-reference"><div className="scenario-room-title"><h3>Hints and reference answer</h3><span>{hints} / {s.hints.length} hints</span></div>{hints>0&&<ol>{s.hints.slice(0,hints).map(h=><li key={h}>{h}</li>)}</ol>}<div className="scenario-actions"><button className="secondary" disabled={hints===s.hints.length} onClick={()=>setHints(n=>n+1)}>{hints===s.hints.length?'All hints shown':'Reveal one hint'}</button><button className="secondary" aria-expanded={revealed} onClick={()=>setRevealed(v=>!v)}><Eye size={16}/>{revealed?'Hide reference answer':'Reveal reference answer'}</button></div>{revealed&&<div className="scenario-answer"><h4>Expected return value</h4><pre>{display(s.expected)}</pre><p>{s.explanation}</p><p><strong>Complexity:</strong> {s.complexity}</p></div>}<details><summary>Read the algorithm code</summary><pre><code>{s.code}</code></pre></details></section>
   </div>
   <section className="card scenario-notes"><span className="eyebrow">KEEP WHAT YOU UNDERSTOOD</span><h3>Your scenario notebook</h3><label className="scenario-field">Explain the key decision<textarea rows={9} maxLength={20000} value={record.fields.notes||''} onChange={e=>patch({notes:e.target.value})} placeholder="What changed at each step? Which edge case surprised you? Explain the invariant in your own words. English or Hinglish is fine."/></label><small>Notes and bookmarks use your existing account save flow. Check the page’s save status before leaving.</small><button className="secondary" onClick={copy}><Copy size={16}/>Copy as a review prompt</button><div className="scenario-review"><h4>{record.fields.reviewedAt?'Reviewed by you':'Ready to explain it?'}</h4><p>Mark reviewed when you can explain the result and the important edge case without the walkthrough.</p><button className={record.fields.reviewedAt?'secondary':'primary'} onClick={()=>{if(patch({reviewedAt:record.fields.reviewedAt?'':new Date().toISOString()}))notice(record.fields.reviewedAt?'Scenario returned to your review queue.':'Marked reviewed. This records your self-assessment.')}}><Check size={16}/>{record.fields.reviewedAt?'Return to review queue':'Mark reviewed'}</button>{record.fields.reviewedAt&&<small>Reviewed {new Date(record.fields.reviewedAt).toLocaleDateString()}</small>}</div><button className="secondary" onClick={next}>Next unreviewed<ArrowRight size={16}/></button></section>
  </div>
 </div>;
}
