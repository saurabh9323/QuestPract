import test from 'node:test';
import assert from 'node:assert/strict';
import {dojoChallenges} from '../lib/dojo';
import {DOJO_GRAPH_LIMITS,checkpointGraph,dojoGraphSvg,dojoStarterGraph,inspectDojoPath,parseDojoGraph,redoGraph,removeDojoNode,undoGraph,validateDojoGraph,type DojoGraph,type GraphHistory} from '../lib/dojo-workbench';

const sample=():DojoGraph=>({
  nodes:[{id:'question',label:'Question',x:20,y:40},{id:'retrieve',label:'Retriever',x:260,y:40},{id:'model',label:'Model',x:500,y:40},{id:'review',label:'Citation check',x:740,y:40}],
  edges:[{from:'question',to:'retrieve',label:'Authorized query'},{from:'retrieve',to:'model',label:'Evidence'},{from:'model',to:'review',label:'Cited answer'}],
});

test('existing graph data round-trips without changing node IDs, coordinates or optional edge labels',()=>{
  const graph=sample();graph.edges.push({from:'review',to:'model'});
  const result=parseDojoGraph(JSON.stringify(graph));
  assert.equal(result.error,'');assert.deepEqual(result.graph,graph);
  assert.notEqual(result.graph,graph);
  assert.deepEqual(parseDojoGraph(undefined),{graph:null,error:''});
  assert.deepEqual(parseDojoGraph(JSON.stringify({nodes:[],edges:[]})).graph,{nodes:[],edges:[]});
});

test('each case starts with its own components and no supplied connections',()=>{
  for(const challenge of dojoChallenges){
    const graph=dojoStarterGraph(challenge.components);
    assert.deepEqual(graph.nodes.map(node=>node.label),challenge.components);
    assert.deepEqual(graph.edges,[]);
    assert.equal(new Set(graph.nodes.map(node=>node.id)).size,graph.nodes.length);
    assert.deepEqual(validateDojoGraph(graph),graph);
  }
  assert.equal(dojoStarterGraph(dojoChallenges[0].components).nodes.some(node=>node.label==='API'),false);
});

test('malformed saved data reports an error instead of silently returning a starter',()=>{
  for(const raw of ['{','null','[]','{"nodes":{},"edges":[]}',JSON.stringify({nodes:[],edges:[{from:'ghost',to:'ghost'}]})]){
    const parsed=parseDojoGraph(raw);
    assert.equal(parsed.graph,null);assert.ok(parsed.error);
  }
  assert.match(parseDojoGraph(' '.repeat(DOJO_GRAPH_LIMITS.serialized+1)).error,/size/);
});

test('validation rejects duplicate identities, invalid coordinates and unbounded payloads',()=>{
  const graph=sample();
  assert.throws(()=>validateDojoGraph({...graph,nodes:[graph.nodes[0],graph.nodes[0]]}),/repeated ID/);
  for(const x of [NaN,Infinity,-Infinity,9001,-9001,'20']){
    assert.throws(()=>validateDojoGraph({...graph,nodes:[{...graph.nodes[0],x}]}),/canvas bounds/);
  }
  for(const label of ['', '  ', 'x'.repeat(121), '\u0000bad']){
    assert.throws(()=>validateDojoGraph({...graph,nodes:[{...graph.nodes[0],label}]}),/valid ID and a label/);
  }
  assert.throws(()=>validateDojoGraph({nodes:Array.from({length:25},(_,i)=>({...graph.nodes[0],id:String(i)})),edges:[]}),/up to 24/);
  assert.throws(()=>validateDojoGraph({...graph,edges:Array.from({length:81},()=>graph.edges[0])}),/80 connections/);
  assert.throws(()=>validateDojoGraph({...graph,edges:[{from:'question',to:'retrieve',label:42}]}),/invalid label/);
  assert.throws(()=>validateDojoGraph({...graph,edges:[{from:'question',to:'missing'}]}),/missing node/);
  assert.equal(validateDojoGraph({nodes:[{...graph.nodes[0],x:-9000,y:9000}],edges:[]}).nodes[0].x,-9000);
  const longId='"'.repeat(120);
  assert.throws(()=>validateDojoGraph({nodes:[{id:longId,label:longId,x:0,y:0}],edges:Array.from({length:80},()=>({from:longId,to:longId,label:longId}))}),/too large to save/);
});

test('directed inspection returns a shortest structural path and does not assume reverse edges',()=>{
  const graph=sample();
  assert.deepEqual(inspectDojoPath(graph,'question','review').path,['question','retrieve','model','review']);
  assert.equal(inspectDojoPath(graph,'review','question').status,'unreachable');
  const shortcut={...graph,edges:[...graph.edges,{from:'question',to:'review',label:'if authorized'}]};
  // Labels are descriptions; no execution of the apparent condition takes place.
  assert.deepEqual(inspectDojoPath(shortcut,'question','review').path,['question','review']);
});

test('inspection handles excluded nodes, alternative routes, cycles and missing endpoints',()=>{
  const graph=sample();graph.edges.push({from:'model',to:'question'},{from:'retrieve',to:'retrieve'});
  assert.equal(inspectDojoPath(graph,'question','review','retrieve').status,'unreachable');
  assert.equal(inspectDojoPath(graph,'question','review','question').status,'blocked');
  assert.equal(inspectDojoPath(graph,'question','review','review').status,'blocked');
  assert.equal(inspectDojoPath(graph,'missing','review').status,'invalid');
  assert.equal(inspectDojoPath(graph,'question','review','missing').status,'invalid');
  assert.deepEqual(inspectDojoPath(graph,'question','question').path,['question']);
  graph.edges.push({from:'question',to:'model'});
  assert.deepEqual(inspectDojoPath(graph,'question','review','retrieve').path,['question','model','review']);
});

test('deleting a node removes incoming and outgoing connections and undo restores both',()=>{
  const graph=sample(),changed=removeDojoNode(graph,'model');
  assert.deepEqual(changed.edges,[graph.edges[0]]);
  assert.equal(changed.nodes.some(node=>node.id==='model'),false);
  const history=checkpointGraph({past:[],present:graph,future:[]},changed);
  assert.deepEqual(undoGraph(history).present,graph);
  assert.deepEqual(redoGraph(undoGraph(history)).present,changed);
  assert.equal(graph.nodes.length,4);assert.equal(graph.edges.length,3);
});

test('history is bounded, ignores no-op commits and clears redo on a new branch',()=>{
  let history:GraphHistory={past:[],present:sample(),future:[]};
  assert.equal(checkpointGraph(history,sample()),history);
  assert.equal(undoGraph(history),history);assert.equal(redoGraph(history),history);
  for(let i=1;i<=50;i++)history=checkpointGraph(history,{...history.present,nodes:history.present.nodes.map((node,index)=>index===0?{...node,x:i*20}:node)});
  assert.equal(history.past.length,DOJO_GRAPH_LIMITS.history);
  assert.equal(history.present.nodes[0].x,1000);
  const undone=undoGraph(undoGraph(history));
  assert.equal(undone.present.nodes[0].x,960);
  assert.equal(undone.future.length,2);
  const branch=checkpointGraph(undone,{...undone.present,edges:[]});
  assert.equal(branch.future.length,0);
  assert.deepEqual(redoGraph(branch),branch);
  assert.equal(history.present.edges.length,3);
});

test('standalone SVG escapes labels and title and includes its own edge styling',()=>{
  const graph=sample();graph.nodes[0].label='<script>alert("x")</script>';graph.edges[0].label='A & B < C';
  const svg=dojoGraphSvg(graph,'Plan <one> & "two"');
  assert.ok(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
  assert.ok(svg.includes('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'));
  assert.ok(svg.includes('A &amp; B &lt; C'));
  assert.ok(svg.includes('Plan &lt;one&gt; &amp; &quot;two&quot;'));
  assert.ok(svg.includes('stroke="#516777"'));
  assert.equal(svg.includes('<script>'),false);
  assert.ok(dojoGraphSvg({nodes:[],edges:[]},'Empty draft').includes('viewBox="0 0 800 420"'));
});
