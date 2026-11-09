import {test} from 'node:test';
import assert from 'node:assert/strict';
import {contributionList} from '../lib/career/list';
import {contributionUrl} from '../lib/career/links';
import {validateStudio,type StudioState,type StudioRecord} from '../lib/studio-state';
const now=new Date('2026-11-09T12:00:00Z');
function item(title:string,status='working',at='2026-10-20T12:00:00Z'):StudioRecord{return {fields:{schemaVersion:'1',title,status,notes:'Regression testing',careerHistory:'[]'},attempts:[],updatedAt:at}}
test('contribution search combines words, status and stale filters without mutating records',()=>{
 const data:StudioState={'career-os-old':item('Fix parser'),'career-os-new':item('Fix parser','working','2026-11-08T12:00:00Z'),'career-os-done':item('Fix parser','merged'),'career-os-other':item('Update docs')};
 const before=JSON.stringify(data);
 const result=contributionList(data,{query:'parser testing',status:'working',stale:true,page:1},now);
 assert.equal(result.total,1);assert.equal(result.items[0].id,'career-os-old');
 assert.equal(JSON.stringify(data),before);
});
test('list pagination is stable, bounded and handles empty filters',()=>{
 const data:StudioState=Object.fromEntries(Array.from({length:21},(_,i)=>['career-os-'+String(i).padStart(2,'0'),item('Contribution '+i)]));
 const first=contributionList(data,{query:'',status:'all',stale:false,page:1},now);
 const last=contributionList(data,{query:'',status:'all',stale:false,page:999},now);
 assert.equal(first.items.length,10);assert.equal(first.items[0].id,'career-os-00');assert.equal(last.page,3);assert.equal(last.items.length,1);
 const empty=contributionList(data,{query:'absent',status:'all',stale:false,page:50},now);
 assert.equal(empty.page,1);assert.equal(empty.total,0);
 assert.equal(contributionList(data,{query:'',status:'invalid',stale:false,page:NaN},now).page,1);
});
test('contribution URLs reject unsafe protocols and credentials but allow removal',()=>{
 assert.equal(contributionUrl('  https://github.com/team/repo/issues/1  '),'https://github.com/team/repo/issues/1');
 assert.equal(contributionUrl(''),'');
 for(const url of ['javascript:alert(1)','data:text/html,test','http://example.com','https://user:password@example.com','not a URL','https://example.com/'+ 'a'.repeat(2048)])assert.throws(()=>contributionUrl(url));
});
test('optional contribution links preserve legacy records and enforce import validation',()=>{
 const old=item('Old contribution');assert.doesNotThrow(()=>validateStudio({'career-os-old':old}));
 const linked={...old,fields:{...old.fields,url:'https://github.com/team/repo/pull/2'}};
 assert.doesNotThrow(()=>validateStudio(JSON.parse(JSON.stringify({'career-os-new':linked}))));
 assert.throws(()=>validateStudio({'career-os-bad':{...old,fields:{...old.fields,url:'javascript:alert(1)'}}}));
});
