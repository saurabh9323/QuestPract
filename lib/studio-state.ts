export type StudioAttempt={id:string;at:string;fields:Record<string,string>;outcome:string;hints:number};
export type StudioRecord={fields:Record<string,string>;attempts:StudioAttempt[];updatedAt:string};
export type StudioState=Record<string,StudioRecord>;
export const blankStudio=():StudioRecord=>({fields:{},attempts:[],updatedAt:''});
function fields(value:unknown){return !!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length<=60&&Object.entries(value).every(([k,v])=>/^[a-zA-Z0-9_-]{1,60}$/.test(k)&&typeof v==='string'&&v.length<=40000)}
export function validateStudio(value:unknown){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length>2000)throw new Error('Invalid studio data.');
 for(const [id,r] of Object.entries(value as StudioState)){
  if(!/^[a-z0-9-]{1,120}$/.test(id)||!r||!fields(r.fields)||typeof r.updatedAt!=='string'||!Number.isFinite(Date.parse(r.updatedAt))||!Array.isArray(r.attempts)||r.attempts.length>200)throw new Error('Invalid studio record.');
  const seen=new Set<string>();for(const a of r.attempts){if(!a||typeof a.id!=='string'||!a.id||a.id.length>120||seen.has(a.id)||typeof a.at!=='string'||!Number.isFinite(Date.parse(a.at))||!fields(a.fields)||typeof a.outcome!=='string'||a.outcome.length>2000||!Number.isInteger(a.hints)||a.hints<0||a.hints>100)throw new Error('Invalid studio attempt.');seen.add(a.id)}
 }
}
function finishedTournament(value:Record<string,string>):boolean{
 if(value.type!=='scenario-tournament'||value.status!=='finished'||!Number.isFinite(Date.parse(value.finishedAt)))return false;
 try{
  const problems:unknown=JSON.parse(value.problems),results:unknown=JSON.parse(value.result),answers:unknown=JSON.parse(value.answers),scratch:unknown=JSON.parse(value.scratch);
  const stringMap=(v:unknown)=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.values(v).every(x=>typeof x==='string');
  if(!Array.isArray(problems)||!problems.length||problems.length>8||!Array.isArray(results)||results.length!==problems.length||!stringMap(answers)||!stringMap(scratch))return false;
  const ids=new Set<string>();
  for(const [index,problem] of problems.entries()){
   const result=results[index];
   if(!problem||typeof problem.id!=='string'||ids.has(problem.id)||typeof problem.title!=='string'||!('input' in problem)||!('expected' in problem)||!result||result.id!==problem.id||typeof result.submitted!=='string'||typeof result.correct!=='boolean'||typeof result.validJson!=='boolean'||!Number.isFinite(result.points))return false;
   ids.add(problem.id);
  }
  return true;
 }catch{return false}
}
export function mergeStudio(a:StudioState={},b:StudioState={}):StudioState{
 const result={...a,...b};
 for(const [id,old] of Object.entries(a)){
  const current=b[id];if(!current)continue;
  let latest=Date.parse(current.updatedAt)>=Date.parse(old.updatedAt)?current:old;
  // A later draft recovered from another device must not reopen a submitted round.
  // Ordinary studio tools and two completed rounds keep their timestamp merge rule.
  const other=latest===current?old:current;
  if(latest.fields.type==='scenario-tournament'&&latest.fields.status==='active'&&finishedTournament(other.fields))latest=other;
  const attempts=[...old.attempts];
  for(const entry of current.attempts){
   const match=attempts.find(x=>x.id===entry.id);
   if(!match)attempts.push(entry);
   else if(JSON.stringify(match)!==JSON.stringify(entry))attempts.push({...entry,id:crypto.randomUUID()});
  }
  if(JSON.stringify(current.fields)!==JSON.stringify(old.fields)){
   const earlier=latest===current?old:current;
   const preserved=attempts.some(x=>x.at===earlier.updatedAt&&JSON.stringify(x.fields)===JSON.stringify(earlier.fields));
   if(!preserved)attempts.push({id:crypto.randomUUID(),at:earlier.updatedAt,fields:earlier.fields,outcome:latest.fields.type==='scenario-tournament'?'Recovered tournament snapshot':'Recovered earlier draft',hints:0});
  }
  result[id]={...latest,attempts};
 }
 validateStudio(result);return result;
}
