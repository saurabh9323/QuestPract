import type {Progress} from '../progress';
export const consistencySettings='consistency-settings';
export function indiaDay(now:Date){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(now)}
export function shiftDay(day:string,amount:number){return new Date(Date.parse(day+'T00:00:00Z')+amount*86400000).toISOString().slice(0,10)}
export function dailyRecord(day:string){return 'consistency-day-'+day}
export function dailyStatus(p:Progress,day:string):'done'|'rest'|'pending'{
 const f=p.studio?.[dailyRecord(day)]?.fields;
 if(f?.status==='rest')return 'rest';
 if(f?.status==='done'&&f.note?.trim()&&Number.isInteger(Number(f.minutes))&&Number(f.minutes)<=480&&Number(f.minutes)>=Number(f.target)&&[5,10,15].includes(Number(f.target)))return 'done';
 return 'pending';
}
export function consistencySummary(p:Progress,now:Date){
 const today=indiaDay(now),settings=p.studio?.[consistencySettings]?.fields;
 const started=settings?.started||today;
 const days=Array.from({length:7},(_,i)=>{const day=shiftDay(today,i-6);return {day,status:day<started?'before' as const:dailyStatus(p,day)}});
 const yesterday=shiftDay(today,-1);
 return {today,days,status:dailyStatus(p,today),done:days.filter(d=>d.status==='done').length,missed:days.filter(d=>d.day<today&&d.status==='pending').length,restart:yesterday>=started&&dailyStatus(p,yesterday)==='pending'};
}
