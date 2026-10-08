import {dateKey,dayDate,hasCommunicationRep,type Progress} from './progress';

export type ActivityDay={date:string;minutes:number;submissions:number;attempts:number;independent:number;communication:number;courseDays:number[]};
/** Calendar activity, not reconstructed historical course completion. */
export function activityTimeline(p:Progress,end=dateKey(),length=90):ActivityDay[]{
 const rows=Array.from({length},(_,i)=>({date:dayDate(end,i-length+1),minutes:0,submissions:0,attempts:0,independent:0,communication:0,courseDays:[] as number[]}));
 const byDate=new Map(rows.map(r=>[r.date,r]));
 const row=(at:string)=>{const d=new Date(at);return Number.isNaN(d.getTime())?undefined:byDate.get(dateKey(d));};
 for(const [day,d] of Object.entries(p.days)){
  const seen=new Set<string>();
  for(const s of d.submissions||[]){if(seen.has(s.id))continue;seen.add(s.id);const r=row(s.at);if(!r)continue;r.submissions++;r.minutes+=Number.isFinite(s.minutes)?Math.max(0,s.minutes):0;if(!r.courseDays.includes(Number(day)))r.courseDays.push(Number(day));}
 }
 for(const record of Object.values(p.practice||{})){
  const seen=new Set<string>();
  for(const a of record.attempts){if(seen.has(a.id))continue;seen.add(a.id);const r=row(a.createdAt);if(r){r.attempts++;if(a.confidence==='independent')r.independent++;}}
 }
 for(const log of Object.values(p.communication||{})){
  // One rep per course day. Later note edits must not create extra reps.
  const candidates=[...log.history.filter(hasCommunicationRep).map(h=>h.savedAt),...(hasCommunicationRep(log)?[log.updatedAt]:[])].filter(at=>!Number.isNaN(new Date(at).getTime())).sort((a,b)=>new Date(a).getTime()-new Date(b).getTime());
  const r=candidates[0]?row(candidates[0]):undefined;if(r)r.communication++;
 }
 return rows;
}
export const activityCount=(d:ActivityDay)=>d.submissions+d.attempts+d.communication;
