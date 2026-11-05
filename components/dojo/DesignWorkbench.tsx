'use client';

import {useEffect,useRef,useState} from 'react';
import type {DojoChallenge} from '@/lib/dojo';
import type {StudioAttempt} from '@/lib/studio-state';
import {DOJO_GRAPH_LIMITS,checkpointGraph,dojoGraphSvg,dojoStarterGraph,inspectDojoPath,parseDojoGraph,redoGraph,removeDojoNode,undoGraph,validateDojoGraph,type DojoGraph,type GraphHistory} from '@/lib/dojo-workbench';
import FlowCanvas from '../learning/FlowCanvas';
import {saveFile,useStudio} from '../studio/StudioContext';
import '@/app/dojo-workbench.css';

const designFields=[
  {name:'requirements',label:'Requirements and boundaries',placeholder:'What must this system do? What is deliberately outside the scope?'},
  {name:'decision',label:'Choices and tradeoffs',placeholder:'I chose… because… An alternative would be…'},
  {name:'flow',label:'Data and failure paths',placeholder:'What crosses each arrow? Explain identities, failures and retry behavior.'},
  {name:'estimate',label:'Assumptions and estimates',placeholder:'State quantities, units and assumptions. What would you measure?'},
] as const;

export default function DesignWorkbench({challenge,recordId}:{challenge:DojoChallenge;recordId:string}) {
  return <WorkbenchEditor key={`${recordId}-${challenge.id}`} challenge={challenge} recordId={recordId}/>;
}

function WorkbenchEditor({challenge,recordId}:{challenge:DojoChallenge;recordId:string}) {
  const {get,patch,submit}=useStudio(),record=get(recordId);
  const [initial]=useState(()=>{
    const saved=parseDojoGraph(record.fields.graph);
    return {graph:saved.graph||(saved.error?{nodes:[],edges:[]}:dojoStarterGraph(challenge.components)),error:saved.error};
  });
  const [history,setHistory]=useState<GraphHistory>({past:[],present:initial.graph,future:[]});
  const [preview,setPreview]=useState<DojoGraph|null>(null),[loadError,setLoadError]=useState(initial.error),[error,setError]=useState('');
  const [dirty,setDirty]=useState(false),[message,setMessage]=useState('');
  const graph=preview||history.present,live=useRef(graph),historyRef=useRef(history),lastStored=useRef(record.fields.graph);
  live.current=graph;historyRef.current=history;
  const [selected,setSelected]=useState(initial.graph.nodes[0]?.id||''),[nodeLabel,setNodeLabel]=useState(initial.graph.nodes[0]?.label||'');
  const [customLabel,setCustomLabel]=useState(''),[from,setFrom]=useState(initial.graph.nodes[0]?.id||''),[to,setTo]=useState(initial.graph.nodes[1]?.id||'');
  const [connectionLabel,setConnectionLabel]=useState(''),[edgeIndex,setEdgeIndex]=useState(-1),[edgeLabel,setEdgeLabel]=useState('');
  const [pathFrom,setPathFrom]=useState(initial.graph.nodes[0]?.id||''),[pathTo,setPathTo]=useState(initial.graph.nodes.at(-1)?.id||'');
  const [excluded,setExcluded]=useState(''),[showInspection,setShowInspection]=useState(false);
  const node=graph.nodes.find(n=>n.id===selected),edge=graph.edges[edgeIndex];
  const versions=record.attempts.filter(attempt=>attempt.fields.graph).slice().reverse();
  const validNode=(id:string)=>graph.nodes.some(n=>n.id===id)?id:'';
  const inspection=showInspection?inspectDojoPath(graph,pathFrom,pathTo,excluded):null;
  const nodeName=(id:string)=>graph.nodes.find(n=>n.id===id)?.label||id;

  useEffect(()=>{setNodeLabel(node?.label||'')},[node?.id,node?.label]);
  useEffect(()=>{setEdgeLabel(edge?.label||'')},[edgeIndex,edge?.from,edge?.to,edge?.label]);
  useEffect(()=>{
    if(record.fields.graph===lastStored.current)return;
    lastStored.current=record.fields.graph;
    if(dirty){setError('A saved diagram changed while local edits were waiting to save. Export your local diagram before loading the saved draft.');return}
    const saved=parseDojoGraph(record.fields.graph);
    const next=saved.graph||(saved.error?{nodes:[],edges:[]}:dojoStarterGraph(challenge.components));
    setHistory({past:[],present:next,future:[]});setPreview(null);setLoadError(saved.error);setSelected(next.nodes[0]?.id||'');setEdgeIndex(-1);setShowInspection(false);
  },[record.fields.graph,dirty,challenge.components]);
  useEffect(()=>{
    if(!dirty)return;
    const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue=''};
    window.addEventListener('beforeunload',warn);
    return()=>window.removeEventListener('beforeunload',warn);
  },[dirty]);

  function storeGraph(next:DojoGraph) {
    const raw=JSON.stringify(next);
    const previous=parseDojoGraph(get(recordId).fields.graph).graph;
    const changed=!previous||JSON.stringify(previous)!==raw;
    if(!patch(recordId,{graph:raw,...(changed?{reviewed:'no'}:{})})){setDirty(true);setError('The diagram could not be saved. Your local edits are still here; export them or retry saving.');return false}
    lastStored.current=raw;setDirty(false);setError('');return true;
  }
  function change(next:DojoGraph,commit=true) {
    if(loadError)return;
    try{
      const checked=validateDojoGraph(next);
      live.current=checked;setShowInspection(false);setMessage('');
      if(!commit){setPreview(checked);return}
      const nextHistory=checkpointGraph(historyRef.current,checked);
      historyRef.current=nextHistory;setHistory(nextHistory);setPreview(null);storeGraph(checked);
    }catch(cause){setError(cause instanceof Error?cause.message:'This diagram could not be changed.')}
  }
  function travel(direction:'undo'|'redo') {
    const next=direction==='undo'?undoGraph(historyRef.current):redoGraph(historyRef.current);
    historyRef.current=next;live.current=next.present;setHistory(next);setPreview(null);setEdgeIndex(-1);setShowInspection(false);storeGraph(next.present);
  }
  function add(label:string,x?:number,y?:number) {
    if(loadError||live.current.nodes.length>=DOJO_GRAPH_LIMITS.nodes||!label.trim())return;
    const count=live.current.nodes.length,id=crypto.randomUUID(),bound=(value:number)=>Math.max(-9000,Math.min(9000,value));
    change({...live.current,nodes:[...live.current.nodes,{id,label:label.trim().slice(0,DOJO_GRAPH_LIMITS.label),x:bound(x??40+(count%3)*240),y:bound(y??50+Math.floor(count/3)*150)}]});
    setSelected(id);setCustomLabel('');
  }
  function drop(label:string,x:number,y:number) {if(challenge.components.includes(label))add(label,x,y)}
  function connect(source:string,target:string,label='') {
    const current=live.current;
    if(current.edges.length>=DOJO_GRAPH_LIMITS.edges||!current.nodes.some(n=>n.id===source)||!current.nodes.some(n=>n.id===target))return;
    if(current.edges.some(e=>e.from===source&&e.to===target)){setMessage('These nodes are already connected. Select that connection below to edit its label.');return}
    change({...current,edges:[...current.edges,{from:source,to:target,label}]});setEdgeIndex(current.edges.length);setConnectionLabel('');setMessage('Connection added. Label what crosses this boundary.');
  }
  function remove(id:string) {change(removeDojoNode(live.current,id));setSelected('');setEdgeIndex(-1);if(excluded===id)setExcluded('')}
  function saveVersion() {
    if(loadError)return;
    const current=live.current;
    // patch is synchronous and may reject a write; never submit a stale snapshot.
    if(!storeGraph(current))return;
    const next=checkpointGraph(historyRef.current,current);historyRef.current=next;setHistory(next);setPreview(null);
    if(submit(recordId,'Design checkpoint'))setMessage('Design version recorded with this exact diagram and your notes. Check the account save status.');
  }
  function restore(version?:StudioAttempt) {
    const saved=version?parseDojoGraph(version.fields.graph):{graph:dojoStarterGraph(challenge.components),error:''};
    if(!saved.graph){setError(saved.error);return}
    // Preserve the current graph and notes, including unreadable legacy data.
    if(!loadError&&!storeGraph(live.current))return;
    if(!submit(recordId,'Before restoring earlier diagram'))return;
    const fields:Record<string,string>={graph:JSON.stringify(saved.graph),reviewed:'no'};
    if(version)for(const field of designFields)fields[field.name]=version.fields[field.name]||'';
    if(!patch(recordId,fields)){setError('The earlier draft was preserved, but the restore could not be saved.');return}
    lastStored.current=fields.graph;
    const next=loadError?{past:[],present:saved.graph,future:[]}:checkpointGraph(historyRef.current,saved.graph);
    historyRef.current=next;live.current=saved.graph;setHistory(next);setPreview(null);setLoadError('');setDirty(false);setError('');setSelected(saved.graph.nodes[0]?.id||'');setEdgeIndex(-1);setShowInspection(false);
    setMessage('Draft restored. The diagram and notes you replaced remain in saved versions.');
  }
  function loadSaved() {
    const saved=parseDojoGraph(get(recordId).fields.graph);
    if(!saved.graph){setError(saved.error||'There is no saved diagram to load.');return}
    const next=checkpointGraph(historyRef.current,saved.graph);historyRef.current=next;live.current=saved.graph;setHistory(next);setPreview(null);setDirty(false);setError('');setLoadError('');setEdgeIndex(-1);setShowInspection(false);
    setMessage('Saved diagram loaded. Previous local diagram remains in Undo.');
  }
  function exportJson(){saveFile(`${challenge.id}-design.json`,JSON.stringify(live.current,null,2),'application/json')}

  return <div className="dojo-workbench">
    <section className="card dojo-board" aria-label="Design workbench">
      <div className="dojo-board-heading"><div><span className="eyebrow">{challenge.track} · YOUR DESIGN</span><h2>Build the connections. Explain the choices.</h2><p>The starter uses this case’s components. Choose the boundaries and arrows yourself.</p></div><button type="button" className="primary" disabled={Boolean(loadError)} onClick={saveVersion}>Save design version</button></div>
      <div className="dojo-board-toolbar"><div className="button-row"><button type="button" disabled={!history.past.length||Boolean(loadError)} onClick={()=>travel('undo')}>Undo</button><button type="button" disabled={!history.future.length||Boolean(loadError)} onClick={()=>travel('redo')}>Redo</button></div><small>{graph.nodes.length}/{DOJO_GRAPH_LIMITS.nodes} nodes · {graph.edges.length}/{DOJO_GRAPH_LIMITS.edges} connections · {DOJO_GRAPH_LIMITS.history} undo steps</small><span className="dojo-draft-state">{loadError?'Saved draft needs attention':dirty?'Local edits waiting to save':record.fields.graph?'Draft stored · check account sync':'Starter · not saved yet'}</span></div>
      {error&&<p role="alert" className="dojo-workbench-alert">{error}</p>}
      {message&&<p role="status" className="dojo-workbench-notice">{message}</p>}
      {dirty&&<div className="button-row"><button type="button" onClick={()=>storeGraph(live.current)}>Retry saving draft</button><button type="button" onClick={exportJson}>Export local diagram</button><button type="button" onClick={loadSaved}>Load saved draft</button></div>}
      {loadError?<div className="dojo-workbench-alert" role="alert"><h3>Your saved diagram was kept intact</h3><p>{loadError} Export the original data or restore a saved version below.</p><div className="button-row"><button type="button" onClick={()=>saveFile(`${challenge.id}-original.json`,get(recordId).fields.graph||'','application/json')}>Export original data</button><button type="button" onClick={()=>restore()}>Preserve original and use starter</button></div></div>:<>
        <div className="dojo-board-layout">
          <aside className="dojo-component-shelf" aria-label={`${challenge.track} component palette`}><h3>Component shelf</h3><p>Drag to place. Click or press Enter to add.</p>{challenge.components.map(component=><button type="button" key={component} draggable={graph.nodes.length<DOJO_GRAPH_LIMITS.nodes} disabled={graph.nodes.length>=DOJO_GRAPH_LIMITS.nodes} aria-label={`Add ${component}`} onDragStart={event=>{event.dataTransfer.setData('application/quest90-node',component);event.dataTransfer.effectAllowed='copy'}} onClick={()=>add(component)}><span aria-hidden="true">＋</span>{component}</button>)}<form onSubmit={event=>{event.preventDefault();add(customLabel)}}><label>Another component<input value={customLabel} maxLength={DOJO_GRAPH_LIMITS.label} onChange={event=>setCustomLabel(event.target.value)} placeholder="Your own boundary"/></label><button type="submit" disabled={!customLabel.trim()||graph.nodes.length>=DOJO_GRAPH_LIMITS.nodes}>Add component</button></form></aside>
          <div className="dojo-canvas"><FlowCanvas graph={graph} selected={node?.id||''} failed={validNode(excluded)} onSelect={setSelected} onChange={change} onDropNode={drop} onConnect={(source,target)=>connect(source,target)} onDelete={remove}/>{!graph.nodes.length&&<p className="dojo-empty-canvas">Add a component from the shelf to begin.</p>}</div>
        </div>
        <div className="dojo-board-inspectors">
          <section aria-label="Node editor"><h3>Node details</h3><label>Selected component<select value={node?.id||''} onChange={event=>setSelected(event.target.value)}><option value="">Choose a component</option>{graph.nodes.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}</select></label>{node?<><form className="dojo-label-form" onSubmit={event=>{event.preventDefault();if(nodeLabel.trim())change({...live.current,nodes:live.current.nodes.map(n=>n.id===node.id?{...n,label:nodeLabel.trim()}:n)})}}><label>Node label<input maxLength={DOJO_GRAPH_LIMITS.label} value={nodeLabel} onChange={event=>setNodeLabel(event.target.value)}/></label><button type="submit" disabled={!nodeLabel.trim()||nodeLabel.trim()===node.label}>Apply label</button></form><div className="button-row dojo-node-movement">{([['←','left',-20,0],['→','right',20,0],['↑','up',0,-20],['↓','down',0,20]] as const).map(([symbol,direction,dx,dy])=><button type="button" key={direction} aria-label={`Move selected component ${direction}`} onClick={()=>change({...live.current,nodes:live.current.nodes.map(n=>n.id===node.id?{...n,x:Math.max(-9000,Math.min(9000,n.x+dx)),y:Math.max(-9000,Math.min(9000,n.y+dy))}:n)})}>{symbol}</button>)}<button type="button" onClick={()=>remove(node.id)}>Delete component</button></div><small>Deleting a component also removes its connections. Undo brings both back.</small></>:<p>Select a node on the canvas or in the list.</p>}</section>
          <section aria-label="Connection editor"><h3>Connect the design</h3><div className="dojo-select-pair"><label>From<select value={validNode(from)} onChange={event=>setFrom(event.target.value)}><option value="">Choose a source</option>{graph.nodes.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}</select></label><label>To<select value={validNode(to)} onChange={event=>setTo(event.target.value)}><option value="">Choose a destination</option>{graph.nodes.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}</select></label></div><form className="dojo-label-form" onSubmit={event=>{event.preventDefault();connect(from,to,connectionLabel.trim())}}><label>What crosses this connection?<input value={connectionLabel} maxLength={DOJO_GRAPH_LIMITS.label} onChange={event=>setConnectionLabel(event.target.value)} placeholder="Evidence, query, command, relationship…"/></label><button type="submit" disabled={!validNode(from)||!validNode(to)||graph.edges.length>=DOJO_GRAPH_LIMITS.edges||graph.edges.some(e=>e.from===from&&e.to===to)}>Connect →</button></form><label>Edit a connection<select value={edge?String(edgeIndex):''} onChange={event=>setEdgeIndex(event.target.value===''?-1:Number(event.target.value))}><option value="">Choose a connection</option>{graph.edges.map((e,index)=><option key={`${e.from}-${e.to}-${index}`} value={index}>{nodeName(e.from)} → {nodeName(e.to)}{e.label?` · ${e.label}`:''}</option>)}</select></label>{edge&&<><form className="dojo-label-form" onSubmit={event=>{event.preventDefault();change({...live.current,edges:live.current.edges.map((e,index)=>index===edgeIndex?{...e,label:edgeLabel.trim()}:e)})}}><label>Connection label<input value={edgeLabel} maxLength={DOJO_GRAPH_LIMITS.label} onChange={event=>setEdgeLabel(event.target.value)}/></label><button type="submit" disabled={edgeLabel.trim()===(edge.label||'')}>Apply label</button></form><button type="button" onClick={()=>{change({...live.current,edges:live.current.edges.filter((_,index)=>index!==edgeIndex)});setEdgeIndex(-1)}}>Delete connection</button></>}</section>
        </div>
      </>}
      <details className="dojo-workbench-details"><summary>Inspect a path · structure only</summary><p>Follow directed arrows while optionally excluding a component. Labels and conditions are not executed; this cannot establish correctness, resilience or capacity.</p><div className="dojo-path-controls"><label>Start<select value={validNode(pathFrom)} onChange={event=>{setPathFrom(event.target.value);setShowInspection(false)}}><option value="">Choose start</option>{graph.nodes.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}</select></label><label>Destination<select value={validNode(pathTo)} onChange={event=>{setPathTo(event.target.value);setShowInspection(false)}}><option value="">Choose destination</option>{graph.nodes.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}</select></label><label>Exclude a component<select value={validNode(excluded)} onChange={event=>{setExcluded(event.target.value);setShowInspection(false)}}><option value="">None</option>{graph.nodes.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}</select></label><button type="button" disabled={Boolean(loadError)||!validNode(pathFrom)||!validNode(pathTo)} onClick={()=>setShowInspection(true)}>Inspect path</button></div>{inspection&&<div role="status" className="dojo-path-result"><strong>{inspection.status==='reachable'?'A directed path exists':inspection.status==='blocked'?'An endpoint is excluded':inspection.status==='unreachable'?'No directed path exists':'Choose valid endpoints'}</strong><p>{inspection.status==='reachable'?inspection.path.map(nodeName).join(' → '):inspection.status==='blocked'?'The start or destination was removed from this structural inspection.':inspection.status==='unreachable'?`Following these arrows from ${nodeName(pathFrom)} does not reach ${nodeName(pathTo)}${excluded?` without ${nodeName(excluded)}`:''}.`:'The chosen components are no longer in the diagram.'}</p><small>This result describes your drawing only. Review actual behavior separately.</small></div>}</details>
      <div className="dojo-board-footer"><small>Draft changes save as you edit. Save a version to keep a checkpoint in your review history.</small><div className="button-row"><button type="button" disabled={Boolean(loadError)} onClick={exportJson}>Export JSON</button><button type="button" disabled={Boolean(loadError)} onClick={()=>saveFile(`${challenge.id}-design.svg`,dojoGraphSvg(live.current,challenge.title),'image/svg+xml')}>Export SVG</button></div></div>
    </section>
    <section className="card dojo-design-notes"><h3>Explain the design</h3><p>Use the diagram to support your reasoning. Capture what the arrows cannot tell a reviewer.</p><div className="dojo-notes-grid">{designFields.map(field=><label key={field.name}>{field.label}<textarea rows={3} maxLength={40000} value={record.fields[field.name]||''} placeholder={field.placeholder} onChange={event=>patch(recordId,{[field.name]:event.target.value,reviewed:'no'})}/></label>)}</div><div className="button-row"><button type="button" className="primary" disabled={Boolean(loadError)} onClick={saveVersion}>Save design version</button><small>Captures the current diagram and all four notes.</small></div></section>
    <details className="card dojo-saved-versions"><summary>Saved design versions · {versions.length}</summary><p>Restoring replaces the working diagram and its four design notes. Your current draft is first preserved as another version.</p>{versions.length?<ol>{versions.map(version=><li key={version.id}><div><strong>{new Date(version.at).toLocaleString()}</strong><small>{version.outcome}</small></div><div className="button-row"><button type="button" onClick={()=>saveFile(`${challenge.id}-${version.id}.json`,JSON.stringify({graph:version.fields.graph,...Object.fromEntries(designFields.map(field=>[field.name,version.fields[field.name]||'']))},null,2),'application/json')}>Export version</button><button type="button" onClick={()=>restore(version)}>Restore version</button></div></li>)}</ol>:<p>No versions yet. Save your design when you are ready for a checkpoint.</p>}</details>
  </div>;
}
