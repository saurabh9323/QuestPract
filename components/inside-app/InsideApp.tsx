'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Play,Pause,RotateCcw,Download,Ticket,CheckCircle2,AlertTriangle} from 'lucide-react';
import {useStudio,saveFile} from '../studio/StudioContext';
import {useRouteQuery,updateRouteQuery} from '@/lib/workspace-location';
import {bookingScenarios} from '@/lib/inside-app/catalog';
import {defaultBookingOptions,type BookingOptions,type BookingResult,type ScenarioId} from '@/lib/inside-app/types';
import {runBooking} from '@/lib/inside-app/client';
import {insideProgress,insideRecord,bookingSummary,bookingReport} from '@/lib/inside-app/progress';
import {MiniCinema,RequestFlow,Inspector,WhyCard} from './TraceViews';

export default function InsideApp(){
  const query=useRouteQuery(),{p}=useStudio();
  const scenario=bookingScenarios.find(s=>s.id===query.get('scenario'))||bookingScenarios[0];
  const progress=insideProgress(p.studio);
  return <div className="inside-app">
    <header className="inside-hero"><div><span className="inside-kicker">ONE FEATURE. EVERY LAYER.</span><h2>What happens after<br/>you click <em>Book?</em></h2><p>Follow a seat through React, a request, a handler and a real database. Change one condition. Watch the story change.</p><div className="inside-badges"><span>Real SQLite execution</span><span>Modeled infrastructure</span><span>No AI required</span></div></div><div className="inside-ticket" aria-hidden="true"><Ticket size={38}/><strong>A7</strong><span>THE LAST SEAT</span><small>CINEMA JOURNEY / 01</small></div></header>
    <section className="inside-progress" aria-label="Learning evidence"><span><strong>{progress.scenarios}/7</strong> scenarios reflected on</span><span><strong>{progress.predictions}</strong> predictions recorded</span><span><strong>{progress.investigations}</strong> attempts investigated</span><span><strong>{progress.explanations}</strong> explanations saved</span></section>
    <section className="inside-panel"><div className="inside-panel-heading"><div><span className="inside-kicker">01 / CHANGE THE SITUATION</span><h3>Choose your experiment</h3></div><small>Every scenario stays unlocked</small></div><div className="inside-scenarios">{bookingScenarios.map((s,i)=><button key={s.id} aria-pressed={s.id===scenario.id} onClick={()=>updateRouteQuery({scenario:s.id})}><span>0{i+1}</span><strong>{s.title}</strong><small>{s.concepts.join(' · ')}</small></button>)}</div></section>
    <BookingJourney key={scenario.id} scenarioId={scenario.id}/>
  </div>;
}

function BookingJourney({scenarioId}:{scenarioId:ScenarioId}){
  const scenario=bookingScenarios.find(s=>s.id===scenarioId)!;
  const {get,patch,submit,notice}=useStudio(),id=insideRecord(scenarioId),record=get(id),fields=record.fields;
  const [options,setOptions]=useState<BookingOptions>(defaultBookingOptions);
  const [run,setRun]=useState<BookingResult>(),[previous,setPrevious]=useState<BookingResult>(),last=useRef<BookingResult|undefined>(undefined);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[cursor,setCursor]=useState(0),[playing,setPlaying]=useState(false),[speed,setSpeed]=useState(1000);
  const [motion,setMotion]=useState(false),[hinglish,setHinglish]=useState(false),[prediction,setPrediction]=useState(fields.predictionDraft||''),[runPrediction,setRunPrediction]=useState('');
  const [viewed,setViewed]=useState<number[]>([]),[investigated,setInvestigated]=useState<string[]>([]),[saved,setSaved]=useState(false),[frame,setFrame]=useState(false);
  const abort=useRef<AbortController|null>(null),activeRun=useRef('');
  const step=run?.steps[cursor],done=!!run&&cursor===run.steps.length-1;
  useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');setMotion(!media.matches);const changed=()=>{if(media.matches){setMotion(false);setPlaying(false)}};media.addEventListener('change',changed);return()=>{media.removeEventListener('change',changed);abort.current?.abort()}},[]);
  useEffect(()=>{if(!playing||!run)return;if(cursor>=run.steps.length-1){setPlaying(false);return}const t=setTimeout(()=>{setCursor(c=>c+1);setViewed(v=>[...new Set([...v,cursor+1])])},speed);return()=>clearTimeout(t)},[playing,run,cursor,speed]);
  const inspect=(name:string)=>setInvestigated(old=>[...new Set([...old,`${cursor+1}:${name}`])]);
  const jump=(n:number)=>{if(!run)return;const next=Math.max(0,Math.min(run.steps.length-1,n));setPlaying(false);setCursor(next);setViewed(v=>[...new Set([...v,next])])};
  const configure=(key:keyof BookingOptions,value:boolean)=>{setOptions(o=>({...o,[key]:value}));setRun(undefined);setCursor(0);setPlaying(false);setSaved(false)};
  async function start(){
    abort.current?.abort();const controller=new AbortController();abort.current=controller;
    setBusy(true);setError('');setPlaying(false);setRun(undefined);setCursor(0);setSaved(false);setFrame(false);
    const predicted=prediction;setRunPrediction(predicted);setInvestigated([]);setViewed([]);
    try{
      const next=await runBooking(scenarioId,options,controller.signal);if(controller.signal.aborted)return;
      activeRun.current=crypto.randomUUID();setPrevious(last.current);last.current=next;setRun(next);setCursor(0);setViewed([0]);
      // A trace is not an attempt until the learner explicitly saves a reflection.
    }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Unable to run this experiment.')}
    finally{if(abort.current===controller)setBusy(false)}
  }
  function saveAttempt(){
    if(!run||saved||!get(id).fields.explanation?.trim())return;
    patch(id,{type:'inside-app',scenario:scenarioId,runId:activeRun.current,runSummary:bookingSummary(run),runPrediction,investigated:investigated.join(','),viewedSteps:viewed.map(n=>n+1).sort((a,b)=>a-b).join(','),predictedCorrect:runPrediction?String(Number(runPrediction)===run.final.tables.bookings.rows.length):'not-predicted'});
    if(submit(id,'Inside a Real App · reflected',frame?1:0)){setSaved(true);notice('Reflection recorded. Check the account save status above. Course-day completion is unchanged.')}
  }
  return <>
    <section className="inside-panel inside-brief"><div><span className="inside-kicker">{scenario.concepts.join(' / ')}</span><h3>{scenario.title}</h3><p>{scenario.description}</p></div><p className="inside-honesty"><strong>What actually runs?</strong> React renders this mini-app. JavaScript and SQL execute in a disposable Web Worker with SQLite. HTTP, authentication, cache and competing-request timing are teaching models. No Node.js/.NET server, Redis, PostgreSQL, payment or real seat booking runs here.</p></section>
    <div className="inside-workbench"><MiniCinema snapshot={step?.after} busy={busy} disabled={false} onBook={()=>void start()}/>
      <section className="inside-panel inside-controls"><span className="inside-kicker">02 / PREDICT BEFORE YOU CLICK</span><h3>How many booking rows will remain?</h3><p>Count the final rows for A7, including any booking that already existed. Your prediction is captured when you press Book.</p><div className="inside-prediction" role="group" aria-label="Predict final booking row count">{['0','1','2'].map(n=><button key={n} disabled={busy} aria-pressed={prediction===n} onClick={()=>{setPrediction(n);patch(id,{predictionDraft:n})}}>{n}<small>{n==='1'?'booking':'bookings'}</small></button>)}</div>
        <fieldset disabled={busy}><legend>Experiment with the protections</legend>{([
          ['atomic','Conditional reservation','UPDATE only while the seat is still available.'],
          ['unique','Unique seat constraint','Reject a second booking for the same seat.'],
          ['idempotency','Remember the request key','Replay the same customer’s confirmed result on retry.'],
        ] as const).map(([key,title,description])=><label className="inside-toggle" key={key}><input type="checkbox" checked={options[key]} onChange={e=>configure(key,e.target.checked)}/><span><strong>{title}</strong><small>{description}</small></span></label>)}</fieldset>
        <p className="inside-note">Try “Two customers” with both the conditional reservation and unique constraint off. Then restore either protection. Writes still use transactions: a transaction alone does not fix an outdated preflight read.</p>
        {busy&&<button className="secondary" onClick={()=>{abort.current?.abort();setBusy(false)}}>Cancel run</button>}{error&&<p className="inside-error" role="alert">{error}</p>}
      </section>
    </div>
    <section className="inside-panel inside-player" tabIndex={0} aria-label="Request trace player" onKeyDown={e=>{if(e.target!==e.currentTarget||!run)return;if(['ArrowLeft','ArrowRight','Home','End',' '].includes(e.key)){e.preventDefault();if(e.key===' ')setPlaying(p=>!p);else jump(e.key==='Home'?0:e.key==='End'?run.steps.length-1:cursor+(e.key==='ArrowRight'?1:-1))}}}>
      <div className="inside-panel-heading"><div><span className="inside-kicker">03 / FOLLOW THE EVIDENCE</span><h3>A click becomes a booking</h3></div><div className="inside-actions"><label><input type="checkbox" checked={hinglish} onChange={e=>setHinglish(e.target.checked)}/> Hinglish explanations</label><label><input type="checkbox" checked={motion} onChange={e=>setMotion(e.target.checked)}/> Animate active layer</label></div></div>
      <RequestFlow step={step} motion={motion}/>
      <p className="inside-note">The active layer follows the recorded steps. Replies travel back through Network → React; cache refresh is a side effect, not a required hop for every request.</p>
      <div className="inside-transport"><button className="secondary" disabled={!run||cursor===0} onClick={()=>jump(0)} aria-label="Rewind trace"><RotateCcw size={17}/></button><button className="secondary" disabled={!run||cursor===0} onClick={()=>jump(cursor-1)} aria-label="Previous step"><ArrowLeft size={17}/></button><button className="primary" disabled={!run||done} onClick={()=>setPlaying(v=>!v)}>{playing?<Pause size={17}/>:<Play size={17}/>} {playing?'Pause':'Play'}</button><button className="secondary" disabled={!run||done} onClick={()=>jump(cursor+1)} aria-label="Next step"><ArrowRight size={17}/></button><span>{step?`Step ${step.step} / ${run!.steps.length}`:'Run to create a trace'}</span><label>Playback speed<select value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value={1800}>Slow</option><option value={1000}>Normal</option><option value={450}>Fast</option></select></label></div>
      <label className="inside-scrubber">Time travel<input type="range" min={0} max={Math.max(0,(run?.steps.length||1)-1)} value={cursor} disabled={!run} onChange={e=>jump(Number(e.target.value))} aria-valuetext={step?`${step.step}: ${step.title}`:'No trace'}/></label>
      <small>Focus this player: ← / → step, Space play/pause, Home / End jump. Rewind replays snapshots; it does not undo a live booking.</small>
      <div className="inside-step" aria-live={playing?'off':'polite'}><span className="inside-step-number">{step?String(step.step).padStart(2,'0'):'—'}</span><div><h3>{step?.title||'Your first click starts the journey.'}</h3><p>{step?.detail||'Make a prediction and click Book A7. Nothing is submitted to a booking service.'}</p>{step?.requestId&&<small>Request {step.requestId}</small>}</div></div>
      <WhyCard key={step?.concept} step={step} hinglish={hinglish} onInspect={()=>inspect('why')}/>
      {run&&<div className="inside-counters"><span><strong>{step!.after.counters.requests}</strong> requests delivered</span><span><strong>{step!.after.counters.sql}</strong> SQL statements</span><span><strong>{step!.after.counters.commits}</strong> commits</span><span><strong>{step!.after.counters.rollbacks}</strong> rollbacks</span></div>}
      {run&&<small>SQL counts exclude seed data and snapshot inspection queries. These are operation counts, not measured latency or Big-O.</small>}
    </section>
    <Inspector step={step} run={run} onInspect={inspect}/>
    {run&&<section className="inside-panel"><span className="inside-kicker">04 / CHECK THE RESULT</span><h3>What did the experiment show?</h3>{!done?<p>Finish playback to reveal the final checks and your prediction result. <button className="text-btn" onClick={()=>jump(run.steps.length-1)}>Jump to the result →</button></p>:<>
      <p>{runPrediction?`You predicted ${runPrediction} booking row(s). SQLite contains ${run.final.tables.bookings.rows.length}. ${Number(runPrediction)===run.final.tables.bookings.rows.length?'Your row-count prediction matched.':'Compare the failed assumption with the trace.'}`:'No prediction was recorded before this run. You can still inspect and explain it.'}</p>
      <ul className="inside-checks">{run.checks.map(c=><li key={c.name} className={c.passed?'inside-pass':'inside-fail'}>{c.passed?<CheckCircle2 size={20}/>:<AlertTriangle size={20}/>}<span><strong>{c.passed?'PASS':'FAIL'} · {c.name}</strong><small>{c.detail}</small></span></li>)}</ul><p className="inside-note">These checks inspect actual rows and modeled replies. Passing them does not establish production correctness or prove every concurrent execution safe.</p>
      {previous&&<div className="inside-comparison"><h4>Compare with your preceding run</h4><div className="inside-table-wrap"><table><thead><tr><th>Evidence</th><th>Previous</th><th>This run</th></tr></thead><tbody><tr><th>Protections</th>{[previous,run].map((r,i)=><td key={i}>{Object.entries(r.options).map(([k,v])=>`${k}: ${v?'on':'off'}`).join(', ')}</td>)}</tr><tr><th>Booking rows</th><td>{previous.final.tables.bookings.rows.length}</td><td>{run.final.tables.bookings.rows.length}</td></tr><tr><th>SQL statements</th><td>{previous.final.counters.sql}</td><td>{run.final.counters.sql}</td></tr><tr><th>Steps recorded</th><td>{previous.steps.length}</td><td>{run.steps.length}</td></tr></tbody></table></div></div>}
    </>}</section>}
    <section className="inside-panel"><span className="inside-kicker">05 / EXPLAIN IT LIKE AN ENGINEER</span><h3>Take this into an interview</h3><p><strong>{scenario.question}</strong></p><ol><li>What happened between the click and the reply?</li><li>Which step is your strongest evidence? Mention its number.</li><li>What limitation or tradeoff would you discuss for a production system?</li></ol>
      <button className="secondary" aria-expanded={frame} onClick={()=>setFrame(v=>!v)}>{frame?'Hide':'Show'} an answer structure</button>{frame&&<p className="inside-answer-frame">“I expected ___. At step ___ I observed ___. The risk was ___. I used ___ because ___. The result was ___. In production I would also consider ___.”</p>}
      <label className="inside-field">Your explanation<textarea rows={5} maxLength={8000} value={fields.explanation||''} onChange={e=>patch(id,{explanation:e.target.value})} placeholder="Use your own words. Point to an actual step and explain the reason, not just the definition."/></label>
      <label className="inside-field">What assumption changed? / Notes<textarea rows={3} maxLength={8000} value={fields.notes||''} onChange={e=>patch(id,{notes:e.target.value})} placeholder="For example: I thought a timeout meant the booking had failed."/></label>
      <div className="inside-actions"><button className="primary" disabled={!run||!done||saved||!fields.explanation?.trim()} onClick={saveAttempt}>{saved?'Reflection saved':'Save learning attempt'}</button><button className="secondary" disabled={!run} onClick={()=>run&&saveFile(`quest90-cinema-${scenarioId}.md`,bookingReport(run,runPrediction,fields.explanation||''))}><Download size={17}/> Download evidence</button></div><small>Finish playback and add an explanation to save an attempt. Drafts use your existing account sync. Writing is self-reviewed; no AI score or course completion is assigned.</small>
      <p>{viewed.length} steps viewed · {investigated.length} evidence views opened · {record.attempts.filter(a=>a.outcome==='Inside a Real App · reflected').length} reflections saved for this scenario</p>
      <details><summary>Previous reflections</summary>{record.attempts.filter(a=>a.outcome==='Inside a Real App · reflected').slice(-10).reverse().map(a=><article className="inside-reflection" key={a.id}><small>{new Date(a.at).toLocaleString()}</small><p>{a.fields.explanation}</p><p>Predicted rows: {a.fields.runPrediction||'not recorded'} · Match: {a.fields.predictedCorrect}</p><details><summary>Recorded experiment</summary><pre>{a.fields.runSummary}</pre></details></article>)}</details>
    </section>
    <section className="inside-panel inside-transfer"><div><h3>Connect this to your next practice</h3><p>Use the same reasoning when designing a cart, chat delivery, login or upload. This release contains the complete cinema journey.</p></div><div className="inside-actions"><a className="secondary" href="/practice/?tool=sql">Write SQL</a><a className="secondary" href="/flows/">Draw the architecture</a><a className="secondary" href="/interview-materials/">Prepare an interview answer</a></div></section>
  </>;
}
