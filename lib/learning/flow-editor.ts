import type {Flow} from './types';
export type FlowHistory={past:Flow[];present:Flow;future:Flow[]};
export function checkpoint(history:FlowHistory,next:Flow):FlowHistory{
  if(JSON.stringify(history.present)===JSON.stringify(next))return history;
  return {past:[...history.past,history.present].slice(-30),present:next,future:[]};
}
export function undo(history:FlowHistory):FlowHistory{return history.past.length?{past:history.past.slice(0,-1),present:history.past.at(-1)!,future:[history.present,...history.future].slice(0,30)}:history}
export function redo(history:FlowHistory):FlowHistory{return history.future.length?{past:[...history.past,history.present].slice(-30),present:history.future[0],future:history.future.slice(1)}:history}
export function removeNode(flow:Flow,id:string):Flow{return {...flow,nodes:flow.nodes.filter(n=>n.id!==id),edges:flow.edges.filter(e=>e.from!==id&&e.to!==id)}}
// Deterministic breadth-first order in a bounded grid; cycles stay visible.
export function layoutFlow(flow:Flow):Flow{
  const levels=new Map<string,number>(),incoming=new Set(flow.edges.map(e=>e.to));
  const roots=flow.nodes.filter(n=>!incoming.has(n.id));
  const queue=roots.map(n=>n.id);for(const n of roots)levels.set(n.id,0);
  function visit(){for(let i=0;i<queue.length;i++){const id=queue[i];for(const e of flow.edges.filter(e=>e.from===id)){if(!levels.has(e.to)){levels.set(e.to,(levels.get(id)||0)+1);queue.push(e.to)}}}}
  visit();for(const n of flow.nodes)if(!levels.has(n.id)){levels.set(n.id,0);queue.push(n.id);visit()}
  const order=[...flow.nodes].sort((a,b)=>(levels.get(a.id)||0)-(levels.get(b.id)||0));
  return {...flow,nodes:flow.nodes.map(n=>{const i=order.findIndex(x=>x.id===n.id);return {...n,x:35+(i%4)*240,y:40+Math.floor(i/4)*130}})};
}
