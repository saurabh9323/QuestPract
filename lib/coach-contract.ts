import type {CartoonLesson} from './cartoon-lessons';

export type CoachInput={source:string;attemptId:string;at:string;title:string;topic:string;question:string;answer:string;previous:string;confidence:string};
export type CoachPack={version:1;mode:'local'|'gemini';input:CoachInput;observations:string[];challenge:string;hint:string;checklist:string[];lesson:CartoonLesson;createdAt:string;due:string;sources:{title:string;url:string;checkedAt:string}[]};
const text=(value:unknown,max:number):value is string=>typeof value==='string'&&value.length<=max;
const stamp=(value:unknown)=>text(value,40)&&Number.isFinite(Date.parse(value));
const strings=(value:unknown,min:number,max:number,size:number):value is string[]=>Array.isArray(value)&&value.length>=min&&value.length<=max&&value.every(x=>text(x,size));
export function validCoachInput(value:unknown):value is CoachInput{
 if(!value||typeof value!=='object')return false;
 const x=value as CoachInput;
 return text(x.source,160)&&text(x.attemptId,120)&&stamp(x.at)&&text(x.title,300)&&text(x.topic,300)&&text(x.question,2000)&&text(x.answer,8000)&&!!x.answer.trim()&&text(x.previous,2000)&&text(x.confidence,2000);
}
export function validCoachLesson(value:unknown):value is CartoonLesson{
 if(!value||typeof value!=='object')return false;
 const l=value as CartoonLesson;
 if(!text(l.id,110)||!/^auto-pack-[a-z0-9-]+$/.test(l.id)||!text(l.category,100)||!text(l.title,300)||!text(l.why,2000)||!text(l.limit,2000)||!['table','city','queue','stack','tree','array','stage','factory'].includes(l.world)||(l.layout!==undefined&&!['bfs-tree','linux-path'].includes(l.layout))||!Array.isArray(l.scenes)||l.scenes.length<1||l.scenes.length>6)return false;
 const maxItems=l.layout==='bfs-tree'?5:l.world==='table'?3:l.world==='stack'?4:l.world==='tree'?3:6;
 if(!l.scenes.every(s=>s&&text(s.title,300)&&text(s.say,800)&&text(s.technical,2000)&&text(s.code,6000)&&strings(s.items,1,maxItems,100)&&Array.isArray(s.active)&&s.active.every(n=>Number.isInteger(n)&&n>=0&&n<s.items.length)))return false;
 if(l.layout==='bfs-tree'&&!l.scenes.every(s=>s.items.length===5))return false;
 const q=l.quiz;
 return !!q&&text(q.question,1000)&&strings(q.choices,2,5,500)&&Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.choices.length&&text(q.why,2000);
}
export function readCoachPack(raw?:string):CoachPack|null{
 if(!raw||raw.length>40000)return null;
 try{
  const p=JSON.parse(raw) as CoachPack;
  if(p?.version!==1||!['local','gemini'].includes(p.mode)||!validCoachInput(p.input)||!strings(p.observations,1,8,2000)||!text(p.challenge,3000)||!text(p.hint,2000)||!strings(p.checklist,1,8,1000)||!stamp(p.createdAt)||!/^\d{4}-\d{2}-\d{2}$/.test(p.due)||!Number.isFinite(Date.parse(p.due))||!validCoachLesson(p.lesson)||!Array.isArray(p.sources)||p.sources.length>3)return null;
  for(const s of p.sources){if(!s||!text(s.title,300)||!text(s.url,2000)||!stamp(s.checkedAt))return null;const u=new URL(s.url);if(u.protocol!=='https:'||u.username||u.password)return null}
  return p;
 }catch{return null}
}
