'use client';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {createRadarClient} from '@/lib/radar/api';
import {topOpportunities,deadlineCountdown,checklistFor} from '@/lib/radar/logic';
import type {Opportunity,TrackingStatus} from '@/lib/radar/types';
import {acknowledgeRadarTracking,ensureRadarCapacity,radarRecordId,radarTrackingFields,readRadarTracking,trackingStatuses,type RadarTracking} from '@/lib/radar/tracking';
import {useStudio} from '../studio/StudioContext';
import '@/app/radar.css';

const labels:Record<TrackingStatus,string>={new:'New',interested:'Interested',registered:'Registered',building:'Building',submitted:'Submitted',skipped:'Skipped'};
const timing={'register-team':'T−7 days','scope-mvp':'T−5 days','repo-stack':'T−3 days','demo-video':'Last 6 hours',readme:'Last 6 hours',submit:'Last 6 hours'};
const base=process.env.NEXT_PUBLIC_RADAR_API_URL||'';
export default function HackathonRadar(){
  const {p,get,patch}=useStudio();
  const client=useMemo(()=>createRadarClient(base),[]);
  const namespace=client.mode==='mock'?'mock':base.trim().replace(/\/+$/,'');
  const [items,setItems]=useState<Opportunity[]|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const [online,setOnline]=useState(true),[now,setNow]=useState<Date|null>(null),[refresh,setRefresh]=useState(0);
  const [messages,setMessages]=useState<Record<string,string>>({}),[busy,setBusy]=useState<string[]>([]);
  const requests=useRef(new Map<string,AbortController>()),mounted=useRef(false),progress=useRef(p);progress.current=p;
  useEffect(()=>{
    mounted.current=true;
    const network=()=>setOnline(navigator.onLine);
    network();setNow(new Date());
    const clock=setInterval(()=>setNow(new Date()),60000);
    window.addEventListener('online',network);window.addEventListener('offline',network);
    return()=>{mounted.current=false;clearInterval(clock);window.removeEventListener('online',network);window.removeEventListener('offline',network);requests.current.forEach(c=>c.abort());requests.current.clear()};
  },[]);
  useEffect(()=>{
    if(!online&&client.mode==='live'){setLoading(false);return}
    const controller=new AbortController();setLoading(true);setError('');
    client.listOpportunities({signal:controller.signal}).then(data=>{
      if(!controller.signal.aborted)setItems(data);
    }).catch(e=>{
      if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Opportunities could not be loaded. Try again.');
    }).finally(()=>{if(!controller.signal.aborted)setLoading(false)});
    return()=>controller.abort();
  },[client,online,refresh]);

  const message=useCallback((key:string,value:string)=>setMessages(old=>({...old,[key]:value})),[]);
  function read(id:string){
    const key=radarRecordId(namespace,id);
    return {key,entry:readRadarTracking(get(key).fields,namespace,id)};
  }
  function save(op:Opportunity,change:Partial<Pick<RadarTracking,'status'|'notes'|'checked'>>,remoteChange:boolean){
    let key='';
    try{
      const state=read(op.id);key=state.key;
      ensureRadarCapacity(progress.current.studio||{},key);
      const revision=remoteChange?crypto.randomUUID():state.entry?.revision||crypto.randomUUID();
      const fields=radarTrackingFields(get(key).fields,namespace,op.id,change,revision,remoteChange?true:undefined);
      if(!patch(key,fields)){message(key,'Tracking could not be saved. Check the account save message.');return null}
      message(key,remoteChange?'Saved in progress; waiting to send to '+(client.mode==='mock'?'the demo adapter.':'the Radar API.'):'Checklist updated in progress.');
      return readRadarTracking(fields,namespace,op.id);
    }catch(e){if(key)message(key,e instanceof Error?e.message:'Tracking could not be saved.');return null}
  }
  async function send(entry:RadarTracking){
    const key=radarRecordId(namespace,entry.id);
    if(requests.current.has(key))return;
    if(!online&&client.mode==='live'){message(key,'Offline. Your tracking remains in progress; use Retry Radar sync when connected.');return}
    const controller=new AbortController();requests.current.set(key,controller);setBusy(old=>[...old,key]);
    try{
      const result=await client.updateTracking(entry.id,{status:entry.status,notes:entry.notes},{signal:controller.signal});
      if(!mounted.current||controller.signal.aborted)return;
      const fields=acknowledgeRadarTracking(get(key).fields,namespace,entry.id,entry.revision,result);
      if(!fields){message(key,'A newer edit is saved. Send your latest changes when ready.');return}
      if(patch(key,fields))message(key,client.mode==='mock'?'Demo adapter updated. Check the account save status for your progress.':'Radar API updated. Check the account save status for your progress.');
      else message(key,'Radar API replied, but progress could not save the confirmation. Retry is available.');
    }catch(e){if(mounted.current&&!controller.signal.aborted)message(key,(e instanceof Error?e.message:'Radar update failed.')+' Your change remains in progress; retry when ready.')}
    finally{requests.current.delete(key);if(mounted.current)setBusy(old=>old.filter(k=>k!==key))}
  }
  const top=topOpportunities(items||[]);
  return <section className="card hackathon-radar" aria-labelledby="radar-heading">
    <div className="radar-heading"><div><span className="eyebrow">BUILD OUTSIDE THE CLASSROOM</span><h2 id="radar-heading">Hackathon Radar</h2><p>Your top five opportunities by feed fit score. Choose one and turn preparation into a plan.</p></div><span className="mini-tag">{client.mode==='mock'?'Demo data':'External feed'}</span></div>
    {client.mode==='mock'&&<p className="radar-info">Sample opportunities with fixed example dates, not live listings. Links open the source platforms so you can find real events while your live feed is being connected.</p>}
    <p className="radar-small">Tracking is your own record. Marking “Registered” does not register you on another website. Fit scores come from the feed, not an AI assessment.</p>
    {!online&&<p className="radar-notice" role="status">You’re offline. {client.mode==='mock'?'The local demo still works.':'Previously loaded opportunities remain visible; API updates can be retried when connected.'} Account progress sync follows the save indicator above.</p>}
    {error&&<p className="radar-notice" role="alert">{error} {items?'Showing the last successful feed from this session.':'Your saved tracking has not been removed.'}</p>}
    <div className="radar-toolbar"><button className="secondary" disabled={loading||(!online&&client.mode==='live')} onClick={()=>setRefresh(n=>n+1)}>{loading?'Loading opportunities…':error?'Retry feed':'Refresh feed'}</button><small>{items?top.length+' shown · '+items.length+' in feed':'No feed loaded yet'}</small></div>
    {loading&&!items&&<p role="status">Finding opportunities…</p>}
    {!loading&&items?.length===0&&<p>No opportunities are available in this feed yet. Check again later.</p>}
    {!loading&&!items&&!error&&!online&&<p>Connect to the internet to load the Radar feed.</p>}
    <div className="radar-list">{top.map(op=>{
      let entry:RadarTracking|null=null,key='',recordError='';
      try{const saved=read(op.id);entry=saved.entry;key=saved.key}catch(e){recordError=e instanceof Error?e.message:'Saved tracking is unreadable.'}
      const status=entry?.status||'new',waiting=busy.includes(key),countdown=now?deadlineCountdown(op.registrationDeadline,now):null;
      const checklist=now&&status==='interested'?checklistFor(op.registrationDeadline,now):[];
      return <article className="radar-opportunity" key={op.id}>
        <div className="radar-opportunity-top"><span className="radar-source">{op.source} · {op.mode}{op.location?' · '+op.location:''}</span><strong className="radar-fit">{op.fitScore}/100 fit</strong></div>
        <h3><a href={op.url} target="_blank" rel="noopener noreferrer">{op.title}<span aria-hidden="true"> ↗</span><span className="radar-sr"> (opens in a new tab)</span></a></h3>
        <div className="radar-meta"><span className={'radar-countdown '+(countdown?.status||'')}>{countdown?.label||'Checking deadline…'}</span>{op.prize&&<span>Prize: {op.prize}</span>}</div>
        {op.registrationDeadline&&<small>Registration deadline: {new Date(op.registrationDeadline).toLocaleString()}</small>}
        {(op.startsAt||op.endsAt)&&<small>Event: {op.startsAt?new Date(op.startsAt).toLocaleString():'Start not supplied'}{op.endsAt?' → '+new Date(op.endsAt).toLocaleString():''}</small>}
        <div className="radar-tags">{op.tags.map(tag=><span key={tag}>{tag}</span>)}</div>
        {recordError?<p role="alert" className="radar-notice">{recordError} Use Settings → Export progress to keep a backup.</p>:<>
          <div className="radar-statuses" role="group" aria-label={'Tracking status for '+op.title}>{trackingStatuses.map(s=><button className="secondary" key={s} disabled={waiting} aria-pressed={status===s} onClick={()=>{const saved=save(op,{status:s},true);if(saved)void send(saved)}}>{labels[s]}</button>)}</div>
          {status==='interested'&&<div className="radar-checklist"><h4>Your deadline plan</h4><p>Rule-based plan anchored to the registration deadline. Confirm the separate project-submission cutoff on the event page.</p>
            {checklist.length?<ul>{checklist.map(task=><li key={task.id}><label><input type="checkbox" checked={entry?.checked.includes(task.id)||false} onChange={e=>{const current=read(op.id).entry?.checked||[];save(op,{checked:e.target.checked?[...new Set([...current,task.id])]:current.filter(t=>t!==task.id)},false)}}/><span><strong>{timing[task.id]} · {task.label}</strong><small>{new Date(task.at).toLocaleString()} · {task.status==='closed'?'Deadline passed':task.status==='due'?'Due now':'Upcoming'}</small></span></label></li>)}</ul>:<p>A valid registration deadline is needed to schedule this checklist.</p>}
          </div>}
          <details className="radar-notes"><summary>Notes & API sync{entry?.pending?' · pending changes':''}</summary><label>Notes for {op.title}<textarea rows={3} maxLength={1000} value={entry?.notes||''} onChange={e=>save(op,{notes:e.target.value},true)} placeholder="Team idea, project scope, or what you want to learn…"/></label><small>{entry?.notes.length||0}/1000 · Notes save in progress as you type. Send them to update the Radar API.</small>
            <button className="secondary" disabled={waiting||(!online&&client.mode==='live')||!entry?.pending} onClick={()=>{const latest=read(op.id).entry;if(latest)void send(latest)}}>{waiting?'Sending…':client.mode==='mock'?'Update demo tracking':'Retry / send Radar changes'}</button>
          </details>
          {entry?.pending&&<p className="radar-pending">Tracking change pending {client.mode==='mock'?'demo':'Radar API'} sync.</p>}
          {messages[key]&&<p className="radar-small" role="status">{messages[key]}</p>}
        </>}
      </article>;
    })}</div>
  </section>;
}
