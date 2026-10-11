'use client';
import {dateKey,type Progress} from '@/lib/progress';
import {managedTasks,type ManagedTask} from '@/lib/planning';
import {formatStudyTime} from '@/lib/study-time';
import {useRouteQuery,routePage,updateRouteQuery} from '@/lib/workspace-location';
import Pagination from './Pagination';

const PAGE_SIZE=4;
function TaskPage({title,tasks,queryKey,empty,open}:{title:string;tasks:ManagedTask[];queryKey:string;empty:string;open:(day:number)=>void}){
 const query=useRouteQuery(),page=Math.min(routePage(query.get(queryKey)),Math.max(1,Math.ceil(tasks.length/PAGE_SIZE)));
 const visible=tasks.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
 const grouped=Object.entries(visible.reduce<Record<string,ManagedTask[]>>((result,task)=>{(result[task.dueDate]??=[]).push(task);return result},{}));
 return <section className="dashboard-task-page" aria-label={title}><h3>{title}</h3><div className="dashboard-page-results">{grouped.map(([date,list])=><div className="dashboard-date-group" key={date}><h4>{date}</h4>{list.map(t=><button className="list-row" key={t.id} onClick={()=>open(t.day)}><span>Day {t.day} · {t.label}</span><small>{formatStudyTime(t.minutes)} · {t.priority}</small></button>)}</div>)}{!tasks.length&&<p className="muted">{empty}</p>}</div>{tasks.length>0&&<><p className="dashboard-page-count" role="status">Page {page} of {Math.ceil(tasks.length/PAGE_SIZE)} · {tasks.length} tasks</p><Pagination page={page} total={tasks.length} pageSize={PAGE_SIZE} label={title} onChange={n=>updateRouteQuery({[queryKey]:n===1?null:n})}/></>}</section>;
}
export default function DashboardTaskBoard({p,open,planner}:{p:Progress;open:(n:number)=>void;planner:()=>void}){
 const today=dateKey(),tasks=managedTasks(p),active=tasks.filter(t=>!t.done&&t.status!=='skipped').sort((a,b)=>a.dueDate.localeCompare(b.dueDate)||a.day-b.day||a.id.localeCompare(b.id));
 const todayTasks=active.filter(t=>t.dueDate===today),overdue=active.filter(t=>t.dueDate<today),upcoming=active.filter(t=>t.dueDate>today);
 return <section className="card dashboard-board"><div className="section-heading"><div><span className="eyebrow">DASHBOARD CONTROL CENTER</span><h2>Current day, pending days, and task backlog</h2><p>Four tasks per page. Browse each list independently; all pending work is included.</p></div><button className="secondary" onClick={planner}>Manage all tasks</button></div><div className="dashboard-metrics"><div><strong>{todayTasks.length}</strong><span>tasks today</span></div><div><strong>{overdue.length}</strong><span>overdue tasks</span></div><div><strong>{upcoming.length}</strong><span>upcoming tasks</span></div><div><strong>{formatStudyTime(active.reduce((n,t)=>n+t.minutes,0))}</strong><span>estimated open workload</span></div></div><div className="dashboard-task-columns"><TaskPage title="Today" tasks={todayTasks} queryKey="todayPage" empty="No pending task is scheduled for today." open={open}/><TaskPage title="Pending from previous days" tasks={overdue} queryKey="overduePage" empty="No previous-day backlog. You are on track." open={open}/><TaskPage title="Next pending work" tasks={upcoming} queryKey="upcomingPage" empty="No upcoming pending tasks found." open={open}/></div></section>;
}
