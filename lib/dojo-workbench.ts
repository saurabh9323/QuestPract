export type DojoNode={id:string;label:string;x:number;y:number};
export type DojoEdge={from:string;to:string;label?:string};
export type DojoGraph={nodes:DojoNode[];edges:DojoEdge[]};
export type GraphHistory={past:DojoGraph[];present:DojoGraph;future:DojoGraph[]};

export const DOJO_GRAPH_LIMITS={nodes:24,edges:80,coordinate:9000,label:120,id:120,serialized:40000,history:30} as const;
const object=(value:unknown):value is Record<string,unknown>=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value);
const validText=(value:unknown,max:number,empty=false):value is string=>typeof value==='string'&&value.length<=max&&(empty||Boolean(value.trim()))&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value);

/** Validate before rendering or saving; never silently discard a malformed saved draft. */
export function validateDojoGraph(value:unknown):DojoGraph {
  const limits=DOJO_GRAPH_LIMITS;
  if(!object(value)||!Array.isArray(value.nodes)||!Array.isArray(value.edges))throw new Error('A diagram needs nodes and connections arrays.');
  if(value.nodes.length>limits.nodes||value.edges.length>limits.edges)throw new Error(`A diagram can contain up to ${limits.nodes} nodes and ${limits.edges} connections.`);
  const ids=new Set<string>();
  const nodes:DojoNode[]=value.nodes.map((node,index)=>{
    if(!object(node)||!validText(node.id,limits.id)||!validText(node.label,limits.label))throw new Error(`Node ${index+1} needs a valid ID and a label of 1–${limits.label} characters.`);
    if(ids.has(node.id))throw new Error(`Node ${index+1} has a repeated ID.`);
    if(typeof node.x!=='number'||typeof node.y!=='number'||!Number.isFinite(node.x)||!Number.isFinite(node.y)||Math.abs(node.x)>limits.coordinate||Math.abs(node.y)>limits.coordinate)throw new Error(`Node ${index+1} is outside the supported canvas bounds.`);
    ids.add(node.id);
    return {id:node.id,label:node.label,x:node.x,y:node.y};
  });
  const edges:DojoEdge[]=value.edges.map((edge,index)=>{
    if(!object(edge)||typeof edge.from!=='string'||typeof edge.to!=='string'||!ids.has(edge.from)||!ids.has(edge.to))throw new Error(`Connection ${index+1} refers to a missing node.`);
    if(edge.label!==undefined&&!validText(edge.label,limits.label,true))throw new Error(`Connection ${index+1} has an invalid label.`);
    return {from:edge.from,to:edge.to,...(edge.label!==undefined?{label:edge.label as string}:{})};
  });
  const graph={nodes,edges};
  if(JSON.stringify(graph).length>limits.serialized)throw new Error('This diagram is too large to save. Shorten its labels.');
  return graph;
}

export function parseDojoGraph(raw:string|undefined):{graph:DojoGraph|null;error:string} {
  if(raw===undefined||raw==='')return {graph:null,error:''};
  if(raw.length>DOJO_GRAPH_LIMITS.serialized)return {graph:null,error:'The saved diagram exceeds the supported size.'};
  try{return {graph:validateDojoGraph(JSON.parse(raw)),error:''}}
  catch(error){return {graph:null,error:error instanceof SyntaxError?'The saved diagram is not valid JSON.':error instanceof Error?error.message:'The saved diagram could not be read.'}}
}

/** Place domain components without supplying the learner's connections. */
export function dojoStarterGraph(components:readonly string[]):DojoGraph {
  return validateDojoGraph({nodes:components.slice(0,DOJO_GRAPH_LIMITS.nodes).map((label,i)=>({id:`component-${i+1}`,label:label.slice(0,DOJO_GRAPH_LIMITS.label),x:40+(i%3)*240,y:50+Math.floor(i/3)*150})),edges:[]});
}

export function checkpointGraph(history:GraphHistory,next:DojoGraph):GraphHistory {
  const graph=validateDojoGraph(next);
  if(JSON.stringify(history.present)===JSON.stringify(graph))return history;
  return {past:[...history.past,history.present].slice(-DOJO_GRAPH_LIMITS.history),present:graph,future:[]};
}
export function undoGraph(history:GraphHistory):GraphHistory {
  const previous=history.past.at(-1);
  return previous?{past:history.past.slice(0,-1),present:previous,future:[history.present,...history.future].slice(0,DOJO_GRAPH_LIMITS.history)}:history;
}
export function redoGraph(history:GraphHistory):GraphHistory {
  const next=history.future[0];
  return next?{past:[...history.past,history.present].slice(-DOJO_GRAPH_LIMITS.history),present:next,future:history.future.slice(1)}:history;
}
export function removeDojoNode(graph:DojoGraph,id:string):DojoGraph {
  return {nodes:graph.nodes.filter(node=>node.id!==id),edges:graph.edges.filter(edge=>edge.from!==id&&edge.to!==id)};
}

export type PathInspection={status:'reachable'|'unreachable'|'blocked'|'invalid';path:string[];visited:string[]};
/** Directed structural reachability only. Edge labels do not execute conditions. */
export function inspectDojoPath(graph:DojoGraph,from:string,to:string,excluded=''):PathInspection {
  const ids=new Set(graph.nodes.map(node=>node.id));
  if(!ids.has(from)||!ids.has(to)||(excluded&&!ids.has(excluded)))return {status:'invalid',path:[],visited:[]};
  if(from===excluded||to===excluded)return {status:'blocked',path:[],visited:[]};
  const parents=new Map<string,string|null>([[from,null]]),queue=[from];
  for(let index=0;index<queue.length;index++){
    const current=queue[index];
    if(current===to){
      const path:string[]=[];
      let step:string|null=to;
      while(step!==null){path.unshift(step);step=parents.get(step)??null}
      return {status:'reachable',path,visited:queue.slice(0,index+1)};
    }
    for(const edge of graph.edges){
      if(edge.from===current&&edge.to!==excluded&&ids.has(edge.to)&&!parents.has(edge.to)){parents.set(edge.to,current);queue.push(edge.to)}
    }
  }
  return {status:'unreachable',path:[],visited:queue};
}

function escapeXml(value:string){return value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;')}
/** Standalone SVG includes its own styles and does not rely on app CSS. */
export function dojoGraphSvg(input:DojoGraph,title:string):string {
  const graph=validateDojoGraph(input),minX=Math.min(0,...graph.nodes.map(n=>n.x-100)),minY=Math.min(0,...graph.nodes.map(n=>n.y-140));
  const width=Math.max(800,...graph.nodes.map(n=>n.x+260))-minX,height=Math.max(420,...graph.nodes.map(n=>n.y+160))-minY;
  const edges=graph.edges.map(edge=>{
    const source=graph.nodes.find(n=>n.id===edge.from)!,target=graph.nodes.find(n=>n.id===edge.to)!,x1=source.x+160,y1=source.y+34,x2=target.x,y2=target.y+34;
    const path=source.id===target.id?`M${x1} ${y1} c70 -100 -230 -100 -160 0`:`M${x1} ${y1} C${x1+45} ${y1} ${x2-45} ${y2} ${x2} ${y2}`;
    return `<g><title>${escapeXml(edge.label||'Connection')}</title><path d="${path}" fill="none" stroke="#516777" stroke-width="2" marker-end="url(#arrow)"/><text x="${(x1+x2)/2}" y="${(y1+y2)/2-12}" text-anchor="middle" font-size="12">${escapeXml((edge.label||'').slice(0,36))}</text></g>`;
  }).join('');
  const nodes=graph.nodes.map(node=>`<g transform="translate(${node.x},${node.y})"><title>${escapeXml(node.label)}</title><rect width="160" height="68" rx="10" fill="#f0f5ef" stroke="#516777" stroke-width="2"/><text x="80" y="31" text-anchor="middle" font-size="13">${escapeXml(node.label.slice(0,22))}</text><text x="80" y="49" text-anchor="middle" font-size="10" fill="#516777">component</text></g>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}" role="img"><title>${escapeXml(title)}</title><desc>A learner-created design diagram. Connections show structure, not executed behavior.</desc><rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="#ffffff"/><defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="#516777"/></marker></defs><g font-family="system-ui, sans-serif" fill="#21352e">${edges}${nodes}</g></svg>`;
}
