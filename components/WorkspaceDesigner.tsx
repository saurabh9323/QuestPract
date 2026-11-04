'use client';

import {useState} from 'react';
import {ArrowRight, Code2, Layers, Orbit} from 'lucide-react';
import {useStudio} from './studio/StudioContext';
import SavedWorkspaceLayouts from './SavedWorkspaceLayouts';
import {savePersonal} from '@/lib/layout-library';
import {workspaceGroups} from './WorkspaceNavigation';
import {navigateWorkspace} from '@/lib/workspace-location';
import {
  colorNames, contrast, defaults, designRecord, foreground, freshDesign, layouts, marks, palette,
  parseDesign, pathPosition, paths, scopes, suggestedActivity, type ColorKey, type Design, type Mode,  type Scope,
} from '@/lib/workspace-design';

export function BrandMark({design}:{design:Design}) {
  const Icon=design.mark==='Orbit'?Orbit:design.mark==='Layers'?Layers:design.mark==='Code'?Code2:null;
  return <b aria-hidden="true">{Icon?<Icon size={22}/>:design.letter}</b>;
}

export function LearningPathCard() {
  const {get,patch,p}=useStudio();
  const fields=get(designRecord).fields;
  const {path}=parseDesign(fields.design);
  if(!path) return null;
  if(path==='adaptive') {
    const activity=suggestedActivity(p);
    return <section className="card design-path"><span className="eyebrow">PROGRESS-GUIDED PATH</span>
      <h2>{activity.name}</h2><p>{activity.reason}</p>
      <a className="primary" href={activity.href} onClick={e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();navigateWorkspace(activity.href);window.scrollTo(0,0)}}>Open activity <ArrowRight size={15}/></a>
    </section>;
  }
  const route=paths[path];
  const position=pathPosition(fields['step_'+path],path);
  const step=route.steps[position];
  const update=(n:number)=>patch(designRecord,{['step_'+path]:String(n)});
  return <section className="card design-path">
    <span className="eyebrow">YOUR LEARNING PATH</span><h2>{route.name}</h2>
    <progress value={position} max={route.steps.length} aria-label="Learning path progress"/>
    <p>{position} of {route.steps.length} steps marked complete</p>
    {step?<><h3>{step.name}</h3><p>{step.hint}</p><div className="button-row">
      <a href={step.href} className="primary" onClick={e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();navigateWorkspace(step.href);window.scrollTo(0,0)}}>Open activity <ArrowRight size={15}/></a>
      <button className="secondary" onClick={()=>update(position+1)}>Mark step complete</button>
    </div></>:<strong>Path complete. You can repeat this sequence or choose another path.</strong>}
    {position>0&&<button className="text-btn" onClick={()=>update(step?position-1:0)}>{step?'Revisit previous step':'Repeat this path'}</button>}
  </section>;
}

export default function WorkspaceDesigner({night,onMode}:{night:boolean;onMode:(dark:boolean)=>void}) {
  const {get,patch}=useStudio();
  const saved=get(designRecord).fields.design;
  const [draft,setDraft]=useState(()=>parseDesign(saved));
  const [mode,setMode]=useState<Mode>(night?'dark':'light');
  const [scope,setScope]=useState<Scope>('Portal');
  const parent=workspaceGroups.find(group=>group.items.some(([id])=>id===scope));
  const pageLabel=parent?.items.find(([id])=>id===scope)?.[1];
  const resolved={...defaults[mode],...palette(draft,mode,parent?.name||scope,parent?scope:undefined)};
  const custom=draft[mode][scope] || {};
  const dirty=JSON.stringify(draft)!==JSON.stringify(parseDesign(saved));
  function updateColor(key:ColorKey,value?:string) {
    setDraft(previous=>{
      const rule={...previous[mode][scope]};
      if(value) rule[key]=value; else delete rule[key];
      const rules={...previous[mode]};
      if(Object.keys(rule).length) rules[scope]=rule; else delete rules[scope];
      return {...previous,[mode]:rules};
    });
  }
  const ratio=Math.min(contrast(resolved.text,resolved.surface),contrast(resolved.text,resolved.page));
  return <div className="workspace-designer">
    <section className="card designer-intro"><span className="eyebrow">WORKSPACE STUDIO</span><h2>Make room for the way you learn.</h2><p>Choose your colors, brand and study rhythm. Preview them here, then save them to your account.</p></section>
    <SavedWorkspaceLayouts draft={draft} currentMode={night?'dark':'light'} previewMode={mode} dirty={dirty}
      applied={(design,nextMode)=>{setDraft(design);setMode(nextMode);onMode(nextMode==='dark')}}/>
    <div className="designer-columns">
      <div className="designer-controls">
        <section className="card"><h2>Colors</h2><div className="designer-row">
          <label>Palette<select value={mode} onChange={e=>setMode(e.target.value as Mode)}><option value="light">Light mode</option><option value="dark">Dark mode</option></select></label>
          <label>Apply to<select value={scope} onChange={e=>setScope(e.target.value as Scope)}><optgroup label="Portal and sections">{scopes.map(s=><option key={s}>{s}</option>)}</optgroup>{workspaceGroups.map(group=><optgroup key={group.name} label={group.name+' pages'}>{group.items.map(([id,name])=><option key={id} value={id}>{name}</option>)}</optgroup>)}</select></label>
        </div><p>Portal colors apply everywhere. Override any color for a section or just one page.</p>
        <div className="designer-colors">{(Object.keys(colorNames) as ColorKey[]).map(key=><div key={key}>
          <label><input type="color" value={resolved[key]} onChange={e=>updateColor(key,e.target.value)}/><span>{colorNames[key]}<small>{resolved[key].toUpperCase()}</small></span></label>
          {custom[key]&&<button className="text-btn" onClick={()=>updateColor(key)} aria-label={'Reset '+colorNames[key]}>{scope==='Portal'?'Default':'Inherit'}</button>}
        </div>)}</div></section>
        <section className="card"><h2>Brand & layout</h2><div className="designer-row">
          <label>Workspace name<input value={draft.name} maxLength={28} placeholder="Quest90" onChange={e=>setDraft({...draft,name:e.target.value})}/></label>
          <label>Logo<select value={draft.mark} onChange={e=>setDraft({...draft,mark:e.target.value as Design['mark']})}>{marks.map(mark=><option key={mark}>{mark}</option>)}</select></label>
          {draft.mark==='Letter'&&<label>Logo initials<input value={draft.letter} maxLength={2} onChange={e=>setDraft({...draft,letter:e.target.value})}/></label>}
          <label>Layout<select value={draft.layout} onChange={e=>setDraft({...draft,layout:e.target.value as Design['layout']})}>{layouts.map(layout=><option key={layout}>{layout}</option>)}</select></label>
        </div><p>Compact reduces desktop spacing. Reading limits the width of the content column.</p></section>
        <section className="card"><h2>Learning path</h2><p>Add a guided sequence to Today. Each path remembers its own position.</p>
          <label>Study sequence<select value={draft.path} onChange={e=>setDraft({...draft,path:e.target.value as Design['path']})}><option value="">No guided sequence</option><option value="adaptive">Follow my course progress</option>{Object.entries(paths).map(([id,item])=><option key={id} value={id}>{item.name}</option>)}</select></label>
          {draft.path==='adaptive'&&<p>Start with due recall, then revisit an unfinished scheduled day. When caught up, practise an interview answer.</p>}
          {draft.path&&draft.path!=='adaptive'&&<ol>{paths[draft.path].steps.map(step=><li key={step.href}>{step.name}</li>)}</ol>}
        </section>
      </div>
      <div className="designer-preview-column"><section className="card designer-preview"><span className="eyebrow">LIVE PREVIEW</span><h3>{pageLabel||scope} · {mode} mode</h3>
        <div className={'designer-mini layout-'+draft.layout.toLowerCase()} style={{background:resolved.page,color:resolved.text}}>
          <div className="designer-mini-nav" style={{background:resolved.navbar,color:foreground(resolved.navbar)}}><BrandMark design={draft}/>{draft.name||'Quest90'}</div>
          <div className="designer-mini-card" style={{background:resolved.surface}}><small>YOUR NEXT LESSON</small><h3>Trace a request</h3><p>Follow the data from the browser to the database.</p><span style={{background:resolved.accent,color:foreground(resolved.accent)}}>Open lesson →</span></div>
          <div className="designer-mini-foot" style={{background:resolved.footer,color:foreground(resolved.footer)}}>Study workspace · Footer</div>
        </div>
        <p className="designer-readout" role="status">{ratio.toFixed(1)}:1 minimum contrast for main text on this page and its cards.{ratio<4.5?' Try lighter text or a darker background for easier reading.':''}</p>
        <button className="secondary" onClick={()=>onMode(mode==='dark')} disabled={night===(mode==='dark')}>Use {mode} mode in portal</button>
      </section><section className="card designer-save"><strong aria-live="polite">{dirty?'Unsaved changes':'Using saved settings'}</strong><button className="primary" disabled={!dirty} onClick={()=>{const normalized=parseDesign(JSON.stringify(draft));if(patch(designRecord,savePersonal(normalized,night?'dark':'light'))) setDraft(normalized)}}>Apply edits to My workspace</button>
        <button className="text-btn" disabled={!dirty} onClick={()=>setDraft(parseDesign(saved))}>Discard changes</button><button className="text-btn" onClick={()=>setDraft(freshDesign())}>Preview factory defaults</button></section></div>
    </div><LearningPathCard/>
  </div>;
}
