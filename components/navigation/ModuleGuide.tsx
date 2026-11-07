'use client';
import {navigationCatalog} from '@/lib/navigation/catalog';
import {workspaceUrl} from '@/lib/workspace-routes';
import {navigateWorkspace} from '@/lib/workspace-location';
export default function ModuleGuide({day}:{day:number}){
 return <details className="module-guide"><summary>Portal guide · where should I go?</summary><p>Plan → understand → practise → rehearse → review. Pick one task, then use the next stage when you are ready.</p><div className="module-guide-grid">{navigationCatalog.map(group=><section key={group.name}><h3>{group.name}</h3><p>{group.description}</p>{group.sections.map(section=><div key={section.title}><h4>{section.title}</h4>{section.items.map(([id,label,description])=><a key={id} href={workspaceUrl(id,day)} onClick={e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();navigateWorkspace(workspaceUrl(id,day));window.scrollTo(0,0)}}><strong>{label}</strong><small>{description}</small></a>)}</div>)}</section>)}</div></details>;
}

