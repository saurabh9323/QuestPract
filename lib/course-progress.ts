import {quests} from './curriculum';
import {dayAssignments} from './course';
import {hasCommunicationRep,type Progress} from './progress';
export function dayProgress(p:Progress,day:number){const q=quests[day-1],assignment=dayAssignments(day),steps=q.steps.filter(s=>p.days[day]?.steps.includes(s.id)).length,dsa=assignment.dsa.filter(x=>p.practice?.[x.id]?.solvedAt).length,speaking=hasCommunicationRep(p.communication?.[day])?1:0,total=q.steps.length+assignment.dsa.length+1,done=steps+dsa+speaking;return {day,steps,stepTotal:q.steps.length,dsa,dsaTotal:assignment.dsa.length,speaking,done,total,percent:Math.round(done/total*100)}}
export function weekProgress(p:Progress,week:number){const start=(week-1)*7+1,end=Math.min(90,start+6),days=Array.from({length:end-start+1},(_,i)=>dayProgress(p,start+i)),done=days.reduce((n,d)=>n+d.done,0),total=days.reduce((n,d)=>n+d.total,0);return {week,start,end,days,done,total,percent:Math.round(done/total*100)}}
