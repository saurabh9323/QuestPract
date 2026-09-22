'use client';
import {useState} from 'react';
import {ArrowRight,Check,Clock,Minus} from 'lucide-react';
import {quests} from '@/lib/curriculum';
import {dateKey,dayDate,scheduledDay,type Progress} from '@/lib/progress';
import {managedTasks} from '@/lib/planning';
export default function JourneyCalendar({p,open}:{p:Progress;open:(day:number)=>void}){
  const [selected,setSelected]=useState(()=>scheduledDay(p.startDate));
  const today=dateKey(),tasks=managedTasks(p),date=dayDate(p.startDate,selected-1),selectedTasks=tasks.filter(t=>t.day===selected);
  function state(day:number){const list=tasks.filter(t=>t.day===day),active=list.filter(t=>t.status!=='skipped');if(active.length&&active.every(t=>t.done))return 'complete';if(!active.length)return 'skipped';if(list.some(t=>t.done)||p.days[day]?.steps.length||Object.values(p.days[day]?.answers||{}).some(a=>a.text.trim()))return 'partial';if(active.some(t=>!t.done&&t.dueDate<today))return 'overdue';return dayDate(p.startDate,day-1)===today?'today':'upcoming'}
  const labels={complete:'Complete',partial:'In progress',overdue:'Pending',today:'Today',upcoming:'Upcoming',skipped:'Skipped'};
  return <section className="card journey-calendar"><div className="section-heading"><div><span className="eyebrow">YOUR COURSE AT A GLANCE</span><h2>90 days. One day at a time.</h2><p>Select a day to see its tasks. Completion includes communication practice.</p></div><button className="secondary" onClick={()=>setSelected(scheduledDay(p.startDate))}>Find current day</button></div>
    <div className="calendar-legend">{Object.entries(labels).map(([key,label])=><span key={key}><i className={`calendar-dot ${key}`}/>{label}</span>)}</div>
    <div className="calendar-layout"><div className="course-calendar" aria-label="90 course days">{quests.map(q=>{const status=state(q.day),isToday=dayDate(p.startDate,q.day-1)===today;return <button key={q.day} className={`calendar-day ${status} ${selected===q.day?'selected':''}`} aria-pressed={selected===q.day} aria-current={isToday?'date':undefined} aria-label={`Day ${q.day}, ${dayDate(p.startDate,q.day-1)}, ${labels[status]}${isToday?', today':''}: ${q.title}`} onClick={()=>setSelected(q.day)}><strong>{q.day}</strong><span>{status==='complete'?<Check size={13}/>:status==='overdue'?<Clock size={13}/>:status==='skipped'?<Minus size={13}/>:isToday?'Today':status==='partial'?'Started':'·'}</span></button>})}</div>
    <div className="calendar-detail"><span className="eyebrow">DAY {selected} · {date}</span><h3>{quests[selected-1].title}</h3><p>{labels[state(selected)]} · {selectedTasks.filter(t=>t.done).length}/{selectedTasks.length} tasks complete</p><ul>{selectedTasks.map(task=><li key={task.id}><span className={`calendar-task-state ${task.done?'done':''}`}>{task.done?'✓':'○'}</span><div><strong>{task.label}</strong><small>{task.done?'Completed':task.status==='skipped'?'Skipped':`${task.dueDate<today?'Overdue · ':''}Due ${task.dueDate}`} · {task.minutes}m</small>{task.reason&&<small>{task.reason}</small>}</div></li>)}</ul><button className="primary full" onClick={()=>open(selected)}>Open Day {selected}<ArrowRight size={16}/></button></div></div>
  </section>;
}
