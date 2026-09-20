"use client";
import {useCallback,useEffect,useRef,useState} from 'react';
import type {SupabaseClient,User} from '@supabase/supabase-js';
import {freshProgress,type Progress,validateProgress} from './progress';
import {CONFIG_KEY,GUEST_KEY,type Connection,connect,readCloud,writeCloud,readCloudHistory} from './storage';
import {localGet,saveCheckpoint} from './local-db';
import {accountKey,hasWork,mergeProgress,type LocalCheckpoint,type RecoveryCopy} from './recovery';

const DEFAULT_CONNECTION:Connection={url:process.env.NEXT_PUBLIC_SUPABASE_URL||'https://xavuhmunsmiknusfskwr.supabase.co',key:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||'sb_publishable_szXgHTFOwnAIhCdemtwhDg_Ewpj4yX-'};
export function useTraining(){
 const [progress,setProgress]=useState<Progress>(freshProgress),[ready,setReady]=useState(false),[dataReady,setDataReady]=useState(false),[user,setUser]=useState<User|null>(null),[config,setConfig]=useState<Connection|null>(null),[sync,setSync]=useState('Checking your account…'),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[recoveries,setRecoveries]=useState<RecoveryCopy[]>([]),[recoveryNote,setRecoveryNote]=useState('');
 const current=useRef(progress),client=useRef<SupabaseClient|null>(null),identity=useRef<User|null>(null),revision=useRef(0),pending=useRef<Progress|null>(null),saving=useRef(false),blocked=useRef(false),loaded=useRef(false),generation=useRef(0),cacheKey=useRef(''),timer=useRef<ReturnType<typeof setTimeout>|null>(null),localQueue=useRef<Promise<void>>(Promise.resolve());
 const show=useCallback((p:Progress)=>{current.current=p;setProgress(p)},[]);
 const cache=useCallback((key:string,p:Progress,rev:number,isPending:boolean,archive=false)=>{
  const copy:LocalCheckpoint={progress:p,revision:rev,pending:isPending,savedAt:new Date().toISOString()};
  const write=localQueue.current.then(()=>saveCheckpoint(key,copy,archive));
  localQueue.current=write.catch(()=>{setNotice('A local recovery copy could not be stored. Keep the tab open until Supabase confirms your save.');});
  return localQueue.current;
 },[]);
 const drain=useCallback(async()=>{
  if(saving.current||blocked.current||!pending.current||!loaded.current)return;
  saving.current=true;const gen=generation.current,c=client.current,key=cacheKey.current;
  try{
   while(pending.current&&gen===generation.current){
    const p=pending.current;pending.current=null;validateProgress(p);
    await localQueue.current;if(gen!==generation.current)break;
    if(c&&identity.current){
     setSync('Saving to Supabase…');const next=await writeCloud(c,p,revision.current);
     if(gen!==generation.current)break;revision.current=next;
     // A response for an earlier edit must not overwrite newer typing.
     if(!pending.current){await cache(key,p,next,false);setSync(pending.current?'Changes pending…':'Saved to Supabase');}
     else await cache(key,pending.current,next,true);
    }else throw new Error('Sign in before saving account progress.');
   }
  }catch(e){if(gen===generation.current){blocked.current=true;pending.current=current.current;setError(e instanceof Error?e.message:'Progress could not be saved.');setSync('Not synced · check recovery copies before leaving');}}
  finally{saving.current=false;if(gen!==generation.current&&pending.current&&loaded.current&&!blocked.current)timer.current=setTimeout(()=>void drain(),0);}
 },[cache]);
 const commit=useCallback((p:Progress)=>{
  if(!loaded.current||!identity.current){setNotice('Wait for your account progress to load before editing.');return;}
  try{validateProgress(p);}catch(e){setError(e instanceof Error?e.message:'Invalid progress.');return;}
  show(p);pending.current=p;void cache(cacheKey.current,p,revision.current,true);
  setSync('Changes pending · saving recovery copy…');if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>void drain(),600);
 },[show,cache,drain]);
 const guest=useCallback(async()=>{const stored=await localGet<Progress>('progress');if(stored)return validateProgress(stored);const raw=localStorage.getItem(GUEST_KEY);return raw?validateProgress(JSON.parse(raw)):freshProgress();},[]);
 useEffect(()=>{try{const raw=localStorage.getItem(CONFIG_KEY);setConfig(raw?JSON.parse(raw):DEFAULT_CONNECTION);}catch{setConfig(DEFAULT_CONNECTION);}setReady(true);},[]);
 useEffect(()=>{
  if(!ready||!config)return;
  let cancelled=false,loadingId:string|undefined,authEventSeen=false;
  let subscription:{unsubscribe:()=>void}|undefined;
  try{
   const c=connect(config);client.current=c;
   const apply=async(u:User|null)=>{
    if(cancelled)return;const id=u?.id||'signed-out';
    if(loadingId===id||(identity.current?.id===u?.id&&loaded.current))return;
    loadingId=id;const gen=++generation.current;
    loaded.current=false;setDataReady(false);setBusy(true);setError('');setRecoveries([]);setRecoveryNote('');blocked.current=false;pending.current=null;
    if(timer.current)clearTimeout(timer.current);
    identity.current=u;setUser(u);show(freshProgress());
    try{
     if(!u){cacheKey.current='';revision.current=0;setSync('Sign in to load your course');return;}
     const key=accountKey(config.url,u.id);cacheKey.current=key;setSync('Loading saved course…');await localQueue.current;
     let saved:LocalCheckpoint|undefined;
     try{saved=await localGet<LocalCheckpoint>(key);if(saved)validateProgress(saved.progress);}catch{setRecoveryNote('A local recovery copy is unreadable; the cloud record will be loaded.');saved=undefined;}
     const row=await readCloud(c,u.id);if(cancelled||gen!==generation.current)return;
     revision.current=row?.revision||0;const p=row?.progress||freshProgress();show(p);loaded.current=true;setDataReady(true);
     {
      if(saved&&hasWork(saved.progress)&&JSON.stringify(saved.progress)!==JSON.stringify(p)){
       setRecoveries([{id:'device-current',label:saved.pending?'Unsynced work from this account':'Previous copy from this account',savedAt:saved.savedAt,progress:saved.progress}]);
       if(saved.pending||!row)setRecoveryNote('A different local copy is available in My profile → Recovery copies. It has not replaced your cloud progress.');
      }
      setSync(row?'Saved to Supabase':'No saved course for this account yet');
      if(row&&!saved?.pending)await cache(key,p,row.revision,false,true);
     }
    }catch(e){if(!cancelled&&gen===generation.current){setError(e instanceof Error?e.message:'Unable to load cloud progress.');setSync('Could not load saved data · editing paused');blocked.current=true;}}
    finally{if(!cancelled&&gen===generation.current){setBusy(false);loadingId=undefined;}}
   };
   subscription=c.auth.onAuthStateChange((event,session)=>{if(['INITIAL_SESSION','SIGNED_IN','SIGNED_OUT'].includes(event)){authEventSeen=true;setTimeout(()=>void apply(session?.user||null),0);}}).data.subscription;
   void c.auth.getSession().then(({data,error:e})=>{if(cancelled||authEventSeen)return;if(e){setError(e.message);setSync('Unable to load your sign-in session');return;}void apply(data.session?.user||null);});
  }catch(e){setError(e instanceof Error?e.message:'Invalid Supabase settings.');}
  return()=>{cancelled=true;generation.current++;loaded.current=false;if(timer.current)clearTimeout(timer.current);subscription?.unsubscribe();};
 },[config,ready,show,cache,drain]);
 useEffect(()=>{const leave=(e:BeforeUnloadEvent)=>{if(pending.current||saving.current){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',leave);return()=>window.removeEventListener('beforeunload',leave);},[]);
 useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(''),6000);return()=>clearTimeout(t)},[notice]);
 const refreshRecovery=async()=>{
  if(!identity.current||!client.current)return;const gen=generation.current,key=cacheKey.current;await localQueue.current;
  const copies:RecoveryCopy[]=[];let message='';
  try{const latest=await localGet<LocalCheckpoint>(key),history=await localGet<LocalCheckpoint[]>(key+':history');for(const [i,item] of [latest,...history||[]].entries()){if(item)copies.push({id:`device-${i}`,label:i?'Earlier device checkpoint':'Latest device checkpoint',savedAt:item.savedAt,progress:validateProgress(item.progress)});}}catch{message='Local recovery storage is unavailable. ';}
  try{copies.push(...await readCloudHistory(client.current,identity.current.id));}catch{message+='Cloud history is not available until the account-safety SQL migration is applied.';}
  if(gen!==generation.current)return;setRecoveries(copies);setRecoveryNote(message||'Recovery copies never replace your course automatically. Export or merge only the copy you need.');
 };
 const restoreRecovery=async(copy:RecoveryCopy)=>{if(!loaded.current)throw new Error('Load your cloud progress before merging a recovery copy.');const gen=generation.current;await cache(cacheKey.current,current.current,revision.current,!!pending.current,true);if(gen!==generation.current)throw new Error('The signed-in account changed. Reload recovery copies for this account.');commit(mergeProgress(current.current,copy.progress));setNotice('Recovery copy merged. Wait for Saved to Supabase.');};
 const requireClient=()=>{if(!client.current)throw new Error('Supabase is not connected.');return client.current;};
 const configure=async(c:Connection)=>{if(pending.current||saving.current)throw new Error('Wait for your changes to save before changing the connection.');const {validConnection}=await import('./storage');const valid=validConnection(c);localStorage.setItem(CONFIG_KEY,JSON.stringify(valid));setConfig(valid);setNotice('Connection saved. Sign in to load the account for this project.');};
 const signIn=async(email:string)=>{const {error:e}=await requireClient().auth.signInWithOtp({email,options:{emailRedirectTo:window.location.origin+'/'}});if(e)throw e;setNotice('Check your email for the sign-in link.');};
 const signUpPassword=async(email:string,password:string)=>{if(password.length<8)throw new Error('Use at least 8 characters for your password.');const {error:e}=await requireClient().auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+'/'}});if(e)throw e;setNotice('Account created. Confirm your email if requested, then sign in.');};
 const signInPassword=async(email:string,password:string)=>{if(pending.current||saving.current)throw new Error('Wait for your progress to save first.');const {error:e}=await requireClient().auth.signInWithPassword({email,password});if(e)throw e;};
 const signOut=async()=>{if(pending.current||saving.current)throw new Error('Unsaved work remains. Retry saving or export it before signing out.');const {error:e}=await requireClient().auth.signOut();if(e)throw e;};
 const reload=async()=>{
  if(!client.current||!identity.current)return;if(saving.current)throw new Error('A save is still in progress. Wait before reloading.');
  setBusy(true);const gen=generation.current;if(timer.current)clearTimeout(timer.current);
  try{if(loaded.current)await cache(cacheKey.current,current.current,revision.current,!!pending.current,true);const row=await readCloud(client.current,identity.current.id);if(gen!==generation.current)return;if(!row)throw new Error('No cloud record was found. Your displayed work has been kept; nothing was reset.');revision.current=row.revision;pending.current=null;blocked.current=false;loaded.current=true;setDataReady(true);setError('');show(row.progress);await cache(cacheKey.current,row.progress,row.revision,false,true);setSync('Saved to Supabase');}
  catch(e){if(gen===generation.current)setError(e instanceof Error?e.message:'Load failed.');}finally{if(gen===generation.current)setBusy(false);}
 };
 const retry=()=>{blocked.current=false;setError('');if(!loaded.current)setConfig(c=>c?{...c}:c);else void drain();};
 return {progress,commit,ready,dataReady,user,config,sync,error,notice,setNotice,busy,configure,signIn,signUpPassword,signInPassword,signOut,retry,reload,client:client.current,recoveries,recoveryNote,refreshRecovery,restoreRecovery,importGuest:async()=>{try{const old=await guest();if(!hasWork(old)){setNotice('No previous guest work exists in this browser.');return;}commit(mergeProgress(current.current,old));}catch(e){setNotice(e instanceof Error?e.message:'Guest progress could not be imported.');}}};
}
