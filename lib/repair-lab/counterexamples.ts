type Result = number | boolean | number[] | null;
type Rule = (values:number[]) => Result;
type Patch = {label:string; code:string; run:Rule};
export type Experiment = {
  id:string; title:string; contract:string; seed:number[]; bug:Patch;
  patches:Patch[]; expected:Rule; checks:number[][]; hint:string; transfer:string;
};

const pairOracle:Rule = values => values.some((n,i)=>values.slice(i+1).some(m=>m+n===10));
const orderedDistinct:Rule = values => values.filter((n,i)=>values.indexOf(n)===i);
const bestThree:Rule = values => values.length<3?null:Math.max(...values.slice(2).map((v,i)=>v+values[i]+values[i+1]));

export const experiments:Experiment[]=[
  {id:'two-seats',title:'Two seats, one ticket?',contract:'Can two different positions in the list add up to 10? Equal values are allowed if they occupy different positions.',
    seed:[2,8],bug:{label:'Search every value at once',code:'const all = new Set(values);\nreturn values.some(n => all.has(10 - n));',run:values=>{const all=new Set(values);return values.some(n=>all.has(10-n))}},
    patches:[
      {label:'Rule out equal values',code:'return values.some(n => n !== 5 && values.includes(10 - n));',run:values=>values.some(n=>n!==5&&values.includes(10-n))},
      {label:'Remember earlier positions',code:'const seen = new Set();\nfor (const n of values) {\n  if (seen.has(10 - n)) return true;\n  seen.add(n);\n}\nreturn false;',run:values=>{const seen=new Set<number>();for(const n of values){if(seen.has(10-n))return true;seen.add(n)}return false}},
    ],expected:pairOracle,checks:[[],[5],[5,5],[2,8],[-1,11],[2,1]],hint:'What if the complement exists only at the position you are checking?',transfer:'What if the task asks for the indices instead of yes or no? What extra information would you store?'},
  {id:'retry-log',title:'The retry that slipped through',contract:'A service receives numeric delivery IDs. Return each ID once, in the order it first arrived.',
    seed:[1,1,2],bug:{label:'Ignore adjacent retries',code:'return ids.filter((id,i) => i === 0 || id !== ids[i-1]);',run:ids=>ids.filter((id,i)=>i===0||id!==ids[i-1])},
    patches:[
      {label:'Track every accepted ID',code:'return [...new Set(ids)];',run:ids=>[...new Set(ids)]},
      {label:'Sort unique IDs',code:'return [...new Set(ids)].sort((a,b) => a-b);',run:ids=>[...new Set(ids)].sort((a,b)=>a-b)},
    ],expected:orderedDistinct,checks:[[],[1],[1,1],[1,2,1],[8,3,8],[4,2,4,1]],hint:'Can another delivery arrive between two copies of the same ID?',transfer:'If the service restarts between deliveries, what happens to an in-memory Set?'},
  {id:'power-window',title:'The missing energy reading',contract:'Return the largest sum of exactly three consecutive meter readings. Values may be negative. Return null if there are fewer than three readings.',
    seed:[1,3,2,4],bug:{label:'Start the maximum at zero',code:'if (v.length < 3) return null;\nlet best = 0;\nfor (let i=2; i<v.length; i++) best = Math.max(best, v[i]+v[i-1]+v[i-2]);\nreturn best;',run:v=>{if(v.length<3)return null;let best=0;for(let i=2;i<v.length;i++)best=Math.max(best,v[i]+v[i-1]+v[i-2]);return best}},
    patches:[
      {label:'Initialize from an actual window',code:'if (v.length < 3) return null;\nlet sum=v[0]+v[1]+v[2], best=sum;\nfor (let i=3;i<v.length;i++) {\n  sum += v[i]-v[i-3];\n  best = Math.max(best,sum);\n}\nreturn best;',run:v=>{if(v.length<3)return null;let sum=v[0]+v[1]+v[2],best=sum;for(let i=3;i<v.length;i++){sum+=v[i]-v[i-3];best=Math.max(best,sum)}return best}},
      {label:'Take the three highest readings',code:'return v.length<3 ? null : [...v].sort((a,b)=>b-a).slice(0,3).reduce((a,b)=>a+b,0);',run:v=>v.length<3?null:[...v].sort((a,b)=>b-a).slice(0,3).reduce((a,b)=>a+b,0)},
    ],expected:bestThree,checks:[[],[1,2],[-2,-4,-1],[9,0,0,8,7],[0,0,0],[1,2,3,4]],hint:'Can zero win even when no three consecutive readings sum to zero?',transfer:'How would your approach change if readings arrived one at a time and you could not keep the full array?'},
];

export function readProbe(raw:string):number[] {
  const message='Enter a JSON array of up to 20 whole numbers between -1000 and 1000, for example [1,2,1].';
  let parsed:unknown;
  try {parsed=JSON.parse(raw)} catch {throw new Error(message)}
  if(!Array.isArray(parsed)||parsed.length>20||parsed.some(v=>!Number.isInteger(v)||Math.abs(v)>1000)) throw new Error(message);
  return parsed;
}
export function observe(experiment:Experiment,input:number[],rule:Rule) {
  const expected=experiment.expected(input);
  const actual=rule(input);
  return {input,expected,actual,match:JSON.stringify(expected)===JSON.stringify(actual)};
}
