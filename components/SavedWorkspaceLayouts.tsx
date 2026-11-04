'use client';

import {useState, type FormEvent} from 'react';
import {applyLayout,defaultId,layoutLibrary,maxLayouts,personalId,saveCopy} from '@/lib/layout-library';
import {defaults,designRecord,palette,parseDesign,type Design,type Mode} from '@/lib/workspace-design';
import {useStudio} from './studio/StudioContext';

type Props={
  draft:Design;
  currentMode:Mode;
  previewMode:Mode;
  dirty:boolean;
  applied:(design:Design,mode:Mode)=>void;
};

export default function SavedWorkspaceLayouts({draft,currentMode,previewMode,dirty,applied}:Props) {
  const {get,patch}=useStudio();
  const [name,setName]=useState('');
  const [source,setSource]=useState<'current'|'preview'>('current');
  const [status,setStatus]=useState('');
  const [removing,setRemoving]=useState('');
  const fields=get(designRecord).fields;
  const {items,active,namedCount}=layoutLibrary(fields,currentMode);

  function save(event:FormEvent) {
    event.preventDefault();
    try {
      const latest=get(designRecord).fields;
      const fromPreview=source==='preview';
      const changes=saveCopy(latest,currentMode,name,fromPreview?draft:parseDesign(latest.design),fromPreview?previewMode:currentMode);
      if(!patch(designRecord,changes)) return;
      setStatus('Saved “'+name.trim()+'”. Your applied workspace is still '+active.name+'.');
      setName('');
    } catch(error) {
      setStatus(error instanceof Error?error.message:'Unable to save the layout.');
    }
  }
  function apply(id:string) {
    try {
      const {chosen,update}=applyLayout(get(designRecord).fields,currentMode,id);
      if(!patch(designRecord,update)) return;
      applied(chosen.design,chosen.mode);
      setStatus('Applied “'+chosen.name+'”.');
    } catch(error) {
      setStatus(error instanceof Error?error.message:'Unable to apply the layout.');
    }
  }
  return <section className="card designer-library" aria-labelledby="layout-library-title">
    <span className="eyebrow">LAYOUT LIBRARY</span>
    <h2 id="layout-library-title">My layouts</h2>
    <p>Currently using <strong>{active.name}</strong> in {currentMode} mode. Default layout restores the original green Quest90 design in your current light or dark mode. You can save up to {maxLayouts} named alternatives.</p>
    <form onSubmit={save} className="layout-copy-form">
      <label>Save a copy of<select value={source} onChange={e=>setSource(e.target.value as typeof source)}>
        <option value="current">Currently applied workspace</option><option value="preview">Studio preview</option>
      </select></label>
      <label>Layout name<input required maxLength={40} value={name} placeholder="e.g. Evening interview prep" onChange={e=>setName(e.target.value)}/></label>
      <button className="primary" disabled={!name.trim()||namedCount>=maxLayouts}>Save named copy</button>
    </form>
    {dirty&&<p>To apply these edits as a separate layout, save a named copy of the Studio preview. Discard or save your edits before switching to a different design.</p>}
    <ul className="layout-library-grid">{items.map(item=>{
      const isActive=item.id===active.id;
      const matchesDraft=JSON.stringify(item.design)===JSON.stringify(parseDesign(JSON.stringify(draft)));
      const colors={...defaults[item.mode],...palette(item.design,item.mode,'Portal')};
      return <li key={item.id} data-current={isActive}>
        <div className="layout-library-swatches" aria-hidden="true">
          {[colors.navbar,colors.page,colors.surface,colors.accent,colors.text].map((color,index)=><i key={index} style={{backgroundColor:color}}/>)}
        </div>
        <h3>{item.name}</h3><small>{item.design.layout} layout · {item.mode} mode</small>
        {isActive&&<strong className="layout-applied">Currently applied</strong>}
        <div className="button-row">
          <button className="secondary" disabled={(dirty&&!matchesDraft)||(!dirty&&isActive&&item.mode===currentMode)} onClick={()=>apply(item.id)}>Apply layout</button>
          {item.id!==defaultId&&item.id!==personalId&&!isActive&&removing!==item.id&&<button className="text-btn" onClick={()=>setRemoving(item.id)}>Remove</button>}
          {removing===item.id&&!isActive&&<><button className="text-btn" onClick={()=>{
            if(patch(designRecord,{[item.id]:''})) {setRemoving('');setStatus('Removed “'+item.name+'”.');}
          }}>Confirm removal</button><button className="text-btn" onClick={()=>setRemoving('')}>Cancel</button></>}
        </div>
      </li>;
    })}</ul>
    <span role="status" aria-live="polite">{status}</span>
  </section>;
}
