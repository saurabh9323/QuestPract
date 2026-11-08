import type {Progress} from '../progress';
import type {StudioRecord,StudioState} from '../studio-state';
import {indiaDay,shiftDay} from '../consistency/logic';
export const osStatuses=['new','commented','working','pr_open','changes_requested','merged','dropped'] as const;
export type CareerKind='opensource'|'hackathon';
export type Event={at:string;from:string;to:string};
export const careerSettings='career-settings';
export function limits(studio:StudioState={}){const f=studio[careerSettings]?.fields;const read=(v:string|undefined,fallback:number)=>v!==undefined&&/^\d+$/.test(v)&&Number(v)<=20?Number(v):fallback;return {opensource:read(f?.opensource,2),hackathon:read(f?.hackathon,1)}}
export function active(kind:CareerKind,status:string){return (kind==='opensource'?['commented','working','pr_open','changes_requested']:['registered','building']).includes(status)}
export function careerItems(studio:StudioState={},kind:CareerKind){return Object.entries(studio).filter(([id,r])=>kind==='opensource'?id.startsWith('career-os-'):id.startsWith('radar-')&&r.fields.schemaVersion==='1').map(([id,r])=>({id,status:r.fields.status,updatedAt:r.updatedAt,title:r.fields.title||r.fields.opportunityId||id,record:r}))}
export function wipWarning(studio:StudioState,kind:CareerKind,id:string,status:string,now:Date){
 const projected=careerItems(studio,kind).filter(i=>i.id!==id&&active(kind,i.status)).length+(active(kind,status)?1:0),limit=limits(studio)[kind];
 return {exceeded:active(kind,status)&&projected>limit,projected,limit,at:now.toISOString()};
}
export function staleOpenSource(record:StudioRecord,now:Date){return !['merged','dropped'].includes(record.fields.status)&&Number.isFinite(Date.parse(record.updatedAt))&&now.getTime()-Date.parse(record.updatedAt)>=14*86400000}
export function history(fields:Record<string,string>):Event[]{try{const v=JSON.parse(fields.careerHistory||'[]');return Array.isArray(v)?v.filter(e=>e&&typeof e.at==='string'&&Number.isFinite(Date.parse(e.at))&&typeof e.from==='string'&&typeof e.to==='string'):[]}catch{return []}}
export function appendEvent(fields:Record<string,string>,status:string,now:Date){const list=history(fields);if((fields.status||'new')===status)return fields.careerHistory||'[]';if(list.length>=200)throw new Error('This item has 200 status changes. Export your history before adding more.');return JSON.stringify([...list,{at:now.toISOString(),from:fields.status||'new',to:status}])}
export function weekSummary(p:Progress,now:Date){
 const day=indiaDay(now),weekday=new Date(day+'T00:00:00Z').getUTCDay(),start=shiftDay(day,-((weekday+6)%7)),end=shiftDay(start,6);
 const begins=Date.parse(start+'T00:00:00+05:30');
 const inWeek=(at?:string)=>!!at&&Date.parse(at)>=begins&&Date.parse(at)<=now.getTime();
 const oss=careerItems(p.studio,'opensource'),hacks=careerItems(p.studio,'hackathon');
 const rank:Record<string,number>={new:0,interested:1,registered:2,building:3,submitted:4,skipped:-1};
 return {start,end,asOf:now.toISOString(),timezone:'Asia/Kolkata',
 dsaSolved:Object.entries(p.practice||{}).filter(([id,r])=>id.startsWith('dsa-')&&inWeek(r.solvedAt)).length,
 questsCompleted:Object.values(p.days).filter(r=>inWeek(r.completedAt)).length,
 openSourceMoved:oss.filter(i=>history(i.record.fields).some(e=>inWeek(e.at)&&e.from!==e.to)).length,
 openSourceMerged:oss.filter(i=>history(i.record.fields).some(e=>inWeek(e.at)&&e.to==='merged'&&e.from!=='merged')).length,
 hackathonsProgressed:hacks.filter(i=>history(i.record.fields).some(e=>inWeek(e.at)&&(rank[e.to]??-1)>(rank[e.from]??-1))).length};
}
export function validateCareerRecord(id:string,r:StudioRecord){
 if(id===careerSettings){for(const k of ['opensource','hackathon'])if(r.fields[k]!==undefined&&(!/^\d+$/.test(r.fields[k])||Number(r.fields[k])>20))throw new Error('Career limits must be 0–20.');return}
 if(id.startsWith('career-os-')){
 if(r.fields.schemaVersion!=='1'||!r.fields.title?.trim()||r.fields.title.length>200||!osStatuses.includes(r.fields.status as typeof osStatuses[number])||(r.fields.notes||'').length>2000)throw new Error('Invalid career item.');
 let events:unknown;try{events=JSON.parse(r.fields.careerHistory||'[]')}catch{throw new Error('Invalid career history.')}
 if(!Array.isArray(events)||events.length>200||history(r.fields).length!==events.length||events.some(e=>!osStatuses.includes(e.from)||!osStatuses.includes(e.to)))throw new Error('Invalid career history.');
 }
 if(id.startsWith('radar-')&&r.fields.careerHistory!==undefined){
 const allowed=['new','interested','registered','building','submitted','skipped'];
 let events;try{events=JSON.parse(r.fields.careerHistory)}catch{throw new Error('Invalid Radar status history.')}
 if(!Array.isArray(events)||events.length>200||history(r.fields).length!==events.length||events.some(e=>!allowed.includes(e.from)||!allowed.includes(e.to)))throw new Error('Invalid Radar status history.');
 }
 if(id.startsWith('career-review-')){
 if(r.fields.schemaVersion!=='1'||r.attempts.length||!Number.isFinite(Date.parse(r.fields.createdAt)))throw new Error('Invalid review snapshot.');
 for(const k of ['shipped','stuck','priority'])if(!r.fields[k]?.trim()||r.fields[k].length>2000)throw new Error('Review responses must be 1–2000 characters.');
 let s;try{s=JSON.parse(r.fields.summary)}catch{throw new Error('Invalid weekly summary.')}
 if(!s||s.asOf!==r.fields.createdAt||s.timezone!=='Asia/Kolkata'||!/^\d{4}-\d{2}-\d{2}$/.test(s.start)||!/^\d{4}-\d{2}-\d{2}$/.test(s.end))throw new Error('Invalid weekly summary.');
 for(const k of ['dsaSolved','questsCompleted','openSourceMoved','openSourceMerged','hackathonsProgressed'])if(!Number.isSafeInteger(s[k])||s[k]<0)throw new Error('Invalid weekly count.');
 }
}
