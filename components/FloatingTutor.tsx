'use client';
import {useEffect,useRef,useState} from 'react';
import {Bot,Send,X,Maximize2,Minimize2,Sparkles,Copy,MessageCircle,ArrowDown} from 'lucide-react';
import {useStudio,copyText} from './studio/StudioContext';
import {createLocalPack,coachKey,readCoachPack} from '@/lib/auto-coach';
import {useWorkspaceLocation} from '@/lib/workspace-location';
import {questionBank} from '@/lib/bank';
import CartoonPlayer from './CartoonPlayer';

const actions=[['Explain simply','Explain this topic as if I am learning it for the first time. Use a everyday analogy, then a small code example.'],['Hint only','Give me one small hint about this topic. Do not reveal the full solution.'],['Quiz me','Ask me one interview question about this topic. Wait for my answer before explaining.'],['Show a story','Explain this topic as a short visual story with a step-by-step code example.'],['Check my reasoning','Help me check my reasoning about this topic. First ask me to explain my approach.']] as const;
export default function FloatingTutor({title,context,sync}:{title:string;context:string;sync:string}){
 const {p,get,patch,notice}=useStudio(),location=useWorkspaceLocation();
 const url=new URL(location,'https://quest90.local'),question=questionBank.find(q=>q.id===url.searchParams.get('question'));
 const topic=question?.title||title,detail=question?.prompt||context;
 const topicPath=url.pathname+['question','lesson','pack'].filter(k=>url.searchParams.has(k)).map(k=>`|${k}=${url.searchParams.get(k)}`).join('');
 const thread='tutor-'+coachKey({source:topicPath,attemptId:'thread'}).slice(10);
 const [open,setOpen]=useState(false),[wide,setWide]=useState(false),[error,setError]=useState('');
 const launcher=useRef<HTMLButtonElement>(null),input=useRef<HTMLTextAreaElement>(null),bottom=useRef<HTMLDivElement>(null),guard=useRef(false);
 const turns=Object.entries(p.studio||{}).filter(([,r])=>r.fields.chatParent===thread).sort((a,b)=>a[1].fields.chatAt.localeCompare(b[1].fields.chatAt));
 const pending=turns.some(([,r])=>r.fields.cloudStatus==='pending'),draft=get(thread).fields.draft||'';
 const close=()=>{setOpen(false);requestAnimationFrame(()=>launcher.current?.focus());};
 useEffect(()=>{if(open)input.current?.focus();},[open,thread]);
 useEffect(()=>{if(!open)return;const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);requestAnimationFrame(()=>launcher.current?.focus());}};window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape)},[open]);
 function send(){
  if(guard.current||pending||!draft.trim())return;setError('');
  if(turns.length>=40||Object.keys(p.studio||{}).length>=1850){setError('This topic has reached its conversation limit. Copy the discussion before continuing on another topic.');return;}
  guard.current=true;
  try{const at=new Date().toISOString(),token=crypto.randomUUID();
   const previous=turns.filter(([,r])=>readCoachPack(r.fields.aiPack)).slice(-3).map(([,r])=>`Learner: ${r.fields.chatQuestion}\nTutor: ${readCoachPack(r.fields.aiPack)!.observations.join('\n')}`).join('\n\n').slice(-2000);
   const pack=createLocalPack({source:'topic-chat',attemptId:token,at,title:topic.slice(0,300),topic:topic.slice(0,300),question:`Page context: ${detail}\nPage: ${url.pathname}\nHave a learning conversation. Answer the learner's latest message directly; respect requests for only a hint or one question.`.slice(0,2000),answer:draft.trim().slice(0,4000),previous,confidence:'Conversational follow-up; answer the learner directly.'});
   const raw=JSON.stringify(pack);if(!readCoachPack(raw))throw new Error('This topic could not be prepared. Try a shorter question.');
   patch(pack.lesson.id,{pack:raw,chatParent:thread,chatAt:at,chatQuestion:draft.trim().slice(0,4000),cloudStatus:'pending',requestId:crypto.randomUUID(),cloudError:'',research:'no',tutorTitle:topic.slice(0,300)});
   patch(thread,{draft:''});setTimeout(()=>bottom.current?.scrollIntoView({block:'nearest',behavior:'instant'}),100);
  }catch(e){setError(e instanceof Error?e.message:'Unable to send. Your draft is retained.');}finally{guard.current=false;}
 }
 return <div className="floating-tutor">
  {!open&&<button ref={launcher} className="tutor-launcher" onClick={()=>setOpen(true)} aria-expanded={open} aria-controls="global-tutor-panel"><span className="tutor-avatar"><Bot size={25}/></span><span><strong>Ask your tutor</strong><small>Gemini · learn together</small></span><Sparkles size={16}/></button>}
  {open&&<section id="global-tutor-panel" className={`tutor-panel ${wide?'tutor-wide':''}`} role="region" aria-label="Gemini learning tutor"><header className="tutor-header"><span className="tutor-avatar"><Bot size={27}/></span><div><strong>Your learning companion</strong><small>Powered by your Gemini connection</small></div><button onClick={()=>setWide(!wide)} aria-label={wide?'Compact chat':'Expand chat'}>{wide?<Minimize2 size={18}/>:<Maximize2 size={18}/>}</button><button onClick={close} aria-label="Close tutor"><X size={20}/></button></header>
   <div className="tutor-context"><span>HELPING WITH</span><strong>{topic}</strong><small>Topic context + up to 3 previous replies (2,000 characters). Other answers are not sent automatically.</small></div>
   <div className="tutor-scroll"><div className="tutor-welcome"><MessageCircle size={22}/><h3>Let’s make it click.</h3><p>Ask, try an example, then ask again. Your conversation stays with this topic when you return.</p></div>
    {turns.map(([id,r])=>{const ai=readCoachPack(r.fields.aiPack);return <article className="tutor-turn" key={id}><div className="tutor-human"><small>YOU</small><p>{r.fields.chatQuestion}</p></div><div className="tutor-reply"><small>GEMINI TUTOR</small>{ai?<>{ai.observations.map((s,i)=><p key={i}>{s}</p>)}<button className="tutor-copy" onClick={()=>copyText(ai.observations.join('\n\n'),notice)}><Copy size={13}/>Copy reply</button><details><summary>Example & visual story</summary><CartoonPlayer lesson={ai.lesson}/></details><details><summary>Practice this idea</summary><p>{ai.challenge}</p><p>Hint: {ai.hint}</p></details></>:r.fields.cloudStatus==='pending'?<p role="status" className="tutor-thinking"><span aria-hidden="true">● ● ●</span> Thinking through your question…</p>:<div role="alert"><p>{r.fields.cloudError||'No reply received. Your question is saved.'}</p><button disabled={pending} onClick={()=>patch(id,{cloudStatus:'pending',requestId:crypto.randomUUID(),cloudError:''})}>Retry this message</button></div>}</div></article>})}<div ref={bottom}/></div>
   <div className="tutor-compose"><div className="tutor-prompts">{actions.map(([label,text])=><button key={label} disabled={pending} onClick={()=>{patch(thread,{draft:text});input.current?.focus();}}>{label}</button>)}</div><label htmlFor="floating-tutor-input">Your question or answer</label><textarea id="floating-tutor-input" ref={input} rows={3} maxLength={4000} value={draft} onChange={e=>patch(thread,{draft:e.target.value})} onKeyDown={e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();send();}}} placeholder="Why does it work? Show me another example…"/><div className="tutor-send-row"><button onClick={()=>bottom.current?.scrollIntoView({block:'nearest',behavior:'instant'})} aria-label="Jump to latest message"><ArrowDown size={17}/></button><button disabled={!turns.length} onClick={()=>copyText(turns.map(([,r])=>`You: ${r.fields.chatQuestion}\nTutor: ${readCoachPack(r.fields.aiPack)?.observations.join('\n')||'(No reply)'}`).join('\n\n'),notice)}><Copy size={14}/>Chat</button><button className="tutor-send" onClick={send} disabled={pending||!draft.trim()||turns.length>=40}><Send size={15}/>{pending?'Waiting…':'Send'}</button></div>{error&&<p role="alert">{error}</p>}<small className="tutor-disclosure">{turns.length}/40 messages · {sync}<br/>Uses your existing Gemini quota. AI can make mistakes. Free-tier messages may be used by Google to improve products.</small></div>
  </section>}
 </div>;
}
