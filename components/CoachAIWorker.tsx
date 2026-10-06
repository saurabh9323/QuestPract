'use client';
import {useEffect,useRef,useState} from 'react';
import type {SupabaseClient} from '@supabase/supabase-js';
import type {Progress} from '@/lib/progress';
import {readCoachPack} from '@/lib/coach-contract';
type Owner={url:string;userId:string};
export default function CoachAIWorker({p,client,owner,publicKey,update}:{p:Progress;client:SupabaseClient|null;owner:Owner;publicKey:string;update:(id:string,fields:Record<string,string>,owner:Owner)=>void}){
 const active=useRef(false),mounted=useRef(true),controller=useRef<AbortController|null>(null),[cycle,setCycle]=useState(0);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;controller.current?.abort()}},[]);
 useEffect(()=>{
  if(active.current||!client)return;
  const entry=Object.entries(p.studio||{}).find(([id,r])=>id.startsWith('auto-pack-')&&r.fields.cloudStatus==='pending');
  if(!entry)return;const [id,r]=entry,pack=readCoachPack(r.fields.pack);
  if(!pack||!r.fields.requestId){update(id,{cloudStatus:'failed',cloudError:'The saved request could not be read. Choose Retry.'},owner);return}
  active.current=true;const abort=new AbortController();controller.current=abort;const timeout=setTimeout(()=>abort.abort(),75000);
  void (async()=>{
   try{
    const {data,error}=await client.auth.getSession();if(error||!data.session)throw new Error('Sign in again before generating AI feedback.');
    const response=await fetch(`${owner.url}/functions/v1/auto-coach`,{method:'POST',signal:abort.signal,headers:{'Content-Type':'application/json',apikey:publicKey,Authorization:`Bearer ${data.session.access_token}`},body:JSON.stringify({input:pack.input,lessonId:id,requestId:r.fields.requestId,research:r.fields.research==='yes'})});
    let result;try{result=await response.json()}catch{throw new Error('Deploy the auto-coach Edge Function and configure its allowed website origins first.')}
    if(!response.ok)throw new Error(typeof result.error==='string'?result.error:'AI feedback is unavailable. Your local lesson remains saved.');
    const ai=readCoachPack(JSON.stringify(result.pack));
    if(!ai||ai.mode!=='gemini'||ai.lesson.id!==id||JSON.stringify(ai.input)!==JSON.stringify(pack.input))throw new Error('The AI response did not match this submission.');
    if(mounted.current)update(id,{aiPack:JSON.stringify(ai),cloudStatus:'complete',cloudError:''},owner);
   }catch(e){if(mounted.current)update(id,{cloudStatus:'failed',cloudError:e instanceof Error?e.message.slice(0,1000):'AI request failed. Use the built-in lesson.'},owner)}
   finally{clearTimeout(timeout);active.current=false;if(mounted.current)setCycle(n=>n+1)}
  })();
 },[p,client,owner,publicKey,update,cycle]);
 return null;
}
