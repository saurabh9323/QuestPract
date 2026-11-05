'use client';
import {useState} from 'react';
import type {DojoChallenge} from '@/lib/dojo';
import {currentReview,designVersion,experimentVersion,reviewSignature,sections,type Section} from '@/lib/dojo-course';
import {failureRecord} from '@/lib/dojo-sim';
import {dojoTutorDraft} from '@/lib/dojo-tutor';
import {saveFile,useStudio} from '../studio/StudioContext';
import DojoField from './DojoField';
import DesignWorkbench from './DesignWorkbench';
import FailureLab from './FailureLab';

type Props={challenge:DojoChallenge;section:Section;choose:(section:Section)=>void;previous?:()=>void;next?:()=>void;back:()=>void};
export default function ChallengeRoom({challenge:c,section,choose,previous,next,back}:Props) {
  const {get,patch,notice}=useStudio(),id='dojo-'+c.id;
  const record=get(id),experiment=get(failureRecord(id));
  const version=designVersion(record),run=experimentVersion(experiment);
  const reviewed=currentReview(record,experiment);
  const [aiNote,setAiNote]=useState('');
  const done=[record.fields.lessonRead==='yes',Boolean(version&&version.fields.graph===record.fields.graph),Boolean(run),reviewed];
  const checked=c.checks.filter((_,i)=>record.fields['check'+i]==='yes').length;
  const ready=done[1]&&done[2]&&checked===c.checks.length&&Boolean(record.fields.evidence?.trim())&&Boolean(record.fields.interview?.trim())&&Boolean(experiment.fields.reflection?.trim());
  function ask(kind:'hint'|'review') {
    const draft=dojoTutorDraft(c,record,experiment,kind);
    setAiNote(draft.trimmed?'Context trimmed: only bounded excerpts of this case and your work are included.':'A draft is ready in your tutor. Review it, then send.');
    if(kind==='hint')patch(id,{hintViewed:'yes'});
    window.dispatchEvent(new CustomEvent('quest90:question-help',{detail:draft}));
  }
  function markReviewed(){
    const fresh=get(id),lab=get(failureRecord(id)),v=designVersion(fresh);
    if(!ready||!v)return;
    if(patch(id,{reviewed:'yes',reviewVersion:v.id,reviewEvidence:fresh.fields.evidence,reviewSignature:reviewSignature(fresh,lab),reviewedAt:new Date().toISOString()}))notice('Self-review saved. Check your account save status.');
  }
  return <div className="dojo dojo-room">
    <div className="dojo-topbar"><button className="secondary" onClick={back}>← All Dojo cases</button><span className="mini-tag">{c.track} · {c.level}</span><span className="dojo-state">{reviewed?'Self-reviewed':version?'Design version saved':'Start your design'}</span></div>
    <section className="card dojo-case-heading"><span className="eyebrow">YOUR DESIGN CASE</span><h2>{c.title}</h2><p>{c.brief}</p>
      <div className="dojo-stage-progress"><progress value={done.filter(Boolean).length} max={4} aria-label="Case stages completed"/><small>{done.filter(Boolean).length}/4 stages recorded · self-directed practice</small></div>
    </section>
    <nav className="dojo-stages" aria-label="Case stages">{sections.map((s,i)=><button key={s} className="secondary" aria-current={section===s?'step':undefined} onClick={()=>choose(s)}><span aria-hidden="true">{done[i]?'✓':String(i+1).padStart(2,'0')}</span><strong>{s}</strong></button>)}</nav>
    <div className="dojo-room-body">
      {section==='Lesson'&&<div className="dojo-lesson-grid">
        <section className="card"><span className="eyebrow">01 · UNDERSTAND THE PROBLEM</span><h3>What you are designing</h3>
          <div className="dojo-io"><div><h4>Given</h4><p>{c.input}</p></div><div><h4>Expected behavior</h4><p>{c.output}</p></div></div>
          <h3>The core idea</h3><p>{c.concept}</p><h3>A decision to defend</h3><p>{c.tradeoff}</p>
          <h3>Components to consider</h3><div className="dojo-tags">{c.components.map(n=><code key={n}>{n}</code>)}</div>
          <details onToggle={e=>{if(e.currentTarget.open&&record.fields.hintViewed!=='yes')patch(id,{hintViewed:'yes'})}}><summary>A first hint</summary><p>{c.hint}</p></details>
          <div className="button-row"><button className="primary" onClick={()=>{if(patch(id,{lessonRead:'yes'}))choose('Workbench')}}>I understand the brief · start designing →</button></div>
        </section>
        <section className="card dojo-study-aside"><span className="eyebrow">INTERVIEW HABIT</span><h3>Ask before drawing</h3><ol><li>Who uses this, and what must they be able to do?</li><li>What must stay true when two operations overlap?</li><li>What load, latency and freshness assumptions are you making?</li><li>What happens when one dependency fails?</li></ol>
          <div className="dojo-failure-card"><h4>Failure to investigate</h4><p>{c.failure}</p></div>
          <details onToggle={e=>{if(e.currentTarget.open&&record.fields.referenceViewed!=='yes')patch(id,{referenceViewed:'yes'})}}><summary>Reveal one reference approach</summary><p>{c.solution}</p><h4>Labeled data flow</h4><ol className="dojo-flow">{c.flow.map((f,i)=><li key={i}>{f}</li>)}</ol><small>This is one possible approach. Explain alternatives against the stated requirements.</small></details>
        </section>
      </div>}
      {section==='Workbench'&&<DesignWorkbench key={id} challenge={c} recordId={id}/>}
      {section==='Failure lab'&&<FailureLab key={id} track={c.track} recordId={id}/>}
      {section==='Interview review'&&<div className="dojo-lesson-grid">
        <section className="card"><span className="eyebrow">04 · DEFEND YOUR DESIGN</span><h3>Evidence over confidence</h3><p>Walk through your case-specific failure: {c.failure}</p>
          {c.checks.map((text,i)=><label className="dojo-check" key={text}><input type="checkbox" checked={record.fields['check'+i]==='yes'} onChange={e=>patch(id,{['check'+i]:e.target.checked?'yes':'no',reviewed:'no'})}/>{text}</label>)}
          <DojoField id={id} name="evidence" label="Your evidence: one failure path, the outcome, and a trade-off" placeholder="Which assumption did you test? What does your design do when it fails?"/>
          <DojoField id={id} name="interview" label="Your two-minute interview answer" rows={6} placeholder="Requirement → design → request/data flow → failure → trade-off. State what you would measure next."/>
          <DojoField id={failureRecord(id)} ownerId={id} name="reflection" label="How does the track experiment relate to this case?"/>
          <div className="button-row"><button className="primary" disabled={!ready||reviewed} onClick={markReviewed}>{reviewed?'Self-review saved':'Mark self-reviewed'}</button><button className="secondary" onClick={()=>ask('review')}>Discuss with Gemini</button></div>
          <small>This records your own review, not an automated grade. Design, answer or evidence changes reopen the review.</small>
        </section>
        <section className="card dojo-study-aside"><h3>Before saving your review</h3><ul className="dojo-review-gates"><li>{done[1]?'✓':'○'} Save the current diagram as a design version.</li><li>{done[2]?'✓':'○'} Run a track failure experiment.</li><li>{checked===c.checks.length?'✓':'○'} Check each criterion ({checked}/{c.checks.length}).</li><li>{record.fields.evidence?.trim()?'✓':'○'} Explain evidence for your design.</li><li>{record.fields.interview?.trim()?'✓':'○'} Write an interview answer.</li><li>{experiment.fields.reflection?.trim()?'✓':'○'} Connect the experiment to this case.</li></ul>
          <h3>Interviewer follow-ups</h3><ol><li>Which assumption would change your design first?</li><li>How would you demonstrate this failure safely?</li><li>What would you measure before claiming the design is faster or reliable?</li></ol>
          <p>Help used: {record.fields.referenceViewed==='yes'?'reference approach revealed':record.fields.hintViewed==='yes'?'hint opened':'no recorded hints'}.</p>
          {record.fields.reviewed==='yes'&&!reviewed&&<p role="status">Your earlier review is retained. The current version has changed, so review it again.</p>}
          {c.track==='Algorithms'&&<a href="/playground/">Run JavaScript with tests in Module Playground →</a>}
          {c.track==='Database'&&<a href="/practice/?tool=sql">Try queries in the SQL playground →</a>}
        </section>
      </div>}
    </div>
    <section className="card dojo-support"><div><h3>Your tutor and your work</h3><p>Get a hint or discuss your reasoning using your existing Gemini tutor. AI feedback is separate from the saved self-review.</p></div>
      <div className="button-row"><button className="secondary" onClick={()=>ask('hint')}>Ask for a hint</button><button className="secondary" onClick={()=>saveFile('dojo-'+c.id+'.json',JSON.stringify({format:'quest90-dojo',version:1,challenge:c.id,design:record,experiment},null,2),'application/json')}>Export case + history</button></div><small role="status">{aiNote||'AI requests open as drafts; nothing is sent until you send it.'}</small>
    </section>
    <div className="dojo-bottom-nav"><button className="secondary" disabled={!previous} onClick={previous}>← Previous case</button>{section!=='Interview review'&&<button className="primary" onClick={()=>choose(sections[sections.indexOf(section)+1])}>Next: {sections[sections.indexOf(section)+1]} →</button>}<button className="secondary" disabled={!next} onClick={next}>Next case →</button></div>
  </div>;
}
