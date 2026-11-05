import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dojoChallenges} from '../lib/dojo';
import {blankStudio,type StudioRecord} from '../lib/studio-state';
import {designVersion,currentReview,reviewSignature,statusOf,nextSection,orderedCases} from '../lib/dojo-course';
import {dojoTutorDraft} from '../lib/dojo-tutor';
const at='2026-11-05T10:00:00.000Z';
function design():StudioRecord {
  const fields={graph:'{"nodes":[],"edges":[]}',evidence:'Observed fallback',decision:'Bound load',interview:'My choice',check0:'yes'};
  return {fields,updatedAt:at,attempts:[{id:'v1',at,fields:{...fields},outcome:'Design checkpoint',hints:0}]};
}
function experiment():StudioRecord {
  return {fields:{reflection:'This assumes fixed capacity'},updatedAt:at,attempts:[{id:'x1',at,fields:{result:'Queue grows'},outcome:'Model experiment · prediction matched',hints:0}]};
}
test('keeps original reviewed cases and distinguishes drafts from saved versions',()=>{
  assert.equal(currentReview({...blankStudio(),fields:{reviewed:'yes'}}),true);
  const empty=blankStudio();
  assert.equal(statusOf(empty,empty),'New');
  assert.equal(nextSection(empty,empty),'Lesson');
  const r=design();
  assert.equal(nextSection(r,empty),'Failure lab');
  assert.equal(nextSection(r,experiment()),'Interview review');
  r.attempts[0].outcome='Recovered earlier draft';
  assert.equal(designVersion(r),undefined);
  assert.equal(statusOf(r,empty),'In progress');
});
test('a review belongs to the exact saved design, evidence, answer and experiment',()=>{
  const r=design(),lab=experiment();
  r.fields={...r.fields,reviewed:'yes',reviewVersion:'v1',reviewEvidence:r.fields.evidence,reviewSignature:reviewSignature(r,lab)};
  assert.equal(currentReview(r,lab),true);
  assert.equal(statusOf(r,lab),'Self-reviewed');
  for(const field of ['graph','evidence','interview','check0','decision']){
    const changed={...r,fields:{...r.fields,[field]:'changed'}};
    assert.equal(currentReview(changed,lab),false,field);
  }
  assert.equal(currentReview(r,{...lab,fields:{reflection:'Another finding'}}),false);
  assert.equal(currentReview(r,{...lab,attempts:[...lab.attempts,{...lab.attempts[0],id:'x2'}]}),false);
  assert.equal(currentReview({...r,fields:{...r.fields,lessonRead:'yes'}},lab),true);
});
test('ordering groups difficulties without mutating the catalog',()=>{
  const original=dojoChallenges.slice();
  const sorted=orderedCases(dojoChallenges);
  assert.deepEqual(dojoChallenges,original);
  assert.equal(sorted[0].level,'Easy');
  assert.equal(sorted.at(-1)?.level,'Hard');
  assert.equal(new Set(sorted.map(c=>c.id)).size,original.length);
});
test('tutor payload fits existing limits, shows trimming and excludes unrelated history',()=>{
  const r=design(),lab=experiment();
  r.fields={...r.fields,graph:'g'.repeat(40000),decision:'d'.repeat(40000),evidence:'e'.repeat(40000),interview:'i'.repeat(40000),flow:'f'.repeat(40000),secret:'DO_NOT_INCLUDE'};
  lab.fields.reflection='r'.repeat(40000);
  const out=dojoTutorDraft(dojoChallenges[0],r,lab,'review');
  assert.ok(out.trimmed);
  assert.ok(out.context.length<=1600);
  assert.ok(out.prompt.length<=4000);
  assert.ok(out.prompt.includes('Context trimmed'));
  assert.ok(!out.prompt.includes('DO_NOT_INCLUDE'));
  const hint=dojoTutorDraft(dojoChallenges[0],r,lab,'hint');
  assert.ok(hint.prompt.includes('Socratic'));
  assert.ok(!hint.prompt.includes('Diagram JSON'));
});
