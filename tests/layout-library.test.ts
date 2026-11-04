import test from 'node:test';
import assert from 'node:assert/strict';
import {applyLayout,defaultId,layoutLibrary,maxLayouts,saveCopy,savePersonal} from '../lib/layout-library';
import {freshDesign} from '../lib/workspace-design';

test('legacy workspace survives saving and applying independent named copies',()=>{
  const original={...freshDesign(),name:'Original'};
  const alternate={...freshDesign(),layout:'Reading' as const, dark:{Learn:{navbar:'#123456'}}};
  let fields:Record<string,string>={design:JSON.stringify(original),step_practice:'2'};
  fields={...fields,...saveCopy(fields,'light','Evening',alternate,'dark')};
  assert.equal(layoutLibrary(fields,'light').active.name,'My workspace');
  const evening=layoutLibrary(fields,'light').items.find(item=>item.id==='layoutSlot1')!;
  const applied=applyLayout(fields,'light',evening.id);
  fields={...fields,...applied.update};
  assert.equal(applied.chosen.mode,'dark');
  assert.deepEqual(JSON.parse(fields.design),alternate);
  fields={...fields,...saveCopy(fields,'dark','Another',original,'light')};
  assert.equal(layoutLibrary(fields,'dark').active.name,'Evening');
  fields={...fields,...applyLayout(fields,'dark','personalLayout').update};
  assert.deepEqual(JSON.parse(fields.design),original);
  assert.equal(fields.step_practice,'2');
  fields={...fields,...savePersonal({...original,name:'Updated'},'light')};
  assert.deepEqual(layoutLibrary(fields,'light').items.find(item=>item.id==='layoutSlot1')!.design,alternate);
});

test('reject duplicate names and full shelves; a removed slot is reusable',()=>{
  let fields:Record<string,string>={};
  for(let i=0;i<maxLayouts;i++) fields={...fields,...saveCopy(fields,'light','Version '+i,freshDesign(),'dark')};
  assert.throws(()=>saveCopy(fields,'light','  version 1 ',freshDesign(),'light'),/already/);
  assert.throws(()=>saveCopy(fields,'light','Too many',freshDesign(),'light'),/12/);
  assert.throws(()=>applyLayout(fields,'light','missing'),/no longer/);
  fields.layoutSlot1='';
  fields={...fields,...saveCopy(fields,'light','Replacement',freshDesign(),'light')};
  assert.equal(layoutLibrary(fields,'light').items.find(item=>item.id==='layoutSlot1')!.name,'Replacement');
});


test('only the original layout exists initially; restoring it keeps the mode and saved copies',()=>{
  const initial=layoutLibrary({},'dark');
  assert.deepEqual(initial.items.map(item=>item.id),[defaultId]);
  assert.equal(initial.active.id,defaultId);
  const custom={...freshDesign(),layout:'Compact' as const};
  let fields:Record<string,string>=saveCopy({},'dark','Compact study',custom,'light');
  fields={...fields,...applyLayout(fields,'dark','layoutSlot1').update};
  const restore=applyLayout(fields,'light',defaultId);
  assert.equal(restore.chosen.mode,'light');
  assert.deepEqual(restore.chosen.design,freshDesign());
  fields={...fields,...restore.update};
  assert.equal(layoutLibrary(fields,'light').active.id,defaultId);
  assert.deepEqual(layoutLibrary(fields,'light').items.map(item=>item.id),[defaultId,'layoutSlot1']);
  assert.throws(()=>saveCopy(fields,'dark','Default layout',custom,'dark'),/already/);
});
