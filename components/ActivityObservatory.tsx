"use client";
import {useEffect,useMemo,useState,type CSSProperties} from 'react';
import {Layers3,Play,Pause,Download,Clock3,Orbit} from 'lucide-react';
import {activityTimeline,activityCount} from '@/lib/activity-analytics';
import {dateKey,type Progress} from '@/lib/progress';
import {formatStudyTime} from '@/lib/study-time';

export default function ActivityObservatory({p,open}:{p:Progress;open?:(day:number)=>void}){
 const [range,setRange]=useState(28),[dimension,setDimension]=useState(true),[selected,setSelected]=useState(89),[playing,setPlaying]=useState(false);
 const today=dateKey(),days=useMemo(()=>activityTimeline(p,today),[p,today]);
 const visible=days.slice(-range),start=90-range,index=Math.max(start,Math.min(89,selected)),day=days[index];
 useEffect(()=>{if(!playing)return;const timer=setInterval(()=>setSelected(n=>{if(n>=89){setPlaying(false);return 89;}return Math.max(start,n+1);}),1000);return()=>clearInterval(timer);},[playing,start]);
 const total=visible.reduce((a,d)=>({minutes:a.minutes+d.minutes,attempts:a.attempts+d.attempts,independent:a.independent+d.independent,active:a.active+(activityCount(d)>0?1:0)}),{minutes:0,attempts:0,independent:0,active:0});
 const recent=days.slice(-7).reduce((n,d)=>n+d.minutes,0),previous=days.slice(-14,-7).reduce((n,d)=>n+d.minutes,0);
 const max=Math.max(1,...visible.map(activityCount)),cumulative=visible.slice(0,index-start+1).reduce((n,d)=>n+d.minutes,0);
 const exportData=()=>{const csv=['date,recorded_minutes,submissions,practice_attempts,independent_attempts,communication_reps',...visible.map(d=>[d.date,d.minutes,d.submissions,d.attempts,d.independent,d.communication].join(','))].join('\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`quest90-activity-${today}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 return <div className="observatory">
  <header className="observatory-hero"><div><span className="eyebrow">YOUR LEARNING OBSERVATORY</span><h2>See your effort take shape.</h2><p>A landscape of your saved activity. Travel through time to see what you actually practiced.</p></div><Orbit size={68} aria-hidden="true"/></header>
  <div className="orbit-stats">
   <article><Clock3 aria-hidden="true"/><strong>{formatStudyTime(total.minutes)}</strong><span>Recorded study time</span><small>Submitted session minutes</small></article>
   <article><strong>{total.active}<small> / {range}</small></strong><span>Active calendar days</span><small>Submission, attempt or speaking rep</small></article>
   <article><strong>{total.independent}<small> / {total.attempts}</small></strong><span>Independent attempts</span><small>Your recorded confidence, not a grade</small></article>
   <article><strong>{recent===previous?'No change':`${recent>previous?'+':'−'}${formatStudyTime(Math.abs(recent-previous))}`}</strong><span>Study time vs previous 7 days</span><small>{formatStudyTime(recent)} this week · {formatStudyTime(previous)} before</small></article>
  </div>
  <section className="card orbit-landscape"><div className="orbit-toolbar"><div><span className="eyebrow">3D VIEW + TIME REPLAY</span><h3>Your activity landscape</h3></div><div className="orbit-controls"><label>Window <select value={range} onChange={e=>{setRange(Number(e.target.value));setPlaying(false);setSelected(89);}}><option value={7}>7 days</option><option value={28}>28 days</option><option value={90}>90 days</option></select></label><button className="secondary" aria-pressed={dimension} onClick={()=>setDimension(!dimension)}><Layers3 size={16}/>{dimension?'Use flat view':'Use 3D view'}</button><button className="secondary" onClick={exportData}><Download size={16}/>CSV</button></div></div>
   <p>Height = saved activity count. Select a day to inspect it. The time slider adds the fourth dimension: history.</p>
   <div className={`orbit-stage ${dimension?'is-dimensional':''}`}><div className="orbit-bars" style={{'--columns':range} as CSSProperties} role="group" aria-label="Activity by calendar date">{visible.map((d,i)=><button key={d.date} className={`orbit-column ${index===start+i?'is-selected':''} ${start+i>index?'is-future':''}`} style={{'--height':`${12+activityCount(d)/max*120}px`} as CSSProperties} aria-label={`${d.date}: ${activityCount(d)} activities, ${formatStudyTime(d.minutes)}`} aria-pressed={index===start+i} onClick={()=>{setSelected(start+i);setPlaying(false);}}><span className="orbit-tower"/><span className="orbit-date">{d.date.slice(8)}</span></button>)}</div></div>
   <div className="orbit-date-range"><span>{visible[0].date}</span><span>{today}</span></div>
   <div className="orbit-replay"><button className="secondary" aria-label={playing?'Pause timeline':'Play timeline'} onClick={()=>{if(!playing&&index===89)setSelected(start);setPlaying(!playing);}}>{playing?<Pause size={18}/>:<Play size={18}/>}</button><label htmlFor="activity-time">Explore date<input id="activity-time" type="range" min={start} max={89} value={index} onChange={e=>{setSelected(Number(e.target.value));setPlaying(false);}} aria-valuetext={day.date}/></label><strong>{day.date}</strong></div>
   <div className="orbit-detail" aria-live={playing?'off':'polite'}><div><span className="eyebrow">SELECTED DAY · {day.date}</span><h3>{formatStudyTime(day.minutes)} recorded</h3><p>{day.submissions} submissions · {day.attempts} practice attempts · {day.communication} speaking reps</p>{!activityCount(day)&&<p>No dated activity recorded here. This does not mean you did no learning.</p>}{day.courseDays.map(n=><button key={n} className="secondary" onClick={()=>open?.(n)}>Open course day {n}</button>)}</div><div className="orbit-total"><small>Recorded time in this window up to selected date</small><strong>{formatStudyTime(cumulative)}</strong><span>{visible.slice(0,index-start+1).filter(d=>activityCount(d)>0).length} active days</span></div></div>
   <details className="orbit-method"><summary>How these numbers work</summary><p>Dates use your browser’s local timezone. Time is the sum of saved session minutes, not an automatic timer. Repeated sessions are added; duplicate submission IDs within a course day are ignored. Practice counts submitted question-bank attempts, not drafts or AI messages. Speaking counts each course day once, on its earliest saved Attempted/Done record. If old history is missing, the earliest retained timestamp is used. Course completion below is your current state, not reconstructed history.</p></details>
  </section>
 </div>;
}
