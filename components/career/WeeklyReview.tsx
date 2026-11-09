'use client';
import {useEffect,useState} from 'react';
import {useStudio} from '../studio/StudioContext';
import {careerDraftId} from '@/lib/career/logic';
import {reviewWeek,type ReviewEvidence,type ReviewSummary} from '@/lib/career/review';
import {useRouteQuery,updateRouteQuery} from '@/lib/workspace-location';
import ReviewHistory from './ReviewHistory';

const metrics={dsaSolved:'DSA problems marked solved',openSourceMoved:'Open-source items moved',openSourceMerged:'Open-source items merged',hackathonsProgressed:'Hackathons progressed',questsCompleted:'Quests completed'};
const prompts={shipped:'What shipped?',stuck:"What's stuck?",priority:'What will I drop or do next week (pick ONE priority)?'};

export function ReviewEvidenceList({evidence}:{evidence:ReviewEvidence}){
 return <div className="career-review-evidence">{Object.entries(metrics).map(([key,label])=>{
  const items=evidence[key as keyof ReviewEvidence];
  return <details key={key}><summary><strong>{items.length}</strong> {label}</summary>{items.length?<ol>{items.map(item=><li key={item.id}><span>{item.title}</span><time dateTime={item.at}>{new Date(item.at).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})} IST</time></li>)}</ol>:<p>No dated activity in this period.</p>}</details>;
 })}</div>;
}

function ReviewForm({summary}:{summary:ReviewSummary}){
 const {p,get,patch}=useStudio(),id=careerDraftId(summary.start),fields=get(id).fields;
 const [message,setMessage]=useState('');
 const reviews=Object.entries(p.studio||{}).filter(([key])=>key.startsWith('career-review-'));
 const draftCount=Object.keys(p.studio||{}).filter(key=>key.startsWith('career-draft-')).length;
 const full=!p.studio?.[id]&&draftCount>=104;
 function change(name:string,value:string){
  if(patch(id,{schemaVersion:'1',weekStart:summary.start,[name]:value}))setMessage('Draft updated. Check the account sync indicator.');
  else setMessage('Draft could not be saved. Check the account notice before leaving.');
 }
 function save(){
  const responses={shipped:fields.shipped?.trim()||'',stuck:fields.stuck?.trim()||'',priority:fields.priority?.trim()||''};
  if(Object.values(responses).some(value=>!value)){setMessage('Answer all three prompts. “Nothing yet” is fine.');return}
  if(reviews.length>=104){setMessage('104 review snapshots saved. Export your history; existing reviews remain unchanged.');return}
  // The date picker selects a calendar week, even if midnight passed while typing.
  const at=new Date();
  const current=reviewWeek(p,at,0),previous=reviewWeek(p,at,-1);
  const selected=[current,previous].find(week=>week.summary.start===summary.start);
  if(!selected){setMessage('This week is no longer in the review window. Your saved draft is preserved. Choose a week again.');return}
  if(patch('career-review-'+crypto.randomUUID(),{schemaVersion:'1',createdAt:at.toISOString(),summary:JSON.stringify(selected.summary),...responses})){
   setMessage('Immutable snapshot saved. Your draft stays available for follow-up edits; saved snapshots cannot be changed. Check the account sync indicator.');
  }else setMessage('Snapshot could not be saved. Your draft is preserved. Check the account notice.');
 }
 return <div className="career-review-form">
  <p>Drafts save as you type for this week. Only <strong>Save weekly snapshot</strong> creates a read-only review.</p>
  {full&&<p role="alert">104 weekly drafts stored. Existing drafts remain available; a new draft cannot be saved.</p>}
  {Object.entries(prompts).map(([name,label])=><label key={name}>{label}<textarea rows={3} maxLength={2000} value={fields[name]||''} disabled={full} onChange={e=>change(name,e.target.value)}/><small>{(fields[name]||'').length}/2,000 characters</small></label>)}
  <button className="primary" onClick={save} disabled={full||reviews.length>=104}>Save weekly snapshot</button>
  <p role="status">{message}</p>
 </div>;
}

export default function WeeklyReview(){
 const {p}=useStudio(),query=useRouteQuery(),previous=query.get('week')==='previous';
 const [now,setNow]=useState<Date|null>(null);
 useEffect(()=>{setNow(new Date());const timer=setInterval(()=>setNow(new Date()),60000);return()=>clearInterval(timer)},[]);
 const reviews=Object.entries(p.studio||{}).filter(([id])=>id.startsWith('career-review-')).sort((a,b)=>b[1].fields.createdAt.localeCompare(a[1].fields.createdAt)||a[0].localeCompare(b[0]));
 if(!now)return <section><h3>Weekly review</h3><p>Loading the review period…</p></section>;
 const {summary,evidence}=reviewWeek(p,now,previous?-1:0);
 return <section className="career-weekly-review"><span className="eyebrow">REFLECT · CHOOSE ONE NEXT STEP</span><h3>Weekly review · Sunday ritual, available any day</h3>
  <label className="career-review-period">Review period<select value={previous?'previous':'current'} onChange={e=>updateRouteQuery({week:e.target.value==='previous'?'previous':null})}><option value="current">This week · so far</option><option value="previous">Last week · Monday to Sunday</option></select></label>
  <p>{summary.start} – {summary.end} · India time{previous?' · last completed week':' · through now'}</p>
  <p>Open a count to see its saved activity. Merged items also appear under moved items; these counts are not added together.</p>
  <ReviewEvidenceList evidence={evidence}/>
  <small>Counts use dated saved records and count each item once per category. These are your records, not external verification. Older career changes without dated history are not inferred.</small>
  <ReviewForm key={summary.start} summary={summary}/>
  <ReviewHistory reviews={reviews}/>
 </section>;
}
