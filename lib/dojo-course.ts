import type {StudioRecord} from './studio-state';
import type {DojoChallenge} from './dojo';

export const levels=['Easy','Medium','Hard'];
export const sections=['Lesson','Workbench','Failure lab','Interview review'] as const;
export type Section=typeof sections[number];
export function orderedCases(items:DojoChallenge[]) {
  return [...items].sort((a,b)=>levels.indexOf(a.level)-levels.indexOf(b.level));
}
export function designVersion(record:StudioRecord) {
  return record.attempts.filter(a=>a.fields.graph && a.outcome==='Design checkpoint').at(-1);
}
export function experimentVersion(record:StudioRecord) {
  return record.attempts.filter(a=>a.outcome.startsWith('Model experiment')).at(-1);
}
// A compact change indicator, not a signature or an automated correctness check.
export function reviewSignature(record:StudioRecord,experiment:StudioRecord) {
  const fields=Object.entries(record.fields).filter(([k])=>!k.startsWith('review')&&!['hintViewed','referenceViewed','lessonRead'].includes(k)).sort(([a],[b])=>a.localeCompare(b));
  const text=JSON.stringify([fields,experimentVersion(experiment)?.id,experiment.fields.reflection||'']);
  let hash=2166136261;
  for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619);
  return text.length+':'+(hash>>>0).toString(16);
}
export function currentReview(record:StudioRecord,experiment?:StudioRecord) {
  if(record.fields.reviewed!=='yes')return false;
  // Original Dojo completions predate reviewVersion. Keep that history intact.
  if(!record.fields.reviewVersion)return true;
  const version=designVersion(record);
  return Boolean(version && version.id===record.fields.reviewVersion &&
    version.fields.graph===record.fields.graph && record.fields.evidence===record.fields.reviewEvidence &&
    (!record.fields.reviewSignature || (experiment && record.fields.reviewSignature===reviewSignature(record,experiment))));
}
export function statusOf(record:StudioRecord,experiment:StudioRecord) {
  if(currentReview(record,experiment))return 'Self-reviewed';
  if(record.attempts.length||experiment.attempts.length||Object.keys(record.fields).length||Object.keys(experiment.fields).length)return 'In progress';
  return 'New';
}
export function nextSection(record:StudioRecord,experiment:StudioRecord):Section {
  if(!designVersion(record)) return Object.keys(record.fields).length?'Workbench':'Lesson';
  return experimentVersion(experiment)?'Interview review':'Failure lab';
}
