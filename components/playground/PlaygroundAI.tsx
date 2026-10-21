'use client';
import {useState} from 'react';
import AIEvidenceText from '../learning/AIEvidenceText';
import {useStudio} from '@/components/studio/StudioContext';
import {readCoachPack} from '@/lib/auto-coach';
import {prepareLearningRequest,aiFailure} from '@/lib/learning/gemini';
import {buildPlaygroundContext,tutorInstruction} from '@/lib/playground/ai';
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
      const request=prepareLearningRequest({title:`Playground · ${module.title}`,instruction:tutorInstruction(level),context:{...context,scope:{steps:context.steps}},thread,requestId:crypto.randomUUID(),at:new Date().toISOString()});
      onHelp(level??0);
      patch(request.id,{...request.fields,chatQuestion:level===null?`Explain step ${step}`:`Hint level ${level}`,playgroundRun:runId,stepIds:JSON.stringify(context.steps)});
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
      let steps:number[]=[];try{const parsed:unknown=JSON.parse(r.fields.stepIds||'[]');if(Array.isArray(parsed))steps=parsed.filter((n):n is number=>typeof n==='number'&&Number.isInteger(n)&&n>=0&&n<5000)}catch{/* Old histories have no citations. */}
      const current=r.fields.playgroundRun===runId;
      return <article className="pg-ai-turn" key={id}><strong>AI · {r.fields.chatQuestion}</strong>{r.fields.contextTrimmed==='true'&&<small>Context trimmed</small>}
        {ai?ai.observations.map((text,i)=><AIEvidenceText key={i} text={text} scope={{steps:current?steps.filter(n=>!!run?.trace[n]):[]}} onSelect={(_,id)=>onStep(Number(id))}/>):r.fields.cloudStatus==='pending'?<p role="status">Waiting for Gemini… You can keep using the lab.</p>:<><p role="alert">{aiFailure(r.fields.cloudError)}</p><button disabled={pending} onClick={()=>patch(id,{cloudStatus:'pending',requestId:crypto.randomUUID(),cloudError:''})}>Retry AI request</button></>}
      </article>;
    })}</div>
  </section>;
}
