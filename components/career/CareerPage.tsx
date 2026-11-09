'use client';
import {useEffect,useState} from 'react';
import {useStudio} from '../studio/StudioContext';
import {active,careerItems,limits,staleOpenSource} from '@/lib/career/logic';
import {navigateWorkspace,useRouteQuery} from '@/lib/workspace-location';
import CareerTracker,{WeeklyReview} from './CareerTracker';
import HackathonRadar from '../radar/HackathonRadar';
import '@/app/career.css';
export const careerTabs=[{id:'opensource',label:'Open-source contributions'},{id:'hackathons',label:'Hackathons'},{id:'review',label:'Weekly review'}] as const;
export function CareerSummary(){
 const {p}=useStudio(),[now,setNow]=useState<Date|null>(null);
 useEffect(()=>{setNow(new Date());const t=setInterval(()=>setNow(new Date()),60000);return()=>clearInterval(t)},[]);
 const os=careerItems(p.studio,'opensource'),hacks=careerItems(p.studio,'hackathon'),budget=limits(p.studio);
 const osActive=os.filter(i=>active('opensource',i.status)).length,hackActive=hacks.filter(i=>active('hackathon',i.status)).length;
 const stale=now?os.filter(i=>staleOpenSource(i.record,now)).length:null;
 return <section className="card career-summary"><span className="eyebrow">CAREER TRACKER</span><h2>Keep your outside projects manageable</h2><div className="career-summary-grid"><p><strong>{osActive} / {budget.opensource}</strong><span>active contributions</span>{osActive>budget.opensource&&<small>Above your soft limit</small>}</p><p><strong>{hackActive} / {budget.hackathon}</strong><span>active hackathons</span>{hackActive>budget.hackathon&&<small>Above your soft limit</small>}</p><p><strong>{stale??'—'}</strong><span>contributions need a decision</span></p></div><div className="button-row">{careerTabs.map(tab=><a className="secondary" key={tab.id} href={'/career/?tab='+tab.id} onClick={e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();navigateWorkspace('/career/?tab='+tab.id);window.scrollTo(0,0)}}>{tab.label}</a>)}</div></section>;
}
export default function CareerPage(){
 const query=useRouteQuery(),tab=careerTabs.find(t=>t.id===query.get('tab'))?.id||'opensource';
 return <div className="career-page"><CareerSummary/><nav className="career-section-nav" aria-label="Career Tracker sections">{careerTabs.map(t=><a key={t.id} className={t.id===tab?'primary':'secondary'} aria-current={t.id===tab?'page':undefined} href={'/career/?tab='+t.id} onClick={e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();navigateWorkspace('/career/?tab='+t.id)}}>{t.label}</a>)}</nav><div hidden={tab!=='opensource'}><CareerTracker showReview={false}/></div><div hidden={tab!=='hackathons'}><HackathonRadar/></div><div hidden={tab!=='review'} className="card"><WeeklyReview/></div></div>;
}
