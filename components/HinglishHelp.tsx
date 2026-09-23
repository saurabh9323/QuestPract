'use client';
import {useState} from 'react';

const terms=[
 ['closure','Function apne outer scope ke bindings tak access rakhta hai; value ki frozen copy nahi.'],
 ['cache','Baar-baar chahiye data ki temporary copy. Freshness aur invalidation policy bhi chahiye.'],
 ['invariant','Woh rule jo valid operation ke pehle aur baad true rehna chahiye.'],
 ['idempot','Same operation retry ho to business effect dobara na ho; operation identity define karo.'],
 ['transaction','Related changes ko ek unit mein commit/rollback karna; concurrency policy alag se socho.'],
 ['render','Current props/state se UI ka description calculate karna; DOM changes commit mein lagte hain.'],
 ['map','Key se value associate karo. has presence, get value, set insert/update karta hai.'],
 ['set','Unique values ki membership. add insert aur has presence check karta hai.'],
 ['queue','Pending kaam ki line. Ordering, duplicate handling aur retry rules clearly define karo.'],
 ['serverless','Server manage provider karta hai; aap code/config aur failure handling own karte ho.'],
 ['context','React tree mein provider ka value descendants read kar sakte hain, bina har level prop pass kiye.'],
 ['isolation','Concurrent transactions ek dusre ko kaise affect kar sakte hain; chosen level matter karta hai.'],
];
export default function HinglishHelp({text,explanation}:{text:string;explanation?:string}){
 const [show,setShow]=useState(false);
 const matches=terms.filter(([term])=>text.toLowerCase().includes(term));
 return <section className="hinglish-help"><button className="secondary" aria-expanded={show} onClick={()=>setShow(v=>!v)}>{show?'Hide Hinglish help':'Hinglish help'}</button>{show&&<div>{explanation?<p>{explanation}</p>:<p>Pehle problem ko apne words mein bolo. Phir ek example trace karo: input kya hai, rule kya hai, result kyun aaya?</p>}{matches.map(([term,meaning])=><p key={term}><strong>{term}:</strong> {meaning}</p>)}<small>Language support for understanding. Practise the final interview explanation in your own English.</small></div>}</section>;
}
