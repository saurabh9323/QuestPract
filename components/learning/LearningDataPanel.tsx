'use client';
import {useState} from 'react';
import {useStudio,saveFile} from '../studio/StudioContext';
import {parseDocument} from '@/lib/learning/validators';
import {readLearning,exportLearning,parseLearningBackup,BACKUP_CAP} from '@/lib/learning/persistence';
import type {LearningDocument} from '@/lib/learning/types';

export default function LearningDataPanel(){
  const {p,learning,notice}=useStudio();
  const {documents,invalid}=readLearning(p.studio);
  const [raw,setRaw]=useState(''),[drafts,setDrafts]=useState<LearningDocument[]>([]),[error,setError]=useState('');
  const [editing,setEditing]=useState<string|null>(null);
  function edit(value:string){setRaw(value);setDrafts([]);setError('')}
  function preview(){
    try{
      if(raw.length>BACKUP_CAP)throw new Error('Import exceeds 1 MB.');
      const parsed=JSON.parse(raw);
      const next=parsed?.format==='quest90-learning'?parseLearningBackup(raw):[parseDocument(raw)];
      setDrafts(next);setError('');
    }catch(e){setDrafts([]);setError(e instanceof Error?e.message:'Invalid JSON.')}
  }
  function example(){
    const at=new Date().toISOString();
    edit(JSON.stringify({schemaVersion:1,kind:'flow',origin:'manual',status:'draft',data:{id:`draft-${crypto.randomUUID()}`,title:'My flow draft',domain:'dsa',nodes:[],edges:[],tags:[],links:[],versions:[],createdAt:at,updatedAt:at}},null,2));setEditing(null);
  }
  function remove(keys:string[]){
    if(!window.confirm('Remove these learning drafts from active storage? Existing recovery snapshots and downloaded backups are separate.'))return;
    if(learning({remove:keys})){edit('');setEditing(null);notice('Learning drafts removed from active storage. Check account sync status.');}
  }
  return <details className="card learning-foundations">
    <summary>Learning workspace · draft data & backups</summary>
    <h3>Shared foundations · M0</h3>
    <p>Store validated drafts for flows, modules, drawings, review cards and session plans. Editors and practice modes arrive in later milestones. These drafts do not run code, schedule tasks or mark work correct.</p>
    <div className="button-row">
      <button onClick={example}>New flow data example</button>
      <button onClick={()=>saveFile('quest90-learning.json',JSON.stringify(exportLearning(p.studio||{}),null,2),'application/json')}>Export learning JSON</button>
      <label>Import JSON file<input type="file" accept=".json,application/json" onChange={async e=>{
        const file=e.target.files?.[0];if(!file)return;
        try{if(file.size>BACKUP_CAP)throw new Error('File exceeds 1 MB.');edit(await file.text());setEditing(null)}catch(e){setError(e instanceof Error?e.message:'File could not be read.')}
      }}/></label>
    </div>
    <label>Draft or backup JSON<textarea rows={8} spellCheck={false} maxLength={BACKUP_CAP} value={raw} onChange={e=>edit(e.target.value)} placeholder="Paste a version 1 document or import your learning backup."/></label>
    <button disabled={!raw.trim()} onClick={preview}>Validate & preview</button>
    {error&&<p role="alert">{error}</p>}
    {drafts.length>0&&<section aria-label="Validated draft preview">
      <p><strong>Schema valid · {drafts.length} editable draft(s)</strong>. This does not verify correctness or run module tests. Saving replaces matching active IDs; other work stays unchanged.</p>
      {drafts.map(d=><article key={`${d.kind}-${d.data.id}`}><h4>{d.data.title}</h4><p>{d.kind} · {d.origin==='ai'?'AI · drafted, review required':'Manual draft'} · version 1</p><details><summary>Review draft data</summary><pre>{JSON.stringify(d.data,null,2)}</pre></details></article>)}
      <button onClick={()=>{if(learning({save:drafts})){setDrafts([]);notice('Drafts saved locally for account sync. No progress or schedules changed.');}}}>Save reviewed drafts</button>
    </section>}
    <h4>My saved drafts · {documents.length}</h4>
    {!documents.length&&<p>No learning drafts yet. Your existing Playground and Dojo work remains separate.</p>}
    {documents.map(({key,document:d})=><article className="learning-draft-row" key={key}>
      <span><strong>{d.data.title}</strong> · {d.kind} {d.origin==='ai'&&<small>AI · review required</small>}</span>
      <div className="button-row"><button aria-pressed={editing===key} onClick={()=>{edit(JSON.stringify(d,null,2));setEditing(key)}}>Edit draft JSON</button><button aria-label={`Remove ${d.data.title}`} onClick={()=>remove([key])}>Remove</button></div>
    </article>)}
    {invalid.length>0&&<p role="alert">{invalid.length} invalid stored record(s) were excluded, not silently loaded or deleted. Export your full account backup before resolving them.</p>}
    <button disabled={!documents.length&&!invalid.length} onClick={()=>remove([...documents.map(d=>d.key),...invalid])}>Remove all learning draft data</button>
    <p><small>Uses your existing account sync and per-user storage. Removal clears active drafts and prevents stale-device recovery. It does not erase account recovery snapshots, unrelated chat/Playground data or backups you downloaded. Limit: 100 drafts, 30 KB per draft, 1 MB total. Imported modules remain inert drafts.</small></p>
  </details>;
}
