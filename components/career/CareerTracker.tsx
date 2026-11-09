'use client';
import ContributionDetails from './ContributionDetails';
import {contributionList,statusLabels} from '@/lib/career/list';
import {useRouteQuery,updateRouteQuery,routePage} from '@/lib/workspace-location';
import ReviewHistory from './ReviewHistory';
import {useState,useEffect} from 'react';
import {useStudio} from '../studio/StudioContext';
import {appendEvent,careerItems,careerSettings,limits,osStatuses,staleOpenSource,weekSummary,wipWarning} from '@/lib/career/logic';
export function CareerSettings(){
 const {get,patch,p}=useStudio(),current=limits(p.studio);
 return <section><h3>Career Tracker WIP settings</h3><p>Soft limits help you finish what you start. You can override each warning.</p>{(['opensource','hackathon'] as const).map(kind=><label key={kind} style={{display:'grid',gap:8,margin:'12px 0'}}>{kind==='opensource'?'Active open-source items':'Active hackathons'}<select value={current[kind]} onChange={e=>patch(careerSettings,{...get(careerSettings).fields,[kind]:e.target.value})}>{Array.from({length:21},(_,n)=><option key={n} value={n}>{n}</option>)}</select></label>)}</section>;
}
export function WeeklyReview(){
 const {p,patch}=useStudio(),[now,setNow]=useState<Date|null>(null),[shipped,setShipped]=useState(''),[stuck,setStuck]=useState(''),[priority,setPriority]=useState(''),[message,setMessage]=useState('');
 useEffect(()=>{setNow(new Date());const t=setInterval(()=>setNow(new Date()),60000);return()=>clearInterval(t)},[]);
 const reviews=Object.entries(p.studio||{}).filter(([id])=>id.startsWith('career-review-')).sort((a,b)=>b[1].updatedAt.localeCompare(a[1].updatedAt));
 if(!now)return null;
 const summary=weekSummary(p,now);
 function save(){
 if(!shipped.trim()||!stuck.trim()||!priority.trim()){setMessage('Answer all three prompts. “Nothing yet” is fine.');return}
 if(reviews.length>=104){setMessage('104 review snapshots saved. Export your history; existing reviews remain unchanged.');return}
 const at=new Date(),s=weekSummary(p,at);
 if(patch('career-review-'+crypto.randomUUID(),{schemaVersion:'1',createdAt:at.toISOString(),summary:JSON.stringify(s),shipped:shipped.trim(),stuck:stuck.trim(),priority:priority.trim()})){setShipped('');setStuck('');setPriority('');setMessage('Immutable snapshot saved. Check the account sync indicator.')}
 }
 return <section><h3>Weekly review · Sunday ritual, available any day</h3><p>{summary.start} – {summary.end} · India time · through now</p><ul><li>{summary.dsaSolved} DSA problems marked solved</li><li>{summary.openSourceMoved} open-source items moved, including {summary.openSourceMerged} merged</li><li>{summary.hackathonsProgressed} hackathons progressed</li><li>{summary.questsCompleted} quests completed</li></ul><small>Counts use dated saved records. Items count once per category. Historical career changes before tracking was added are not inferred.</small>
 {[['What shipped?',shipped,setShipped],["What's stuck?",stuck,setStuck],['What will I drop or do next week (pick ONE priority)?',priority,setPriority]].map(([label,value,set])=><label key={label as string} style={{display:'grid',gap:8,margin:'16px 0'}}>{label as string}<textarea maxLength={2000} rows={3} value={value as string} onChange={e=>(set as (v:string)=>void)(e.target.value)}/></label>)}
 <button className="primary" onClick={save}>Save weekly snapshot</button><p role="status">{message}</p>
 <ReviewHistory reviews={reviews}/></section>;
}
export default function CareerTracker({showReview=true}:{showReview?:boolean}){
 const {p,get,patch}=useStudio(),[title,setTitle]=useState(''),[status,setStatus]=useState<string>('new'),[message,setMessage]=useState(''),[pending,setPending]=useState<{id:string;fields:Record<string,string>}|null>(null),[now,setNow]=useState<Date|null>(null);
 useEffect(()=>{setNow(new Date());const timer=setInterval(()=>setNow(new Date()),60000);return()=>clearInterval(timer)},[]);
 function save(id:string,fields:Record<string,string>,override=false){
 const check=wipWarning(p.studio||{},'opensource',id,fields.status,new Date());
 if(check.exceeded&&!override){setPending({id,fields});setMessage('This would make '+check.projected+' active open-source items; your limit is '+check.limit+'. Finish or drop something, or override below.');return}
 try{const previous=get(id).fields;if(patch(id,{...fields,schemaVersion:'1',careerHistory:appendEvent(previous,fields.status,new Date())})){setPending(null);if(!previous.title)setTitle('');setMessage(override?'Saved with your WIP override.':'Career item saved.');setNow(new Date())}}catch(e){setMessage(e instanceof Error?e.message:'Could not save')}
 }
 const items=careerItems(p.studio,'opensource');
 const query=useRouteQuery(),search=query.get('q')||'',filter=osStatuses.some(s=>s===query.get('status'))?query.get('status')!:'all',stale=query.get('stale')==='1';
 const list=contributionList(p.studio||{},{query:search,status:filter,stale,page:routePage(query.get('page'))},now||new Date(0));
 return <section className="card"><span className="eyebrow">CAREER TRACKER · FINISH BEFORE STARTING MORE</span><h2>Open-source contributions</h2><p>Use the Hackathons section for Radar tracking. Status updates are your own records, not GitHub or event registrations.</p>
 <details><summary>Settings · work-in-progress limits</summary><CareerSettings/></details>
 <label style={{display:'grid',gap:8}}>Open-source issue or contribution<input maxLength={200} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Repository / issue title"/></label><label>Initial status<select value={status} onChange={e=>setStatus(e.target.value)}>{osStatuses.map(s=><option key={s} value={s}>{statusLabels[s]}</option>)}</select></label>
 <button className="primary" disabled={!title.trim()||items.length>=100} onClick={()=>save('career-os-'+crypto.randomUUID(),{title:title.trim(),status,notes:''})}>Add contribution</button><small> {items.length}/100 items</small>
 <p role={pending?'alert':'status'}>{message}</p>{pending&&<div className="button-row"><button className="primary" onClick={()=>save(pending.id,pending.fields,true)}>Override and save anyway</button><button className="secondary" onClick={()=>{setPending(null);setMessage('Change cancelled.')}}>Cancel change</button></div>}
 <div className="career-list-filters"><label>Find a contribution<input type="search" value={search} maxLength={200} onChange={e=>updateRouteQuery({q:e.target.value,page:1},true)} placeholder="Search title, notes or link"/></label><label>Filter by status<select value={filter} onChange={e=>updateRouteQuery({status:e.target.value==='all'?null:e.target.value,page:1})}><option value="all">All statuses</option>{osStatuses.map(s=><option key={s} value={s}>{statusLabels[s]}</option>)}</select></label><label><input type="checkbox" checked={stale} onChange={e=>updateRouteQuery({stale:e.target.checked?'1':null,page:1})}/>Needs a decision · 14+ days</label><button className="secondary" onClick={()=>updateRouteQuery({q:null,status:null,stale:null,page:null})}>Clear filters</button></div>
 <p role="status">{list.total} matching contributions · page {list.page} of {list.pages}</p>
 {!list.total&&<p>{items.length?'No matches. Try clearing filters.':'No contributions yet. Add a small issue you want to work on.'}</p>}
 {list.items.map(item=><article className="card" key={item.id}><h3>{item.title}</h3><ContributionDetails key={item.id+'-'+(item.record.fields.url||'')} id={item.id}/><label>Status<select value={item.status} onChange={e=>save(item.id,{...get(item.id).fields,status:e.target.value})}>{osStatuses.map(s=><option key={s} value={s}>{statusLabels[s]}</option>)}</select></label>
 {now&&staleOpenSource(item.record,now)&&<div role="status"><p>No update for at least 14 days. <strong>Drop or continue?</strong></p><button onClick={()=>save(item.id,{...get(item.id).fields,status:'dropped'})}>Drop this item</button><button onClick={()=>save(item.id,{...get(item.id).fields})}>Continue · reviewed today</button></div>}
 <label style={{display:'grid'}}>Next action / notes<textarea maxLength={2000} defaultValue={item.record.fields.notes||''} key={item.id+'-'+item.record.fields.notes} onBlur={e=>{if(e.target.value!==(get(item.id).fields.notes||''))patch(item.id,{notes:e.target.value})}}/></label><small>Notes save when you leave the field. Last update: {item.updatedAt.slice(0,10)}</small></article>)}
 {list.pages>1&&<nav className="career-review-pages" aria-label="Contribution pages"><button className="secondary" disabled={list.page===1} onClick={()=>updateRouteQuery({page:list.page-1})}>Previous contributions</button><span>{list.page} / {list.pages}</span><button className="secondary" disabled={list.page===list.pages} onClick={()=>updateRouteQuery({page:list.page+1})}>Next contributions</button></nav>}
 {showReview&&<WeeklyReview/>}</section>;
}
