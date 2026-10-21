import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateDocument,validateFlow,validateStrokeDocument,validateCard,validateSession} from '../lib/learning/validators';
import type {LearningDocument,Flow,Card,SessionPlan,StrokeDocument} from '../lib/learning/types';
import {changeLearning,readLearning,exportLearning,parseLearningBackup,documentKey} from '../lib/learning/persistence';
import {mergeStudio} from '../lib/studio-state';
import {freshProgress,validateProgress} from '../lib/progress';
import {learningCounts} from '../lib/learning/analytics';
import {boundedContext,AI_CONTEXT_CAP,prepareLearningRequest,aiFailure} from '../lib/learning/gemini';
import {readCoachPack} from '../lib/coach-contract';
import {checkCitations} from '../lib/learning/citations';
import {playgroundModules} from '../lib/playground/modules';
const at='2026-10-20T10:00:00.000Z';
const link={kind:'module' as const,id:'two-pointers',label:'Two pointers'};
const flow:Flow={id:'test-flow',title:'My plan',domain:'dsa',nodes:[{id:'start',type:'start',label:'Start',x:0,y:0,note:'',costNote:'',lines:[]}],edges:[],tags:['array'],links:[link],versions:[],createdAt:at,updatedAt:at};
const doc:LearningDocument={schemaVersion:1,kind:'flow',origin:'manual',status:'draft',data:flow};
const card:Card={id:'test-card',title:'Next value',topic:'Arrays',kind:'next-step',prompt:'What next?',answer:'2',source:link,evidence:{origin:'trace',excerpt:'i becomes 2',step:2},status:'draft'};
const plan:SessionPlan={id:'test-plan',title:'Practice',minutes:30,items:[{id:'one',source:link,minutes:10,reason:'review'}],status:'draft'};
const drawing:StrokeDocument={id:'test-ink',title:'My ink',host:link,strokes:[{id:'s1',tool:'pen',color:'#223344',width:2,points:[[0,0,0.5,0],[10,10,0.8,12]],t:0,text:''}]};
test('all five versioned document schemas round-trip without running or scheduling content',()=>{
  for(const candidate of [doc,{...doc,kind:'module',data:playgroundModules[0]},{...doc,kind:'card',data:card},{...doc,kind:'session',data:plan},{...doc,kind:'stroke',data:drawing}]){
    assert.deepEqual(validateDocument(candidate),candidate);
  }
  const cloned=validateDocument(doc);cloned.data.title='Changed';
  assert.equal(flow.title,'My plan');
  assert.throws(()=>validateDocument({...doc,schemaVersion:2}));
  assert.throws(()=>validateDocument({...doc,status:'verified'}));
  assert.throws(()=>validateDocument({...doc,data:{...flow,constructor:'unsafe'}}));
  assert.throws(()=>validateDocument({...doc,data:{...flow,title:'x'.repeat(31000)}}));
});
test('flow schema enforces IDs, domains, endpoints and finite geometry, without claiming structural correctness',()=>{
  assert.doesNotThrow(()=>validateFlow(flow)); // start-only is a valid draft, not a valid solution.
  assert.throws(()=>validateFlow({...flow,nodes:[flow.nodes[0],flow.nodes[0]]}));
  assert.throws(()=>validateFlow({...flow,domain:'react'}));
  assert.throws(()=>validateFlow({...flow,nodes:[{...flow.nodes[0],x:Infinity}]}));
  assert.throws(()=>validateFlow({...flow,edges:[{id:'e',from:'start',to:'missing',label:'',condition:'',mode:'control'}]}));
  assert.throws(()=>validateFlow({...flow,nodes:[{...flow.nodes[0],lines:[1.2]}]}));
});
test('strokes reject excess points, unsafe colors, invalid pressure and reversed time',()=>{
  assert.doesNotThrow(()=>validateStrokeDocument(drawing));
  for(const patch of [{color:'url(javascript:alert(1))'},{points:[[0,0,2,0]]},{points:[[0,0,1,10],[1,1,1,0]]},{points:Array(2001).fill([0,0,1,0])}]){
    assert.throws(()=>validateStrokeDocument({...drawing,strokes:[{...drawing.strokes[0],...patch}]}));
  }
});
test('cards preserve provenance and imported sessions cannot exceed their time budget or apply schedules',()=>{
  assert.doesNotThrow(()=>validateCard(card));assert.doesNotThrow(()=>validateSession(plan));
  assert.throws(()=>validateCard({...card,status:'correct'}));
  assert.throws(()=>validateDocument({...doc,kind:'card',origin:'ai',data:card}));
  assert.doesNotThrow(()=>validateDocument({...doc,kind:'card',origin:'ai',data:{...card,evidence:{...card.evidence,origin:'ai-draft'}}}));
  assert.throws(()=>validateSession({...plan,items:[{...plan.items[0],minutes:31}]}));
  assert.throws(()=>validateSession({...plan,status:'scheduled'}));
});
test('learning writes and backup imports are bounded, atomic and preserve unrelated account progress',()=>{
  const unrelated={fields:{answer:'keep'},attempts:[],updatedAt:at};
  const state=changeLearning({existing:unrelated},{save:[doc]},at);
  assert.deepEqual(state.existing,unrelated);
  assert.equal(readLearning(state).documents.length,1);
  assert.doesNotThrow(()=>validateProgress({...freshProgress(),studio:state}));
  assert.deepEqual(parseLearningBackup(JSON.stringify(exportLearning(state,at))),[doc]);
  assert.throws(()=>parseLearningBackup(JSON.stringify({...exportLearning(state,at),documents:[doc,doc]})));
  assert.throws(()=>changeLearning(state,{save:[doc,{...doc,schemaVersion:2} as unknown as LearningDocument]},at));
  assert.equal(readLearning(state).documents.length,1);
  assert.throws(()=>changeLearning(state,{remove:['existing']},at));
  assert.throws(()=>parseLearningBackup(' '.repeat(1000001)));
});
test('deleted drafts do not reappear from stale-device merge or recovered attempt history',()=>{
  const original=changeLearning({},{save:[doc]},at),key=documentKey(doc);
  const deleted=changeLearning(original,{remove:[key]},'2026-10-20T11:00:00.000Z');
  for(const merged of [mergeStudio(original,deleted),mergeStudio(deleted,original)]){
    assert.equal(readLearning(merged).documents.length,0);
    assert.deepEqual(merged[key].attempts,[]);
    assert.equal(merged[key].fields.document,undefined);
  }
  assert.throws(()=>changeLearning(deleted,{save:[doc]}));
});
test('analytics excludes invalid and removed drafts and counts AI drafts without grading them',()=>{
  const state=changeLearning({},{save:[doc,{...doc,data:{...flow,id:'ai-flow'},origin:'ai'}]},at);
  assert.equal(learningCounts(state).total,2);
  assert.equal(learningCounts(state).aiDrafts,1);
  state['learning-flow-broken']={fields:{document:'{'},attempts:[],updatedAt:at};
  assert.equal(learningCounts(state).invalid,1);
  assert.equal(learningCounts(state).total,2);
});
test('bounded AI context preserves selected evidence and flags trimming even with escaped characters',()=>{
  const context=boundedContext({topic:'array',summary:'"\\\n'.repeat(3000),code:'\u0000'.repeat(9000),pinned:'x'.repeat(500),evidence:Array.from({length:100},(_,i)=>({kind:'step' as const,id:String(i),summary:'\u0000'.repeat(2000)}))});
  assert.ok(context.text.length<=AI_CONTEXT_CAP);
  assert.equal(context.trimmed,true);assert.equal(JSON.parse(context.text).contextTrimmed,true);
  assert.ok(context.scope.steps?.includes(0));
  const request=prepareLearningRequest({title:'Review',instruction:'Explain the step.',context,thread:'playground-chat-test',requestId:'unit-request',at});
  const pack=readCoachPack(request.fields.pack)!;
  assert.ok(pack);assert.equal(pack.input.previous,'');
  assert.equal(request.fields.cloudStatus,'pending');
  assert.ok(!('completedAt' in request.fields));
  assert.throws(()=>prepareLearningRequest({title:'x',instruction:'x',context:{...context,text:'x'.repeat(3801)},thread:'t',requestId:'r',at}));
});
test('shared citation checker flags unknown steps, nodes, items and malicious IDs',()=>{
  const parts=checkCitations('Try [step 2] [node node-a] [item card-a] [step 99] [node javascript:bad] [item missing]',{steps:[2],nodes:['node-a'],items:['card-a']}).filter(p=>p.kind!==null);
  assert.deepEqual(parts.map(p=>p.valid),[true,true,true,false,false,false]);
  assert.equal(checkCitations('[step -1]',{steps:[2]})[0].valid,false);
  assert.match(aiFailure('AbortError'),/timed out/);assert.match(aiFailure('429 quota exceeded'),/rate limit/);assert.match(aiFailure('Failed to fetch'),/origin/);
});
