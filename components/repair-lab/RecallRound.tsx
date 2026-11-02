'use client';
import {useState} from 'react';
import {useStudio,Attempts} from '../studio/StudioContext';
import {useRouteQuery,updateRouteQuery} from '@/lib/workspace-location';
import {recallRecordId,recallSelection,recallSummary,recallAttempts,completedRecallDays,selectRecallSprint,type RecallQuestion} from '@/lib/repair-lab/recall';

export default function RecallRound(){
  const {p}=useStudio(),params=useRouteQuery();
  const completedOnly=params.get('scope')==='completed',available=recallSelection(p,completedOnly);
  const [sprint,setSprint]=useState<{ids:string[];starts:Record<string,number>}|null>(null);
  const questions=sprint?available.filter(q=>sprint.ids.includes(q.id)).sort((a,b)=>sprint.ids.indexOf(a.id)-sprint.ids.indexOf(b.id)):available;
  const active=questions.find(q=>q.id===params.get('question'))||questions[0];
  const index=active?questions.indexOf(active):0,summary=recallSummary(available,p.studio);
  function pick(id:string){updateRouteQuery({question:id})}
  function beginSprint(){const next=selectRecallSprint(available,p.studio);setSprint({ids:next.map(q=>q.id),starts:Object.fromEntries(next.map(q=>[q.id,recallAttempts(p.studio?.[recallRecordId(q.id)]).length]))});if(next[0])pick(next[0].id);}
  return <div className="repair-recall">
    <section className="repair-panel"><span className="repair-kicker">RETRIEVE BEFORE YOU REVIEW</span><h2>Your 20-day brainstorm</h2>
      <p>22 questions from the DSA assigned on days 1–20, including both problems on days 9 and 18. Start with a decision, then explain a dry run. No complete code solutions.</p>
      <p>{completedRecallDays(p).length}/20 days are marked complete in your saved account. The full revision path is available without changing course completion.</p>
      <div className="repair-actions"><label>Question scope<select value={completedOnly?'completed':'twenty'} onChange={e=>{setSprint(null);updateRouteQuery({scope:e.target.value==='completed'?'completed':null,question:null})}}><option value="twenty">Days 1–20 · requested revision</option><option value="completed">Only my completed days (within 1–20)</option></select></label><button className="secondary" disabled={!available.length} onClick={beginSprint}>Start a 5-question sprint</button>{sprint&&<button className="secondary" onClick={()=>setSprint(null)}>Show full path</button>}</div>
      <div className="repair-metrics"><span><strong>{summary.answered}/{summary.total}</strong> questions attempted</span><span><strong>{summary.firstCorrect}/{summary.answered||0}</strong> correct on first attempt</span><span><strong>{sprint?'5 or fewer':'20 days'}</strong> {sprint?'misses → unseen → oldest':'of course revision'}</span></div>
      <progress aria-label="Quiz questions attempted" value={summary.answered} max={summary.total||1}/>
      <small>Multiple-choice accuracy only. Written explanations are self-reviewed; this score is not an interview readiness grade.</small>
    </section>
    {!active?<section className="repair-panel"><h3>No completed days in this range yet</h3><p>You can still use the full days 1–20 revision path. Completing this quiz never marks a course day complete.</p><button className="primary" onClick={()=>updateRouteQuery({scope:null})}>Use the 20-day revision path</button></section>:<>
      <nav className="repair-question-map" aria-label="Revision questions">{questions.map(q=>{const done=recallSummary([q],p.studio).answered>0;return <button key={q.id} title={q.title} aria-current={active.id===q.id?'step':undefined} onClick={()=>pick(q.id)}><span>Day {q.day}</span><small>{q.title}</small>{done&&<span aria-label="Attempt recorded">✓</span>}</button>})}</nav>
      <RecallCard key={active.id} question={active}/>
      <div className="repair-pagination"><button className="secondary" disabled={index===0} onClick={()=>pick(questions[index-1].id)}>← Previous</button><span>Question {index+1} of {questions.length}{sprint?' · sprint':''}</span><button className="secondary" disabled={index===questions.length-1} onClick={()=>pick(questions[index+1].id)}>Next →</button></div>
      {sprint&&<p className="repair-feedback">{questions.filter(q=>recallAttempts(p.studio?.[recallRecordId(q.id)]).length>sprint.starts[q.id]).length}/{questions.length} new answers recorded in this sprint. For a previously answered question, choose “Try this question again”. Earlier scores remain in your history.</p>}
    </>}
  </div>;
}

function RecallCard({question:q}:{question:RecallQuestion}){
  const {get,patch,submit}=useStudio(),id=recallRecordId(q.id),record=get(id),fields=record.fields;
  const checked=fields.checked==='yes',choice=fields.choice===undefined?-1:Number(fields.choice);
  function check(){
    if(checked||!Number.isInteger(choice)||choice<0||choice>=q.choices.length)return;
    patch(id,{kind:'recall-choice',choice:String(choice),day:String(q.day),questionId:q.id,checked:'yes',correct:String(choice===q.answer)});
    if(!submit(id,choice===q.answer?'Correct decision':'Review this decision',fields.seenAnswer==='yes'?1:0))patch(id,{checked:'no'});
  }
  return <section className="repair-panel repair-quiz">
    <span className="repair-kicker">DAY {q.day} · {q.title}</span><h3>{q.prompt}</h3>
    <fieldset disabled={checked}><legend>Commit to one choice</legend>{q.choices.map((c,i)=><label className="repair-choice" key={c}><input type="radio" name={`choice-${q.id}`} checked={choice===i} onChange={()=>patch(id,{choice:String(i)})}/><span>{c}</span>{checked&&i===q.answer&&<strong>Correct</strong>}</label>)}</fieldset>
    <label className="repair-field">Why this choice? (optional, saved with your attempt)<textarea rows={3} maxLength={4000} value={fields.reasoning||''} onChange={e=>patch(id,{reasoning:e.target.value})} placeholder="My clue is… The tempting alternative fails because…"/></label>
    {!checked&&<button className="primary" disabled={choice<0} onClick={check}>Commit answer & reveal</button>}
    {checked&&<div className="repair-feedback" role="status"><strong>{choice===q.answer?'That decision fits the contract.':'A useful mistake to learn from.'}</strong><p>{q.explanation}</p><button className="secondary" onClick={()=>patch(id,{choice:'-1',checked:'no',seenAnswer:'yes',reasoning:''})}>Try this question again</button><small>Retries keep your original first-attempt score. Answer seen: future attempts are assisted recall.</small></div>}
    <div className="repair-dry-run"><h4>Draw it before coding</h4><p>{q.dryRun}</p><label className="repair-field">My dry run · state → action → next state<textarea rows={4} maxLength={5000} value={fields.dryRun||''} onChange={e=>patch(id,{dryRun:e.target.value})} placeholder="Step 0: …\nStep 1: …\nInvariant: …"/></label></div>
    {checked&&<><h4>Change the requirement</h4><p>{q.transfer}</p><label className="repair-field">My explanation and counterexample<textarea rows={3} maxLength={5000} value={fields.transfer||''} onChange={e=>patch(id,{transfer:e.target.value})}/></label><small>These notes save with your draft. They are not automatically graded.</small><div className="repair-actions"><a className="secondary" href={`/day/${q.day}/?tab=practice`}>Revisit Day {q.day}</a><a className="secondary" href={`/questions/?question=${q.id}`}>Open the full question</a><a className="secondary" href="/flows/">Draw a flowchart</a></div></>}
    <Attempts id={id}/>
  </section>;
}
