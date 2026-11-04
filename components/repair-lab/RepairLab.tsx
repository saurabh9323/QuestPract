'use client';
import {useRouteQuery,updateRouteQuery} from '@/lib/workspace-location';
import {useStudio} from '../studio/StudioContext';
import {repairModules} from '@/lib/repair-lab/modules';
import RepairWorkshop from './RepairWorkshop';
import RecallRound from './RecallRound';
import CounterexampleLab from './CounterexampleLab';
import PersonalRevision from './PersonalRevision';

export default function RepairLab(){
  const params=useRouteQuery(),{get}=useStudio(),mode=params.get('mode')==='counterexample'?'counterexample':params.get('mode')==='personal'?'personal':params.get('mode')==='recall'?'recall':'repair';
  const selected=repairModules.find(m=>m.id===params.get('module'));
  return <div className="repair-lab">
    <header className="repair-hero"><div><span className="repair-kicker">LESS WATCHING. MORE FIGURING IT OUT.</span><h2>Take over the unfinished work.</h2><p>A small broken module. A decision you must defend. A test that tells you what happened. Build confidence from your own evidence.</p></div><div className="repair-hero-mark" aria-hidden="true"><span>{'{ }'}</span><small>REPAIR / RECALL</small></div></header>
    <nav className="repair-mode" aria-label="Repair and recall modes"><button aria-pressed={mode==='personal'} onClick={()=>updateRouteQuery({mode:'personal'})}><strong>For you · Gemini revision</strong><span>Questions from your completed days</span></button><button aria-pressed={mode==='repair'} onClick={()=>updateRouteQuery({mode:null})}><strong>Fix & optimize</strong><span>6 unfinished JavaScript modules</span></button><button aria-pressed={mode==='recall'} onClick={()=>updateRouteQuery({mode:'recall'})}><strong>20-day brainstorm</strong><span>22 decisions, dry runs & follow-ups</span></button><button aria-pressed={mode==='counterexample'} onClick={()=>updateRouteQuery({mode:'counterexample'})}><strong>Counterexample lab</strong><span>Design a test that exposes a bug</span></button></nav>
    {mode==='counterexample'?<CounterexampleLab/>:mode==='personal'?<PersonalRevision/>:mode==='recall'?<RecallRound key={params.get('scope')||'all'}/>:selected?<><button className="secondary" onClick={()=>updateRouteQuery({module:null})}>← All repair modules</button><RepairWorkshop key={selected.id} module={selected}/></>:<>
      <section className="repair-panel"><h3>You inherit it. You improve it.</h3><p>Each starter already has a function contract and tests. Fix the missing or incorrect pieces here, or download the file to use in your own editor. Then explain how you reduced repeated work.</p><p>Drafts, notes and saved attempts use your existing account sync. These are separate practice records; they do not mark your course days complete.</p></section>
      <div className="repair-catalog">{repairModules.map((m,i)=>{const record=get(`repair-code-${m.id}`);return <button className="repair-module-card" key={m.id} onClick={()=>updateRouteQuery({module:m.id})}><span className="repair-card-number">0{i+1}</span><small>DAY {m.day} FOUNDATION · {m.topic}</small><h3>{m.title}</h3><p>{m.scenario}</p><div><span>{m.tests.length} executable tests</span><span>{record.fields.passedAt?'Passing attempt saved':record.attempts.length?`${record.attempts.length} attempts`:'Ready to start'}</span></div><strong>Take over this module →</strong></button>})}</div>
    </>}
  </div>;
}
