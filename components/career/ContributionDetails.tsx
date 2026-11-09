'use client';
import {useState} from 'react';
import {useStudio} from '../studio/StudioContext';
import {history} from '@/lib/career/logic';
import {contributionUrl} from '@/lib/career/links';
import {statusLabels} from '@/lib/career/list';
export default function ContributionDetails({id}:{id:string}){
 const {get,patch}=useStudio(),fields=get(id).fields;
 const [url,setUrl]=useState(fields.url||''),[message,setMessage]=useState('');
 const events=history(fields).slice().reverse();
 let savedLink='';try{savedLink=contributionUrl(fields.url||'')}catch{}
 function save(){try{const next=contributionUrl(url);if(patch(id,{url:next})){setUrl(next);setMessage('Link saved. Check the account sync indicator.')}}catch(e){setMessage(e instanceof Error?e.message:'Could not save this link.')}}
 return <div className="career-contribution-details">
 {savedLink&&<a href={savedLink} target="_blank" rel="noopener noreferrer">Open contribution ↗ <span>(new tab)</span></a>}
 <details><summary>Contribution link</summary><label>Issue, repository or pull-request URL<input type="url" maxLength={2048} value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://github.com/owner/repo/issues/123"/></label><button type="button" className="secondary" onClick={save}>Save link</button><p role="status">{message}</p><small>Saving a link does not contact the repository or verify its status. Clear the field and save to remove the link.</small></details>
 <details><summary>Status history · {events.length} changes</summary>{events.length===0?<p>No status changes recorded yet. Older activity is not inferred.</p>:<ol className="career-event-history">{events.map((event,i)=><li key={event.at+'-'+i}><strong>{statusLabels[event.from as keyof typeof statusLabels]||event.from} → {statusLabels[event.to as keyof typeof statusLabels]||event.to}</strong><time dateTime={event.at}>{new Date(event.at).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})} IST</time></li>)}</ol>}</details>
 </div>;
}
