import type {LabModule,Value} from './types';

export function validValue(value:unknown,depth=0):value is Value {
  if(depth>6)return false;
  if(value===null||typeof value==='boolean')return true;
  if(typeof value==='number')return Number.isFinite(value);
  if(typeof value==='string')return value.length<=1000;
  if(Array.isArray(value))return value.length<=128&&value.every(v=>validValue(v,depth+1));
  return !!value&&typeof value==='object'&&Object.keys(value).length<=32&&Object.entries(value).every(([k,v])=>!['__proto__','constructor','prototype'].includes(k)&&validValue(v,depth+1));
}
export function validateModule(value:unknown):LabModule {
  if(!value||typeof value!=='object')throw new Error('Module must be an object.');
  const m=value as LabModule;
  if(!/^[a-z0-9-]{1,60}$/.test(m.id)||!['title','topic','goal','expectedPattern'].every(k=>typeof m[k as keyof LabModule]==='string'&&(m[k as keyof LabModule] as string).length>0&&(m[k as keyof LabModule] as string).length<=1000))throw new Error('Invalid module identity or description.');
  if(typeof m.starterCode!=='string'||!m.starterCode.trim()||m.starterCode.length>10000)throw new Error('Code must contain 1–10,000 characters.');
  if(!Array.isArray(m.inputs)||m.inputs.length>8||!validValue(m.inputs))throw new Error('Invalid module inputs.');
  if(!Array.isArray(m.hints)||m.hints.length!==4||!m.hints.every(h=>typeof h==='string'&&h.length<=1000))throw new Error('Exactly four bounded hints are required.');
  if(!Array.isArray(m.tests)||m.tests.length<1||m.tests.length>12||!m.tests.every(t=>t&&typeof t.name==='string'&&t.name.length<=100&&Array.isArray(t.args)&&t.args.length<=8&&validValue(t.args)&&validValue(t.expected)))throw new Error('Invalid tests.');
  if(!Array.isArray(m.renderers)||!m.renderers.length||!m.renderers.every(r=>['array','variables'].includes(r)))throw new Error('Unsupported renderer.');
  return m;
}
