"use client";

import {Brain,MessageCircle,Clock,Flame} from 'lucide-react';
import type {Progress} from '@/lib/progress';
import {dateKey} from '@/lib/progress';
import {managedTasks} from '@/lib/planning';
import {questionBank} from '@/lib/bank';

type Props={p:Progress;commit:(p:Progress)=>void;open?:(day:number)=>void;practice?:(id:string)=>void};
export function SmartCoach({p,open,practice}:Props){const today=dateKey(),tasks=managedTasks(p),active=tasks.filter(t=>!t.done&&t.status!=='skipped'),overdue=active.filter(t=>t.dueDate<today),todayTasks=active.filter(t=>t.dueDate===today),budget=p.profile?.dailyMinutes||p.planning?.dailyBudget||180,next=(overdue[0]||todayTasks[0]||active[0]),weak=p.profile?.weakAreas?.[0]||'DSA',review=questionBank.find(q=>q.kind==='DSA'&&!p.practice?.[q.id]?.solvedAt)||questionBank[0];const message=overdue.length?`You are behind by ${overdue.length} task${overdue.length===1?'':'s'}. Finish the earliest pending item first.`:todayTasks.length?`Today has ${todayTasks.length} focused task${todayTasks.length===1?'':'s'}. Keep it realistic with your ${budget} minute budget.`:'You are ahead of the visible schedule. Use the extra time for recall and weak areas.';return <section className="card smart-coach"><div className="section-heading"><div><span className="eyebrow">SMART DAILY COACH</span><h2>{message}</h2></div><Brain size={24}/></div><div className="coach-actions"><button className="primary" disabled={!next} onClick={()=>next&&open?.(next.day)}>Do this first: {next?`Day ${next.day} · ${next.label}`:'No pending task'}</button><button className="secondary" onClick={()=>review&&practice?.(review.id)}>Revise weak area: {weak}</button></div><div className="coach-mini"><span><Clock size={15}/> Budget: {budget}m</span><span><Flame size={15}/> Overdue: {overdue.length}</span><span><MessageCircle size={15}/> English reps: {Object.values(p.communication||{}).filter(x=>x.status==='done'||x.status==='attempted').length}/90</span></div></section>}

export {default as AnalyticsDashboard} from './AnalyticsDashboard';
