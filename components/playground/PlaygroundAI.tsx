'use client';
import {useState} from 'react';
import {useStudio} from '@/components/studio/StudioContext';
import {createLocalPack,readCoachPack} from '@/lib/auto-coach';
import {buildPlaygroundContext,citationParts,tutorInstruction} from '@/lib/playground/ai';
import type {LabModule,LabRun} from '@/lib/playground/types';

export default function PlaygroundAI({module,run,code,step,runId,onStep,onHelp}:{module:LabModule;run:LabRun|null;code:string;step:number;runId:string;onStep:(n:number)=>void;onHelp:(level:number)=>void}){
  const {p,get,patch}=useStudio(),[error,setError]=useState('');
  const thread=`playground-chat-${module.id}`,memory=get(thread).fields.memory||'';
  const context=buildPlaygroundContext({moduleId:module.id,code,trace:run?.trace||[],step,tests:run?.tests||[],pinned:memory});
  const turns=Object.entries(p.studio||{}).filter(([,r])=>r.fields.chatParent===thread).sort((a,b)=>a[1].fields.chatAt.localeCompare(b[1].fields.chatAt));
  const pending=turns.some(([,r])=>r.fields.cloudStatus==='pending');
  function ask(level:number|null){
    if(pending)return;
    if(turns.length>=30||Object.keys(p.studio||{}).length>=1850){setError('This module has reached its AI history limit. Existing work is still available.');return;}
    try{
      const task=level===null?'Explain the selected step in 2–4 sentences, no solution.':`Give hint level ${level}: ${['','nudge','concept','pseudocode','near-solution'][level]}.`;
      const at=new Date().toISOString(),pack=createLocalPack({source:'topic-chat',attemptId:crypto.randomUUID(),at,title:`Playground · ${module.title}`,topic:module.title,question:tutorInstruction(level),answer:`${task} Cite only supplied [step N] references.\nContext data:\n${context.text}`,previous:'',confidence:'AI explanation only. Engine test results remain authoritative.'});
      if(!readCoachPack(JSON.stringify(pack)))throw new Error('Unable to prepare AI context.');
      onHelp(level??0);
      patch(pack.lesson.id,{pack:JSON.stringify(pack),chatParent:thread,chatAt:at,chatQuestion:level===null?`Explain step ${step}`:`Hint level ${level}`,cloudStatus:'pending',requestId:crypto.randomUUID(),research:'no',cloudError:'',playgroundRun:runId,stepIds:JSON.stringify(context.steps),contextTrimmed:String(context.trimmed)});
      patch(thread,{title:`Playground · ${module.title}`,context:module.goal});
      setError('');
    }catch(e){setError(e instanceof Error?e.message:'Unable to request help.')}
  }
  return <section className="pg-ai">
    <span className="pg-badge">AI · optional Gemini tutor</span><h3>Understand the trace</h3>
    <p>The engine records execution and checks tests. AI only explains and hints. Your code and the preview below are sent through the existing server-side Gemini connection.</p>
    <button disabled={pending||!run?.trace.length} onClick={()=>ask(null)}>Explain this step</button>
    <div className="pg-hints">{['Nudge','Concept','Pseudocode','Near-solution'].map((name,i)=><button key={name} disabled={pending} onClick={()=>ask(i+1)}>AI hint {i+1} · {name}</button>)}</div>
    <details><summary>Context preview {context.trimmed?'· context trimmed':''}</summary><pre>{context.text}</pre><p>Only this bounded excerpt is sent; previous chat turns and the full trace are excluded.</p></details>
    <label>Pinned context (250 characters)<textarea maxLength={250} value={memory} onChange={e=>patch(thread,{memory:e.target.value})}/></label>
    {error&&<p role="alert">{error}</p>}
    <div aria-live="polite">{turns.map(([id,r])=>{
      const ai=readCoachPack(r.fields.aiPack);
      let steps:number[]=[];try{steps=JSON.parse(r.fields.stepIds||'[]')}catch{/* Old histories have no citations. */}
      const current=r.fields.playgroundRun===runId;
      return <article className="pg-ai-turn" key={id}><strong>AI · {r.fields.chatQuestion}</strong>{r.fields.contextTrimmed==='true'&&<small>Context trimmed</small>}
        {ai?ai.observations.map((text,i)=><p key={i}>{citationParts(text,steps).map((part,j)=>part.step===undefined?<span key={j}>{part.text}</span>:part.valid&&current&&run?.trace[part.step]?<button className="pg-citation" key={j} onClick={()=>onStep(part.step!)}>{part.text}</button>:<span key={j} title="This citation cannot be linked to the current trace.">{part.text} <small>({part.valid?'previous run':'invalid citation'})</small></span>)}</p>):r.fields.cloudStatus==='pending'?<p role="status">Waiting for Gemini… You can keep using the lab.</p>:<><p role="alert">{r.fields.cloudError==='Failed to fetch'?'Could not reach the AI function. Check your connection and whether this website origin is allowed by the Supabase function. Your code, trace and tests remain available.':r.fields.cloudError||'No valid AI reply received.'}</p><button disabled={pending} onClick={()=>patch(id,{cloudStatus:'pending',requestId:crypto.randomUUID(),cloudError:''})}>Retry AI request</button></>}
      </article>;
    })}</div>
  </section>;
}
