import type {TraceEvent,Value} from '@/lib/playground/types';
import type {CSSProperties} from 'react';
export type RendererProps={event?:TraceEvent;before?:TraceEvent};
export default function ArrayRenderer({event,before}:RendererProps){
  const entries=Object.entries(event?.snapshot||{}).filter(([,v])=>Array.isArray(v)) as [string,Value[]][];
  const pointers=Object.entries(event?.snapshot||{}).filter(([k,v])=>['i','j','left','right','mid','start','end'].includes(k)&&Number.isInteger(v));
  return <div className="pg-arrays">{entries.length?entries.map(([name,values])=><section key={name}>
    <h3>{name} <small>· {values.length} items</small></h3>
    <div className="pg-array-scroll"><div className="pg-array-track" style={{'--items':Math.max(1,values.length)} as CSSProperties}>
    {pointers.filter(([,v])=>Number(v)>=0&&Number(v)<values.length).map(([key,v])=><div className="pg-pointer-lane" key={key}><span style={{'--index':Number(v)} as CSSProperties}>{key} ↓</span></div>)}
    <div className="pg-array" role="list" aria-label={`Array ${name}`}>
      {values.map((value,index)=>{
        const previous=before?.snapshot[name],changed=Array.isArray(previous)&&JSON.stringify(previous[index])!==JSON.stringify(value);
        const markers=pointers.filter(([,v])=>v===index).map(([k])=>k);
        return <div role="listitem" key={index} className={`pg-cell ${changed?'pg-changed':''} ${markers.length?'pg-pointed':''}`}>
          <small>index {index}</small><strong>{JSON.stringify(value)}</strong><span>{markers.join(' · ')||' '}</span>
        </div>;
      })}
      {!values.length&&<p>Empty array · no valid indices</p>}
    </div></div></div>
    {pointers.filter(([,v])=>Number(v)<0||Number(v)>=values.length).map(([k,v])=><small className="pg-boundary" key={k}>{k} = {String(v)} · outside this array</small>)}
  </section>):<p>Run or advance to a step with an array in scope. Map/Set entries remain visible in Variables.</p>}</div>;
}
