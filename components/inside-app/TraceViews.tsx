'use client';
import {useState} from 'react';
import {bookingLanes,concepts,backendExamples} from '@/lib/inside-app/catalog';
import type {BookingStep,BookingSnapshot,Table,BookingResult} from '@/lib/inside-app/types';

export function MiniCinema({snapshot,busy,onBook,disabled}:{snapshot?:BookingSnapshot;busy:boolean;onBook:()=>void;disabled:boolean}){
  return <section className="inside-cinema" aria-label="Cinema mini-app">
    <div className="inside-cinema-heading"><span>Q / CINEMA</span><small>Fictional screening · no payments</small></div>
    <div className="inside-screen">SCREEN</div>
    <div className="inside-seats" aria-label="Seat map"><span aria-label="A5 unavailable">A5</span><span aria-label="A6 unavailable">A6</span><span className={snapshot?.cache==='booked'?'booked':'available'}>A7<small>{snapshot?.cache==='booked'?'booked':'available'}</small></span><span aria-label="A8 unavailable">A8</span></div>
    <div className="inside-seat-key"><span>▧ Other seats unavailable</span><span>◉ A7 is our focus</span></div>
    <p className="inside-screen-status" role="status"><strong>{busy?'Preparing the trace…':snapshot?.ui.status||'Ready to book'}</strong><span>{snapshot?.ui.message||'One seat remains. Make a prediction, then follow the booking.'}</span></p>
    <button className="primary" disabled={disabled||busy} onClick={onBook}>{busy?'Running SQLite…':'Book A7 · run scenario'}</button>
    <small>Playback shows the recorded UI state. Each run starts with a fresh sample database.</small>
  </section>;
}

export function RequestFlow({step,motion}:{step?:BookingStep;motion:boolean}){
  return <div className={`inside-flow ${motion?'inside-motion':''}`} aria-label="Request journey: React, network, handler, database and cache">
    {bookingLanes.map((lane,i)=><div key={lane.id} className="inside-flow-pair"><div className={`inside-flow-node ${step?.lane===lane.id?'is-current':''}`} aria-current={step?.lane===lane.id?'step':undefined}><span aria-hidden="true">{lane.symbol}</span><strong>{lane.title}</strong><small>{lane.subtitle}</small>{step?.lane===lane.id&&<b>STEP {step.step}</b>}</div>{i<bookingLanes.length-1&&<span className="inside-flow-arrow" aria-hidden="true">→</span>}</div>)}
  </div>;
}

function TableView({table,before,name}:{table:Table;before?:Table;name:string}){
  return <div className="inside-table-wrap" tabIndex={0} role="region" aria-label={`${name} data`}><table><caption>{name} · {table.rows.length} row(s)</caption><thead><tr>{table.columns.map(c=><th key={c} scope="col">{c}</th>)}</tr></thead><tbody>{table.rows.length?table.rows.map((r,i)=><tr key={i} className={before&&!before.rows.some(old=>JSON.stringify(old)===JSON.stringify(r))?'inside-changed':''}>{r.map((v,j)=><td key={j}>{v===null?'NULL':String(v)}</td>)}</tr>):<tr><td colSpan={table.columns.length}>No rows</td></tr>}</tbody></table></div>;
}

export function Inspector({step,run,onInspect}:{step?:BookingStep;run?:BookingResult;onInspect:(name:string)=>void}){
  const [tab,setTab]=useState<'state'|'data'|'requests'|'code'>('state'),[language,setLanguage]=useState<'node'|'dotnet'>('node');
  return <section className="inside-panel inside-inspector"><div className="inside-panel-heading"><div><span className="inside-kicker">OPEN THE HOOD</span><h3>Evidence at this step</h3></div><small>Changes highlighted in the tables</small></div>
    <div className="inside-tabs" role="group" aria-label="Inspect evidence">{(['state','data','requests','code'] as const).map(t=><button key={t} aria-pressed={t===tab} onClick={()=>{setTab(t);onInspect(t)}}>{t==='state'?'State diff':t==='data'?'Database rows':t==='requests'?'Requests & logs':'SQL & handler'}</button>)}</div>
    {!step?<p>Run the scenario to inspect real database snapshots and modeled request states.</p>:<>
      {tab==='state'&&<div className="inside-state-grid">{(['before','after'] as const).map(side=><div key={side}><h4>{side==='before'?'Before this step':'After this step'}</h4><dl><dt>Screen status</dt><dd>{step[side].ui.status}</dd><dt>Visible booking ID</dt><dd>{step[side].ui.bookingId??'none'}</dd><dt>Cached availability</dt><dd>{step[side].cache}</dd><dt>Database booking rows</dt><dd>{step[side].tables.bookings.rows.length}</dd><dt>Executed SQL statements</dt><dd>{step[side].counters.sql}</dd></dl></div>)}</div>}
      {tab==='data'&&<><p className="inside-note">Actual SQLite rows after this step, including uncommitted changes inside the current transaction. Trace snapshots stay unchanged when you rewind.</p>{(['seats','bookings','request_keys'] as const).map(name=><TableView key={name} name={name} table={step.after.tables[name]} before={step.before.tables[name]}/>)}</>}
      {tab==='requests'&&<><div className="inside-table-wrap" tabIndex={0} role="region" aria-label="Modeled requests"><table><caption>HTTP delivery model · not real network traffic</caption><thead><tr><th>Request</th><th>Customer</th><th>Status</th><th>HTTP</th><th>Booking</th></tr></thead><tbody>{step.after.requests.map(r=><tr key={r.id}><td>{r.id}</td><td>{r.customer}</td><td>{r.status}</td><td>{r.http??'—'}</td><td>{r.bookingId??'—'}</td></tr>)}{!step.after.requests.length&&<tr><td colSpan={5}>No delivered request</td></tr>}</tbody></table></div><ol className="inside-logs">{run?.steps.filter(s=>s.step<=step.step).map(s=><li key={s.step}><code>{String(s.step).padStart(2,'0')} / {s.lane}</code><span>{s.title}</span></li>)}</ol></>}
      {tab==='code'&&<><h4>SQL executed at this step</h4>{step.sql?<><pre>{step.sql}</pre><p>Bound parameters: <code>{JSON.stringify(step.params)}</code></p></>:<p>This step executes no SQL statement.</p>}<details><summary>How a backend handler could look</summary><p>Illustrative structure only. Helpers are placeholders; neither server framework is executed here.</p><label>Backend example<select value={language} onChange={e=>setLanguage(e.target.value as 'node'|'dotnet')}><option value="node">Node.js</option><option value="dotnet">ASP.NET Core</option></select></label><pre>{backendExamples[language]}</pre></details><a href="/inside-app-worker.js" target="_blank" rel="noreferrer">Read the JavaScript worker actually used by this lab ↗</a></>}
    </>}
  </section>;
}

export function WhyCard({step,hinglish,onInspect}:{step?:BookingStep;hinglish:boolean;onInspect:()=>void}){
  const concept=step?concepts[step.concept]:undefined;
  if(!concept)return null;
  return <details className="inside-why" onToggle={e=>{if(e.currentTarget.open)onInspect()}}><summary>Why is this needed? · {concept.name}</summary><p>{hinglish?concept.hi:concept.en}</p><small>{concept.limit}</small></details>;
}
