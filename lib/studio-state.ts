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
export function mergeStudio(a:StudioState={},b:StudioState={}):StudioState{
 const result={...a,...b};
 for(const [id,old] of Object.entries(a)){
  const current=b[id];if(!current)continue;
  const latest=Date.parse(current.updatedAt)>=Date.parse(old.updatedAt)?current:old;
  const attempts=[...old.attempts];
  for(const entry of current.attempts){
   const match=attempts.find(x=>x.id===entry.id);
   if(!match)attempts.push(entry);
   else if(JSON.stringify(match)!==JSON.stringify(entry))attempts.push({...entry,id:crypto.randomUUID()});
  }
  if(JSON.stringify(current.fields)!==JSON.stringify(old.fields)){
   const earlier=latest===current?old:current;
   const preserved=attempts.some(x=>x.at===earlier.updatedAt&&JSON.stringify(x.fields)===JSON.stringify(earlier.fields));
   if(!preserved)attempts.push({id:crypto.randomUUID(),at:earlier.updatedAt,fields:earlier.fields,outcome:'Recovered earlier draft',hints:0});
  }
  result[id]={...latest,attempts};
 }
 validateStudio(result);return result;
}
