'use client';
import {useStudio} from '../studio/StudioContext';

/** Editing review evidence reopens legacy completions as well as versioned ones. */
export default function DojoField({id,ownerId=id,name,label,rows=4,placeholder=''}:{
  id:string;ownerId?:string;name:string;label:string;rows?:number;placeholder?:string;
}) {
  const {get,patch}=useStudio();
  return <label className="dojo-text-field">{label}<textarea rows={rows} maxLength={40000}
    value={get(id).fields[name]||''} placeholder={placeholder}
    onChange={e=>{
      const value=e.target.value;
      if(value===(get(id).fields[name]||''))return;
      if(id===ownerId)patch(id,{[name]:value,reviewed:'no'});
      else if(patch(id,{[name]:value})&&get(ownerId).fields.reviewed==='yes')patch(ownerId,{reviewed:'no'});
    }}/></label>;
}
