import {test} from 'node:test';
import assert from 'node:assert/strict';
import {flowTemplates,fromTemplate,newFlow} from '../lib/learning/flow-templates';
import {validateDocument,validateFlow} from '../lib/learning/validators';
import {layoutFlow,removeNode,checkpoint,undo,redo,type FlowHistory} from '../lib/learning/flow-editor';
import {changeLearning,readLearning} from '../lib/learning/persistence';
import {parseWorkspacePath,workspaceStaticPaths} from '../lib/workspace-routes';
test('six templates are valid editable flows with explicit branch labels and linked endpoints',()=>{
 assert.equal(flowTemplates.length,6);
 for(const t of flowTemplates){const f=fromTemplate(t.id,`test-${t.id}`);assert.doesNotThrow(()=>validateDocument({schemaVersion:1,kind:'flow',origin:'manual',status:'draft',data:f}));assert.ok(f.nodes.some(n=>n.type==='end'));for(const n of f.nodes.filter(n=>n.type==='decision'))assert.ok(f.edges.filter(e=>e.from===n.id&&e.label).length>=2);}
});
test('undo/redo restores exact graph and discards redo after an alternate edit',()=>{
 const f=fromTemplate('bfs','test-bfs'),next=removeNode(f,'pop');
 const h:FlowHistory={past:[],present:f,future:[]};const changed=checkpoint(h,next);
 assert.deepEqual(undo(changed).present,f);assert.deepEqual(redo(undo(changed)).present,next);
 assert.equal(checkpoint(undo(changed),{...f,title:'Other'}).future.length,0);
 assert.equal(next.edges.some(e=>e.from==='pop'||e.to==='pop'),false);
 assert.ok(f.nodes.some(n=>n.id==='pop'));
 let bounded=h;for(let i=0;i<50;i++)bounded=checkpoint(bounded,{...f,title:String(i)});assert.equal(bounded.past.length,30);
});
test('layout terminates on cycles and disconnected nodes, preserves semantics and keeps 80 nodes within schema bounds',()=>{
 const f=fromTemplate('bfs','test-layout');const laid=layoutFlow(f);assert.deepEqual(laid.edges,f.edges);assert.equal(laid.nodes.length,f.nodes.length);assert.doesNotThrow(()=>validateFlow(laid));
 const large={...newFlow('dsa','large'),nodes:Array.from({length:80},(_,i)=>({id:`n${i}`,type:'process',label:`N${i}`,x:0,y:0,note:'',costNote:'',lines:[]})),edges:Array.from({length:79},(_,i)=>({id:`e${i}`,from:`n${i}`,to:`n${i+1}`,label:'',condition:'',mode:'control' as const}))};
 assert.doesNotThrow(()=>validateFlow(layoutFlow(large)));assert.equal(new Set(layoutFlow(large).nodes.map(n=>`${n.x},${n.y}`)).size,80);
});
test('saved flows round-trip through existing account records without modifying Dojo work',()=>{
 const legacy={fields:{graph:'{"nodes":[],"edges":[]}'},attempts:[],updatedAt:new Date().toISOString()};
 const f=fromTemplate('dp','test-save');const state=changeLearning({'dojo-old':legacy},{save:[{schemaVersion:1,kind:'flow',origin:'manual',status:'draft',data:f}]});
 assert.deepEqual(state['dojo-old'],legacy);assert.deepEqual(readLearning(state).documents[0].document.data,f);
 assert.deepEqual(parseWorkspacePath('/flows/'),{view:'flows'});assert.ok(workspaceStaticPaths.some(p=>p.join('/')==='flows'));assert.deepEqual(parseWorkspacePath('/dojo/'),{view:'dojo'});
});

test('question briefs survive account persistence and remain optional for old diagrams',()=>{
 const legacy=newFlow('dsa','legacy');assert.doesNotThrow(()=>validateFlow(legacy));
 for(const mode of ['linked','custom'] as const){
  const data={...legacy,links:[{kind:'question' as const,id:'two-sum',label:'Two Sum'}],brief:{mode,title:'Pair finder',question:'Find a pair',explanation:'Return indices',approach:'Keep seen values in a Map'}};
  const doc=validateDocument({schemaVersion:1,kind:'flow',origin:'manual',status:'draft',data});
  const saved=readLearning(changeLearning({}, {save:[doc]})).documents[0].document;
  assert.deepEqual(saved.data,data);
  assert.throws(()=>validateFlow({...data,brief:{...data.brief,approach:'x'.repeat(4001)}}));
  assert.throws(()=>validateFlow({...data,brief:{...data.brief,mode:'unsafe'}}));
 }
});
