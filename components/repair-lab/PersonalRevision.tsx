'use client';
import {useState} from 'react';
import {useStudio,Attempts} from '../studio/StudioContext';
import {REVISION_SETTINGS,revisionStatus,revisionPack,duplicateRevision,revisionDay} from '@/lib/repair-lab/adaptive';
import type {CoachPack} from '@/lib/auto-coach';
import type {StudioRecord} from '@/lib/studio-state';
import {coachErrorMessage} from '@/lib/coach-errors';

export default function PersonalRevision(){
  const {p,get,patch}=useStudio(),status=revisionStatus(p),enabled=get(REVISION_SETTINGS).fields.enabled!=='no';
  const [history,setHistory]=useState(false),[page,setPage]=useState(0);
  const sorted=[...status.entries].sort((a,b)=>b[1].fields.revisionDay.localeCompare(a[1].fields.revisionDay)||b[1].updatedAt.localeCompare(a[1].updatedAt)||a[0].localeCompare(b[0]));
  const eligible=sorted.filter(([,r])=>status.days.includes(Number(r.fields.targetDay)));
  const currentBatch=status.existing.length?status.id:eligible[0]?.[1].fields.revisionBatch;
  const visible=history?sorted:eligible.filter(([,r])=>r.fields.revisionBatch===currentBatch);
  const pages=Math.max(1,Math.ceil(visible.length/6)),current=Math.min(page,pages-1);
  const pending=status.entries.some(([,r])=>r.fields.cloudStatus==='pending');
  return <div className="repair-recall">
    <section className="repair-panel"><span className="repair-kicker">AI · BASED ON YOUR SAVED COURSE</span><h2>Your next questions, shaped by your progress</h2>
      <p>You have {status.days.length} completed course days. Every login checks this saved progress after your account loads. Up to three questions mix DSA recall and a course concept, with earlier quiz mistakes prioritized when available.</p>
      <details><summary>Which days and data are used?</summary><p>Completed days: {status.days.join(', ')||'none yet'}. Partial work does not count as a completed day.</p><p>Gemini receives the completed day numbers, the chosen topic and its authored question contract, a selection reason and a few previous question titles to avoid. Your private notes, source code, email and full chat history are not sent for this feature. Free-tier Gemini data may be used to improve Google products.</p><p>Checks run while you use the portal. Same day + same completed days reuses the existing set. A changed completion set can create a second set that day; additional changes wait until tomorrow. Existing server quotas also apply. No new completion is recorded by reading or answering these questions.</p></details>
      <button className="secondary" aria-pressed={enabled} onClick={()=>patch(REVISION_SETTINGS,{enabled:enabled?'no':'yes'})}>{enabled?'Pause automatic questions':'Enable automatic questions'}</button><small>Pausing stops new sets. Already queued requests may finish.</small>
      {status.reason==='daily-limit'&&<p role="status">Today’s two automatic sets are already prepared. Your updated progress will be used for the next day’s set; previous questions stay available.</p>}
      {status.reason==='storage-limit'&&<p role="status">The saved revision shelf is full. Existing questions and local quizzes remain available; no old work is deleted automatically.</p>}
      {!status.days.length&&<p>Complete a course day to start automatic revision. You can use the 20-day brainstorm now without marking any day complete.</p>}
      <div className="repair-actions"><button className="secondary" aria-pressed={!history} onClick={()=>{setHistory(false);setPage(0)}}>Latest set</button><button className="secondary" aria-pressed={history} onClick={()=>{setHistory(true);setPage(0)}}>All saved sets · {status.entries.length} questions</button><a className="secondary" href="/repair-lab/?mode=recall">Use the built-in quiz</a></div>
    </section>
    {!visible.length&&<section className="repair-panel"><p>{enabled&&status.days.length?'Preparing your first set after account load. If generation is unavailable, the built-in quiz remains ready.':'No personal questions yet. Enable automatic questions after completing a course day.'}</p></section>}
    {visible.slice(current*6,current*6+6).map(([id,r])=>{
      const pack=revisionPack(id,r),duplicate=pack&&duplicateRevision(id,pack,status.entries);
      const expired=r.fields.cloudStatus==='pending'&&Date.now()-Date.parse(r.updatedAt)>120000;
      return <section className="repair-panel" key={id}><span className="repair-kicker">AI · {r.fields.revisionDay} · {r.fields.targetKind} · DAY {r.fields.targetDay}</span><h3>{r.fields.targetTitle}</h3><p>{r.fields.selectionReason} · generated for {r.fields.completedCount} completed days</p>
        {r.fields.contextTrimmed==='true'&&<p>Context trimmed to keep the request small.</p>}
        {!status.days.includes(Number(r.fields.targetDay))&&<p>This course day is no longer marked complete. This is a saved historical question.</p>}
        {pack&&!duplicate?<PersonalQuestion key={r.fields.requestId} id={id} pack={pack} record={r}/>:<p role="status">{duplicate?'This question repeats an earlier saved question, so it is hidden. Use the original in All saved sets.':r.fields.cloudStatus==='pending'?'Your question is queued or Gemini is generating it…':r.fields.cloudStatus==='complete'?'Gemini returned an invalid question. Your work is safe; retry to request a valid one.':coachErrorMessage(new Error(r.fields.cloudError||'Generation did not complete. You can retry or use the built-in quiz.'))}</p>}
        {(!pack||duplicate)&&r.fields.cloudStatus!=='pending'&&<button className="secondary" disabled={pending} onClick={()=>patch(id,{cloudStatus:'pending',cloudError:'',requestId:crypto.randomUUID()})}>Retry with Gemini</button>}
        {expired&&<p>Still waiting? Keep this tab open for the queue, or reload the portal to resume a request interrupted when you left. Your saved answers are unchanged.</p>}
      </section>;
    })}
    {history&&<div className="repair-pagination"><button className="secondary" disabled={current===0} onClick={()=>setPage(current-1)}>Previous</button><span>Page {current+1} of {pages}</span><button className="secondary" disabled={current===pages-1} onClick={()=>setPage(current+1)}>Next</button></div>}
  </div>;
}

function PersonalQuestion({id,pack,record}:{id:string;pack:CoachPack;record:StudioRecord}){
  const {get,patch,submit}=useStudio(),answerId=`revision-answer-${id.slice(10)}-${record.fields.requestId.slice(0,36).replaceAll('-','')}`;
  const response=get(answerId),f=response.fields,quiz=pack.lesson.quiz,checked=f.checked==='yes',choice=Number(f.choice??-1);
  function answer(){
    if(checked||!Number.isInteger(choice)||choice<0||choice>=quiz.choices.length)return;
    patch(answerId,{kind:'ai-revision-answer',question:quiz.question,choices:JSON.stringify(quiz.choices),aiAnswer:String(quiz.answer),aiExplanation:quiz.why,choice:String(choice),checked:'yes',day:record.fields.targetDay,source:id,answeredDay:revisionDay()});
    if(!submit(answerId,choice===quiz.answer?'Matches AI answer · not verified':'Differs from AI answer · review suggested',f.hint==='yes'?1:0))patch(answerId,{checked:'no'});
  }
  return <div className="repair-quiz"><p><strong>AI-generated question and answer key · not verified by executable tests</strong></p><h3>{quiz.question}</h3>
    <fieldset disabled={checked}><legend>Choose your answer before seeing the explanation</legend>{quiz.choices.map((text,i)=><label className="repair-choice" key={i}><input type="radio" name={answerId} checked={choice===i} onChange={()=>patch(answerId,{choice:String(i)})}/><span>{text}</span></label>)}</fieldset>
    <label className="repair-field">My reasoning<textarea rows={3} maxLength={4000} value={f.reasoning||''} onChange={e=>patch(answerId,{reasoning:e.target.value})} placeholder="I chose this because… My dry run is…"/></label>
    {!checked&&<div className="repair-actions"><button className="primary" disabled={choice<0} onClick={answer}>Save answer & compare</button><button className="secondary" onClick={()=>patch(answerId,{hint:'yes'})}>Show AI hint</button></div>}
    {f.hint==='yes'&&<p className="repair-feedback"><strong>AI hint:</strong> {pack.hint}</p>}
    {checked&&<div className="repair-feedback"><strong>{choice===quiz.answer?'Your choice matches the AI answer key.':'Your choice differs from the AI answer key.'}</strong><p>Suggested answer: {quiz.choices[quiz.answer]}</p><p>{quiz.why}</p><p>The model can be wrong. Explain a counterexample or flag a concern before relying on this answer.</p><label className="repair-field">My correction or concern<textarea rows={3} maxLength={4000} value={f.correction||''} onChange={e=>patch(answerId,{correction:e.target.value})}/></label></div>}
    {checked&&<details><summary>AI follow-up · take the idea further</summary><p>{pack.challenge}</p><label className="repair-field">My follow-up answer<textarea rows={4} maxLength={4000} value={f.followup||''} onChange={e=>patch(answerId,{followup:e.target.value})}/></label><p>Saved for your review; no automatic correctness score is assigned to written answers.</p></details>}
    <Attempts id={answerId}/>
  </div>;
}
