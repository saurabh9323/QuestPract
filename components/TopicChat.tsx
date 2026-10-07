'use client';
import {useRef} from 'react';
import {readCoachPack, type CoachPack} from '@/lib/coach-contract';
import {useStudio,copyText} from './studio/StudioContext';

/** Each turn is an independent, recoverable coach job; no secrets live here. */
export default function TopicChat({id,pack}:{id:string;pack:CoachPack}){
 const {p,get,patch,notice}=useStudio(),guard=useRef(false);
 const thread=`chat-${id}`,draft=get(thread).fields.draft||'';
 const turns=Object.entries(p.studio||{}).filter(([,r])=>r.fields.chatParent===id).sort((a,b)=>a[1].fields.chatAt.localeCompare(b[1].fields.chatAt));
 const pending=turns.some(([,r])=>r.fields.cloudStatus==='pending');
 function send(){
  if(guard.current||pending||!draft.trim())return;
  if(turns.length>=40||Object.keys(p.studio||{}).length>=1850){notice('Conversation limit reached. Copy this discussion before starting another lesson.');return}
  guard.current=true;
  try{
   const at=new Date().toISOString(),token=crypto.randomUUID().replaceAll('-',''),turnId=`auto-pack-${token.slice(0,16)}-${token.slice(16)}`;
   const history=turns.slice(-3).map(([,r])=>{const ai=readCoachPack(r.fields.aiPack);return `Learner: ${r.fields.chatQuestion}\nTutor: ${ai?.observations.join('\n')||'(No reply received)'}`}).join('\n\n').slice(-2000);
   const next:CoachPack={...pack,input:{source:'topic-chat',attemptId:token,at,title:pack.input.title,topic:pack.input.topic,question:`Topic: ${pack.input.topic}\nOriginal question: ${pack.input.question}`.slice(0,2000),answer:draft.trim().slice(0,4000),previous:history||((readCoachPack(get(id).fields.aiPack)||pack).observations.join('\n').slice(-2000)),confidence:'Conversational follow-up; answer the learner directly.'},lesson:{...pack.lesson,id:turnId},createdAt:at,mode:'local'};
   patch(turnId,{pack:JSON.stringify(next),chatParent:id,chatAt:at,chatQuestion:draft.trim().slice(0,4000),cloudStatus:'pending',requestId:crypto.randomUUID(),cloudError:'',research:'no'});
   patch(thread,{draft:''});
  }finally{guard.current=false}
 }
 return <section className="card" aria-label="Topic tutor conversation"><span className="eyebrow">ASK → UNDERSTAND → ASK AGAIN</span><h3>Talk about {pack.input.topic}</h3><p>Ask a question, challenge an explanation, or send your answer for feedback. Your discussion stays with this lesson. The tutor receives the topic and up to the last three exchanges (2,000 characters).</p><p className="muted">Messages go to Gemini using your existing connection and daily quota. Avoid private work code. AI explanations can be wrong.</p>
 <div aria-live="polite" aria-relevant="additions text">{turns.map(([key,r])=>{const ai=readCoachPack(r.fields.aiPack);return <article className="card" key={key}><strong>You</strong><p style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{r.fields.chatQuestion}</p><strong>Tutor</strong>{ai?<>{ai.observations.map((line,i)=><p key={i} style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{line}</p>)}<details><summary>Try a follow-up exercise</summary><p>{ai.challenge}</p><p>{ai.hint}</p></details></>:r.fields.cloudStatus==='pending'?<p role="status">Thinking…</p>:<><p role="alert">{r.fields.cloudError||'No reply received.'}</p><button className="secondary" disabled={pending} onClick={()=>patch(key,{cloudStatus:'pending',requestId:crypto.randomUUID(),cloudError:''})}>Retry this message</button></>}</article>})}</div>
 <div className="actions">{['Explain this with a simple example.','Why use this approach instead of another?','Ask me one question and wait for my answer.'].map(q=><button className="secondary" key={q} disabled={pending} onClick={()=>patch(thread,{draft:q})}>{q}</button>)}</div>
 <label className="studio-field">Your question or answer<textarea rows={4} maxLength={4000} value={draft} onChange={e=>patch(thread,{draft:e.target.value})} placeholder="For example: Why does this work? Show me with different input."/></label>
 <button className="primary" disabled={pending||!draft.trim()||turns.length>=40} onClick={send}>{pending?'Waiting for tutor…':'Send message'}</button>{turns.length>0&&<button className="secondary" onClick={()=>copyText(turns.map(([,r])=>`You: ${r.fields.chatQuestion}\nTutor: ${readCoachPack(r.fields.aiPack)?.observations.join('\n')||'(No reply)'}`).join('\n\n'),notice)}>Copy conversation</button>}<p className="muted">{turns.length}/40 messages · Follow the account save indicator above for sync status.</p></section>;
}
