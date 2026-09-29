import {quests,chapters} from './curriculum';
import {dayAssignments,communicationMission} from './course';
import {dateKey,dayDate,type Progress} from './progress';
export const challengeCadences=[
 {id:'daily',label:'Daily challenge',interval:1,required:1,minutes:15,description:'Recall, solve and explain your latest submitted day.'},
 {id:'alternate',label:'Alternate-day challenge',interval:2,required:2,minutes:25,description:'Connect the latest two submitted days every two calendar days.'},
 {id:'weekly',label:'Weekly challenge',interval:7,required:7,minutes:45,description:'Mix topics from your latest seven submitted days each week.'},
] as const;
export type ChallengeCadence=typeof challengeCadences[number]['id'];
export type SubmittedDay={day:number;firstAt:string;lastAt:string;completed:boolean};
export type ChallengeItem={id:string;day:number;kind:'DSA'|'Concept'|'Build'|'Communication';title:string;prompt:string;hint:string;rubric:string};
export type ChallengeManifest={version:1;cadence:ChallengeCadence;periodStart:string;nextAt:string;minutes:number;days:number[];items:ChallengeItem[]};
const stamp=(s?:string)=>!!s&&Number.isFinite(Date.parse(s));
const calendarDifference=(a:string,b:string)=>(Date.parse(a+'T00:00:00Z')-Date.parse(b+'T00:00:00Z'))/86400000;
export function submittedCourseDays(p:Progress,today=dateKey()):SubmittedDay[]{
 return quests.flatMap(q=>{
  const d=p.days[q.day];if(!d)return [];
  const timestamps=[...(stamp(d.completedAt)?[d.completedAt!]:[]),...(d.submissions||[]).filter(s=>s.status==='complete'||s.status==='partial'&&(s.steps.length>0||s.notes.trim()||Object.values(s.answers).some(a=>a.text.trim()))).map(s=>s.at)].filter(s=>stamp(s)&&dateKey(new Date(s))<=today).sort((a,b)=>Date.parse(a)-Date.parse(b));
  const completed=!!(stamp(d.completedAt)&&dateKey(new Date(d.completedAt!))<=today)||(d.submissions||[]).some(s=>s.status==='complete'&&stamp(s.at)&&dateKey(new Date(s.at))<=today);
  return timestamps.length?[{day:q.day,firstAt:timestamps[0],lastAt:timestamps[timestamps.length-1],completed}]:[];
 }).sort((a,b)=>Date.parse(a.lastAt)-Date.parse(b.lastAt)||a.day-b.day);
}
export function challengeWindow(p:Progress,cadence:ChallengeCadence,today=dateKey()){
 const config=challengeCadences.find(c=>c.id===cadence)!,submitted=submittedCourseDays(p,today);
 if(submitted.length<config.required)return {config,submitted,missing:config.required-submitted.length,id:null,manifest:null};
 const firstEligible=[...submitted].sort((a,b)=>Date.parse(a.firstAt)-Date.parse(b.firstAt)||a.day-b.day)[config.required-1];
 const anchor=dateKey(new Date(firstEligible.firstAt)),cycle=Math.floor(calendarDifference(today,anchor)/config.interval),periodStart=dayDate(anchor,cycle*config.interval),nextAt=dayDate(periodStart,config.interval),days=submitted.slice(-config.required).map(d=>d.day);
 const items:ChallengeItem[]=[];
 const add=(day:number,kind:ChallengeItem['kind'],variant:number)=>{
  const q=quests[day-1],topic=chapters[q.chapter-1].name,base={day,kind,id:`${day}-${kind.toLowerCase()}`};
  if(kind==='DSA'){const pool=dayAssignments(day).dsa,b=pool[variant%pool.length];items.push({...base,title:b.title,prompt:`${b.prompt}\n${['Explain the approach, trace one input, and state time and space complexity.','Give a simple baseline, then explain which repeated work your improved approach avoids.','Choose a boundary input that could break an incorrect solution. Trace your algorithm on it.'][variant%3]}`,hint:b.hints[1]||b.hints[0],rubric:`${b.logic} ${b.rubric}`});}
  else if(kind==='Concept'){const b=q.questions.find(x=>x.id==='concept')!;items.push({...base,title:`${topic}: ${q.title}`,prompt:b.prompt,hint:b.hint,rubric:b.rubric});}
  else if(kind==='Build')items.push({...base,title:q.title,prompt:`${q.mission}\nRebuild the smallest working version from memory, then describe a normal case, a boundary case and a failure case.`,hint:q.lesson,rubric:q.questions.find(x=>x.id==='reflection')!.rubric});
  else{const m=communicationMission(day);items.push({...base,title:`Explain Day ${day} aloud`,prompt:`Give a 60–90 second explanation of “${q.title}”. Include the problem, your approach and one mistake to avoid. Then reflect on your speaking task: ${m.title}. Write what you would say; no new social interaction is required for this round.`,hint:`Use: “The problem is… My approach is… It works because… One edge case is…” ${m.script}`,rubric:`Explain ${q.lesson} using a concrete example. Keep your own contribution and any real interaction truthful. Note one sentence you could make clearer.`});}
 };
 if(cadence==='daily'){add(days[0],'Concept',cycle);add(days[0],'DSA',cycle);add(days[0],'Communication',cycle);}
 else if(cadence==='alternate'){add(days[0],'DSA',cycle);add(days[1],'Concept',cycle);add(days[1],'Build',cycle);add(days[0],'Communication',cycle);}
 else{const kinds:ChallengeItem['kind'][]=['Concept','DSA','Build','Concept','DSA','Build','Communication'];days.forEach((day,i)=>add(day,kinds[(i+cycle)%kinds.length],cycle));}
 const manifest:ChallengeManifest={version:1,cadence,periodStart,nextAt,minutes:config.minutes,days,items};
 return {config,submitted,missing:0,id:`progress-challenge-${cadence}-${periodStart}`,manifest};
}
export function parseChallengeManifest(value?:string):ChallengeManifest|null{
 try{const m=JSON.parse(value||'');if(m?.version!==1||!challengeCadences.some(c=>c.id===m.cadence)||!Array.isArray(m.days)||!m.days.length||m.days.length>7||!m.days.every((d:unknown)=>Number.isInteger(d)&&Number(d)>=1&&Number(d)<=90)||new Set(m.days).size!==m.days.length||!Array.isArray(m.items)||!m.items.length||m.items.length>7||!Number.isInteger(m.minutes)||m.minutes<1||m.minutes>60)return null;
  const validDate=(s:unknown)=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&dateKey(new Date(s+'T12:00:00'))===s;
  if(!validDate(m.periodStart)||!validDate(m.nextAt)||m.nextAt<=m.periodStart)return null;
  if(!m.items.every((x:ChallengeItem)=>x&&m.days.includes(x.day)&&['DSA','Concept','Build','Communication'].includes(x.kind)&&['id','title','prompt','hint','rubric'].every(k=>typeof (x as unknown as Record<string,unknown>)[k]==='string'))||new Set(m.items.map((x:ChallengeItem)=>x.id)).size!==m.items.length)return null;
  return m;
 }catch{return null;}
}
