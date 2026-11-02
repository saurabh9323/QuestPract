'use client';
import {useEffect,useState} from 'react';
import type {Progress} from '@/lib/progress';
import {revisionDay,revisionDays,REVISION_SETTINGS,revisionEntries,revisionPack} from '@/lib/repair-lab/adaptive';

type Owner={url:string;userId:string};
export default function LoginRevisionCheck({p,ready,owner,prepare}:{p:Progress;ready:boolean;owner:Owner;prepare:(owner:Owner)=>void}){
  const [day,setDay]=useState(revisionDay);
  const signature=revisionDays(p,day).join(','),enabled=p.studio?.[REVISION_SETTINGS]?.fields.enabled!=='no';
  useEffect(()=>{
    const refresh=()=>setDay(revisionDay());
    const timer=setInterval(refresh,60000);window.addEventListener('focus',refresh);
    return()=>{clearInterval(timer);window.removeEventListener('focus',refresh)};
  },[]);
  useEffect(()=>{if(ready&&enabled)prepare(owner)},[ready,enabled,signature,day,owner.url,owner.userId,prepare]);
  return null;
}

export function LoginRevisionBanner({p}:{p:Progress}){
  const days=revisionDays(p),entries=revisionEntries(p),pending=entries.filter(([,r])=>r.fields.cloudStatus==='pending').length;
  const eligible=entries.filter(([,r])=>days.includes(Number(r.fields.targetDay))),ready=eligible.filter(([id,r])=>revisionPack(id,r)).length;
  const paused=p.studio?.[REVISION_SETTINGS]?.fields.enabled==='no';
  return <section className="repair-login-banner" aria-label="Personal revision from completed days"><div><small>YOUR PROGRESS → YOUR NEXT QUESTIONS</small><strong>{days.length} completed course {days.length===1?'day':'days'}</strong><p>{paused?'Automatic Gemini revision is paused.':pending?`Gemini is preparing your revision · ${pending} question${pending===1?'':'s'} queued.`:ready?`${ready} saved AI question${ready===1?'':'s'} from topics you have completed.`:days.length?'Your personal revision is available in Repair & Recall.':'Complete a course day to unlock progress-based Gemini questions.'}</p></div><a className="primary" href="/repair-lab/?mode=personal">Open my questions →</a></section>;
}
