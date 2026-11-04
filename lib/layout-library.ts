import {freshDesign,parseDesign, type Design, type Mode} from './workspace-design';

type Fields = Record<string,string>;
export type LayoutSnapshot = {id:string; name:string; design:Design; mode:Mode};
export const defaultId='quest90Default';
export const personalId='personalLayout';
export const maxLayouts=12;
const slots=Array.from({length:maxLayouts},(_,index)=>'layoutSlot'+(index+1));

function readSlot(fields:Fields,id:string):LayoutSnapshot|undefined {
  try {
    const value=JSON.parse(fields[id]);
    if(typeof value?.name!=='string'||!value.name.trim()||!value.design||typeof value.design!=='object'||Array.isArray(value.design)) return;
    if(value.mode!=='light'&&value.mode!=='dark') return;
    return {id,name:value.name.trim().slice(0,40),mode:value.mode,design:parseDesign(JSON.stringify(value.design))};
  } catch { return; }
}
function encode(snapshot:LayoutSnapshot) {
  return JSON.stringify({name:snapshot.name,design:snapshot.design,mode:snapshot.mode});
}

export function layoutLibrary(fields:Fields,mode:Mode) {
  // The built-in layout inherits Quest90's original theme in either display mode.
  const original:LayoutSnapshot={id:defaultId,name:'Default layout',design:freshDesign(),mode};
  const legacy=fields.appliedLayout && fields.appliedLayout!==personalId
    ? freshDesign():parseDesign(fields.design);
  const personal=readSlot(fields,personalId)??{id:personalId,name:'My workspace',design:legacy,mode};
  const hasPersonal=JSON.stringify(personal.design)!==JSON.stringify(original.design);
  const named=slots.flatMap(id=>readSlot(fields,id)??[]);
  const items=[original,...(hasPersonal?[personal]:[]),...named];
  const active=items.find(item=>item.id===fields.appliedLayout)??(hasPersonal?personal:original);
  return {items,personal,active,namedCount:named.length};
}

// Each snapshot gets its own bounded Studio field so a large palette cannot crowd out other layouts.
export function saveCopy(fields:Fields,currentMode:Mode,name:string,design:Design,mode:Mode):Fields {
  const {items,personal}=layoutLibrary(fields,currentMode);
  const label=name.trim();
  if(!label||label.length>40) throw new Error('Use a name between 1 and 40 characters.');
  if(items.some(item=>item.name.toLowerCase()===label.toLowerCase())) throw new Error('A layout already uses that name. Choose another.');
  const id=slots.find(slot=>!items.some(item=>item.id===slot));
  if(!id) throw new Error('All 12 named layout slots are in use. Remove one to save another.');
  return {[personalId]:encode(personal),[id]:encode({id,name:label,design:parseDesign(JSON.stringify(design)),mode})};
}

export function applyLayout(fields:Fields,mode:Mode,id:string) {
  const {personal,items}=layoutLibrary(fields,mode);
  const chosen=items.find(item=>item.id===id);
  if(!chosen) throw new Error('This layout is no longer available.');
  return {chosen,update:{[personalId]:encode(personal),design:JSON.stringify(chosen.design),appliedLayout:id}};
}

export function savePersonal(design:Design,mode:Mode):Fields {
  const normalized=parseDesign(JSON.stringify(design));
  return {design:JSON.stringify(normalized),appliedLayout:JSON.stringify(normalized)===JSON.stringify(freshDesign())?defaultId:personalId,
    [personalId]:encode({id:personalId,name:'My workspace',design:normalized,mode})};
}
