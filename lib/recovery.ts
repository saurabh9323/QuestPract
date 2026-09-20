import {type Progress,emptyDay,validateProgress} from './progress';

export type RecoveryCopy={id:string;label:string;savedAt:string;progress:Progress};
export type LocalCheckpoint={progress:Progress;revision:number;pending:boolean;savedAt:string};
export const accountKey=(url:string,userId:string)=>`account:${new URL(url).hostname}:${userId}`;
export function progressSummary(p:Progress){return {
  completedDays:Object.values(p.days).filter(d=>d.completedAt).length,
  steps:Object.values(p.days).reduce((n,d)=>n+d.steps.length,0),
  answers:Object.values(p.days).reduce((n,d)=>n+Object.values(d.answers).filter(a=>a.text.trim()).length,0),
  attempts:Object.values(p.practice||{}).reduce((n,r)=>n+r.attempts.length,0)+Object.values(p.oop||{}).reduce((n,r)=>n+r.attempts.length,0),
};}
export function hasWork(p:Progress){const s=progressSummary(p);return !!(s.steps||s.answers||s.attempts||p.todos.length||Object.values(p.days).some(d=>d.notes.trim()||d.submissions?.length)||Object.values(p.practice||{}).some(r=>r.draft.trim()||r.notes.trim())||Object.values(p.oop||{}).some(r=>r.draft.trim())||Object.keys(p.communication||{}).length);}
const unique=<T,>(rows:T[])=>Array.from(new Map(rows.map(row=>[JSON.stringify(row),row])).values());
const time=(s:string)=>Date.parse(s)||0;
// Recovery is an explicit additive action. Never infer that a day was completed.
export function mergeProgress(current:Progress,recovered:Progress):Progress{
 validateProgress(current);validateProgress(recovered);
 const result:Progress={...recovered,...current,days:{...recovered.days,...current.days},todos:unique([...recovered.todos,...current.todos]).reduce<Progress['todos']>((all,t)=>{const old=all.find(x=>x.id===t.id);if(!old)all.push(t);else if(time(t.updatedAt)>time(old.updatedAt))all[all.indexOf(old)]=t;return all},[]),updatedAt:new Date().toISOString(),profile:{...recovered.profile,...current.profile}};
 if(!current.enrollment?.startFinal&&!hasWork(current)){result.startDate=recovered.startDate;result.enrollment=recovered.enrollment||current.enrollment;}
 for(const [key,old] of Object.entries(recovered.days)){
  const now=current.days[key];if(!now)continue;
  const newest=time(now.updatedAt)>=time(old.updatedAt)?now:old;
  const steps=unique([...old.steps,...now.steps]);
  const answers={...old.answers,...now.answers};
  for(const [id,a] of Object.entries(old.answers)){const b=now.answers[id];if(!b)continue;const pick=time(b.updatedAt)>=time(a.updatedAt)?b:a;answers[id]={...pick,history:unique([...a.history,...b.history,...(a.text!==b.text?[{text:a.text,feedback:a.feedback,savedAt:a.updatedAt},{text:b.text,feedback:b.feedback,savedAt:b.updatedAt}]:[])])};}
  result.days[key]={...emptyDay(),...newest,steps,answers,completedAt:now.completedAt||old.completedAt,notes:now.notes===old.notes?now.notes:[now.notes,old.notes].filter(Boolean).join('\n\n[Recovered note]\n'),submissions:unique([...(old.submissions||[]),...(now.submissions||[])])};
 }
 result.practice={...recovered.practice,...current.practice};
 for(const [id,a] of Object.entries(recovered.practice||{})){const b=current.practice?.[id];if(!b)continue;const pick=time(b.updatedAt)>=time(a.updatedAt)?b:a;const attempts=[...a.attempts];for(const attempt of b.attempts){const old=attempts.find(x=>x.id===attempt.id);if(!old)attempts.push(attempt);else if(old.text!==attempt.text)attempts.push({...attempt,id:crypto.randomUUID()});else attempts[attempts.indexOf(old)]={...old,...attempt};}result.practice[id]={...pick,attempts,solvedAt:b.solvedAt||a.solvedAt,notes:a.notes===b.notes?a.notes:[b.notes,a.notes].filter(Boolean).join('\n\n[Recovered note]\n')};}
 result.oop={...recovered.oop,...current.oop};
 for(const [id,a] of Object.entries(recovered.oop||{})){const b=current.oop?.[id];if(!b)continue;const attempts=[...a.attempts];for(const attempt of b.attempts){const old=attempts.find(x=>x.id===attempt.id);if(!old)attempts.push(attempt);else if(old.text!==attempt.text)attempts.push({...attempt,id:crypto.randomUUID()});else attempts[attempts.indexOf(old)]={...old,...attempt};}result.oop[id]={...(time(b.updatedAt)>=time(a.updatedAt)?b:a),attempts};}
 result.communication={...recovered.communication,...current.communication};
 for(const [id,a] of Object.entries(recovered.communication||{})){const b=current.communication?.[id];if(!b)continue;const pick=time(b.updatedAt)>=time(a.updatedAt)?b:a;result.communication[id]={...pick,history:unique([...a.history,...b.history,{status:a.status,notes:a.notes,reply:a.reply,savedAt:a.updatedAt},{status:b.status,notes:b.notes,reply:b.reply,savedAt:b.updatedAt}])};}
 if(recovered.planning||current.planning)result.planning={dailyBudget:current.planning?.dailyBudget||recovered.planning!.dailyBudget,items:{...recovered.planning?.items,...current.planning?.items}};
 return validateProgress(result);
}
