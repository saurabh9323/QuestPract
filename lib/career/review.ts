import {questionBank} from '../bank';
import {quests} from '../curriculum';
import {indiaDay,shiftDay} from '../consistency/logic';
import type {Progress} from '../progress';
import type {StudioState} from '../studio-state';
import {careerItems,history,validateCareerRecord,type Event,type weekSummary} from './logic';

export type ReviewWeekOffset = 0 | -1;
export type ReviewSummary = ReturnType<typeof weekSummary>;
export type ReviewEvidenceItem = {id:string;title:string;at:string};
export type ReviewEvidence = Record<'dsaSolved'|'questsCompleted'|'openSourceMoved'|'openSourceMerged'|'hackathonsProgressed',ReviewEvidenceItem[]>;
export type ReviewPriority = {id:string;priority:string;createdAt:string;weekStart:string};

const questionTitles=new Map(questionBank.map(q=>[q.id,q.title]));
const questTitles=new Map(quests.map(q=>[String(q.day),q.title]));
const hackathonRank:Record<string,number>={new:0,interested:1,registered:2,building:3,submitted:4,skipped:-1};
const newestFirst=(a:ReviewEvidenceItem,b:ReviewEvidenceItem)=>Date.parse(b.at)-Date.parse(a.at)||a.id.localeCompare(b.id);

/** Calendar weeks start on Monday in India. Only explicitly dated saved work is evidence. */
export function reviewWeek(p:Progress,now:Date,offset:ReviewWeekOffset):{summary:ReviewSummary;evidence:ReviewEvidence}{
 if(offset!==0&&offset!==-1)throw new RangeError('Choose the current or previous calendar week.');
 const day=indiaDay(now),weekday=new Date(day+'T00:00:00Z').getUTCDay();
 const start=shiftDay(day,-((weekday+6)%7)+offset*7),end=shiftDay(start,6);
 const begins=Date.parse(start+'T00:00:00+05:30'),ends=Date.parse(shiftDay(start,7)+'T00:00:00+05:30');
 const inWeek=(at:string|undefined):at is string=>typeof at==='string'&&Date.parse(at)>=begins&&Date.parse(at)<ends&&Date.parse(at)<=now.getTime();
 const oss=careerItems(p.studio,'opensource'),hacks=careerItems(p.studio,'hackathon');
 // One item can have several qualifying transitions; expose its latest dated evidence once.
 function changes(items:ReturnType<typeof careerItems>,qualifies:(event:Event)=>boolean):ReviewEvidenceItem[]{
  return items.flatMap(item=>{
   const events=history(item.record.fields).filter(event=>inWeek(event.at)&&qualifies(event));
   const latest=events.reduce<Event|undefined>((found,event)=>!found||Date.parse(event.at)>Date.parse(found.at)?event:found,undefined);
   return latest?[{id:item.id,title:item.title,at:latest.at}]:[];
  }).sort(newestFirst);
 }
 const evidence:ReviewEvidence={
  dsaSolved:Object.entries(p.practice||{}).flatMap(([id,record])=>id.startsWith('dsa-')&&inWeek(record.solvedAt)?[{id,title:questionTitles.get(id)||`DSA problem · ${id}`,at:record.solvedAt}]:[]).sort(newestFirst),
  questsCompleted:Object.entries(p.days).flatMap(([day,record])=>inWeek(record.completedAt)?[{id:`quest-${day}`,title:questTitles.has(day)?`Day ${day} · ${questTitles.get(day)}`:`Quest day ${day}`,at:record.completedAt}]:[]).sort(newestFirst),
  openSourceMoved:changes(oss,event=>event.from!==event.to),
  openSourceMerged:changes(oss,event=>event.to==='merged'&&event.from!=='merged'),
  hackathonsProgressed:changes(hacks,event=>(hackathonRank[event.to]??-1)>(hackathonRank[event.from]??-1))
 };
 const summary:ReviewSummary={start,end,asOf:now.toISOString(),timezone:'Asia/Kolkata',
  dsaSolved:evidence.dsaSolved.length,questsCompleted:evidence.questsCompleted.length,
  openSourceMoved:evidence.openSourceMoved.length,openSourceMerged:evidence.openSourceMerged.length,
  hackathonsProgressed:evidence.hackathonsProgressed.length};
 return {summary,evidence};
}

/** Read immutable snapshot timestamps; editing or syncing a record cannot make its priority newer. */
export function latestReviewPriority(studio:StudioState={}):ReviewPriority|null{
 const priorities:ReviewPriority[]=[];
 for(const [id,record] of Object.entries(studio)){
  if(!id.startsWith('career-review-'))continue;
  try{
   if(!record||!record.fields||!Array.isArray(record.attempts))continue;
   validateCareerRecord(id,record);
   const summary=JSON.parse(record.fields.summary) as ReviewSummary;
   const weekStart=summary.start;
   if(new Date(weekStart+'T00:00:00Z').toISOString().slice(0,10)!==weekStart)continue;
   priorities.push({id,priority:record.fields.priority,createdAt:record.fields.createdAt,weekStart});
  }catch{/* Invalid legacy/imported records cannot supply a priority. */}
 }
 return priorities.sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)||a.id.localeCompare(b.id))[0]||null;
}
