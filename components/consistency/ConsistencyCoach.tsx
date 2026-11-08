'use client';
import {useEffect,useRef,useState} from 'react';
import {useStudio} from '../studio/StudioContext';
import {consistencySettings,consistencySummary,dailyRecord} from '@/lib/consistency/logic';
import {quests} from '@/lib/curriculum';
import {navigateWorkspace} from '@/lib/workspace-location';
import '@/app/consistency.css';
export default function ConsistencyCoach(){
 const {p,get,patch,userKey}=useStudio();
 const [now,setNow]=useState<Date|null>(null),[note,setNote]=useState(''),[minutes,setMinutes]=useState('10'),[message,setMessage]=useState(''),[notify,setNotify]=useState(false);
 const sent=useRef(''),live=useRef({p,notify});live.current={p,notify};
 useEffect(()=>{setNow(new Date());const timer=setInterval(()=>setNow(new Date()),30000);return()=>clearInterval(timer)},[]);
 useEffect(()=>{try{setNotify(localStorage.getItem('quest90-consistency-'+userKey)==='yes')}catch{}},[userKey]);
 useEffect(()=>{if(!notify)return;const timer=setTimeout(()=>{
 const state=consistencySummary(live.current.p,new Date());
 if(live.current.p.studio?.[consistencySettings]?.fields.enabled!=='yes'||!live.current.notify||state.status!=='pending'||sent.current===state.today||!('Notification' in window)||Notification.permission!=='granted')return;
 const key='quest90-consistency-sent-'+userKey;
 try{if(localStorage.getItem(key)===state.today)return;localStorage.setItem(key,state.today)}catch{return}
 sent.current=state.today;
 try{const n=new Notification('Quest90 · your daily minimum is still pending',{body:'Take one small step today. Open Today to choose a short practice task.',tag:'quest90-daily-minimum'});n.onclick=()=>{window.focus();navigateWorkspace('/today/');n.close()};n.onerror=()=>setMessage('Browser could not display the reminder. Your in-app reminder remains available.')}catch{setMessage('Notifications are unavailable on this device. Use the in-app reminder.')}
 },10*60*1000);return()=>clearTimeout(timer)},[notify,userKey]);
 if(!now)return <section className="card"><p>Loading your daily commitment…</p></section>;
 const summary=consistencySummary(p,now),settings=get(consistencySettings).fields;
 const selected=[5,10,15].includes(Number(settings.minimum))?Number(settings.minimum):10;
 const target=summary.restart?5:selected;
 const next=quests.find(q=>!p.days[q.day]?.completedAt)||quests[89];
 function enable(){patch(consistencySettings,{started:settings.started||summary.today,minimum:String(selected),enabled:'yes'})}
 function save(status:'done'|'rest'){
 const n=Number(minutes);
 if(!note.trim()){setMessage(status==='rest'?'Add a short rest-day reason.':'Write what you practised first.');return}
 if(status==='done'&&(!Number.isInteger(n)||n<target||n>480)){setMessage('Enter actual minutes between '+target+' and 480.');return}
 if(patch(dailyRecord(summary.today),{status,note:note.trim().slice(0,2000),minutes:status==='done'?String(n):'0',target:String(target)})){setMessage(status==='done'?'Daily minimum recorded. This does not mark your course day complete.':'Rest day recorded. Tomorrow starts fresh.');setNote('')}
 }
 async function toggleNotifications(){
 if(notify){setNotify(false);try{localStorage.removeItem('quest90-consistency-'+userKey)}catch{}return}
 if(!('Notification' in window)||!window.isSecureContext){setMessage('Browser notifications are unavailable here. In-app reminders still work.');return}
 try{const result=await Notification.requestPermission();if(result!=='granted'){setMessage('Permission not granted. In-app reminders remain active.');return}localStorage.setItem('quest90-consistency-'+userKey,'yes');setNotify(true);setMessage('One reminder after about 10 minutes with Today open, if your minimum is still pending.')}catch{setMessage('Could not enable browser reminders. In-app reminders still work.')}
 }
 return <section className="card consistency-coach" aria-labelledby="consistency-heading">
 <span className="eyebrow">DAILY COMMITMENT · ANY TIME TODAY · INDIA TIME</span>
 <h2 id="consistency-heading">{settings.enabled!=='yes'?'Make showing up easier':summary.status==='done'?'You showed up today':summary.status==='rest'?'Rest today. Restart tomorrow.':'Today’s minimum is still pending'}</h2>
 <p>No fixed study time. Do one small practice session before the day ends, then record what you did.</p>
 {settings.enabled!=='yes'?<><p>Start with 10 minutes. A missed day triggers a 5-minute restart, without adding yesterday’s workload.</p><button className="primary" onClick={enable}>Start my daily commitment</button></>:<>
 <div className="consistency-week" aria-label="Last seven days">{summary.days.map(d=><div key={d.day} className={'consistency-'+d.status}><span>{d.day.slice(5)}</span><strong>{d.status==='done'?'Done':d.status==='rest'?'Rest':d.status==='before'?'—':d.day===summary.today?'Today':'Missed'}</strong></div>)}</div>
 <p>{summary.done} days recorded in this seven-day window · {summary.missed} missed. Rest is separate from practice; these are self-reported commitments.</p>
 {summary.status==='pending'&&<div className="consistency-action"><h3>{summary.restart?'Restart gently: 5 minutes today':target+' minutes is enough to start'}</h3><p><strong>Do this:</strong> Open Day {next.day}, “{next.title}”. Pick one unfinished item, write a small attempt, then explain one thing you learned.</p><div className="button-row"><button className="primary" onClick={()=>navigateWorkspace('/day/'+next.day+'/')}>Open my next task</button><button className="secondary" onClick={()=>navigateWorkspace('/oop/?mode=basics')}>Low-energy option: one basic concept</button></div><p>You can return here to log practice from another module too. Completing the minimum does not clear your backlog.</p></div>}
 {summary.status!=='pending'&&<p>{get(dailyRecord(summary.today)).fields.note}</p>}
 <details open={summary.status==='pending'}><summary>{summary.status==='pending'?'Record today’s practice or planned rest':'Correct today’s record'}</summary>
 <label>What did you practise, or why are you resting?<textarea rows={3} maxLength={2000} value={note} onChange={e=>setNote(e.target.value)} placeholder="I traced Two Sum with a Map and explained why lookup comes before insertion."/></label>
 <label>Actual practice minutes<input type="number" min={target} max={480} value={minutes} onChange={e=>setMinutes(e.target.value)}/></label>
 <div className="button-row"><button className="primary" onClick={()=>save('done')}>Record my daily minimum</button><button className="secondary" onClick={()=>save('rest')}>Record planned rest</button></div></details>
 <details><summary>Commitment and reminder settings</summary><label>Normal daily minimum<select value={selected} onChange={e=>patch(consistencySettings,{minimum:e.target.value})}>{[5,10,15].map(n=><option key={n} value={n}>{n} minutes</option>)}</select></label>
 <button className="secondary" aria-pressed={notify} onClick={()=>void toggleNotifications()}>{notify?'Turn off browser reminders':'Enable browser reminders on this device'}</button>
 <p>Optional desktop notifications: at most one per India calendar day on this device, after about 10 minutes with Today open. Browser sleep can delay them. Closed-tab push and email are not configured. On unsupported devices, the in-app card remains your reminder.</p>
 <button className="text-btn" onClick={()=>{patch(consistencySettings,{enabled:'no'});setNotify(false);try{localStorage.removeItem('quest90-consistency-'+userKey)}catch{}}}>Pause my commitment</button></details></>}
 <p role="status">{message}</p><small>Saved with your account progress; use the sync indicator to confirm the save. No task is completed automatically.</small>
 </section>;
}
