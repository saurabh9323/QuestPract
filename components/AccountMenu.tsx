"use client";
import {useEffect,useId,useRef,useState} from 'react';
import {LogOut,Settings,UserRound} from 'lucide-react';

export function accountName(fullName?:string,username?:string,email?:string){return fullName?.trim()||username?.trim()||email?.split('@')[0]||'Your account';}
export function accountInitial(name:string){return Array.from(name.trim())[0]?.toLocaleUpperCase()||'?';}

export default function AccountMenu({name,email,onProfile,onSettings,onSignOut}:{name:string;email?:string;onProfile:()=>void;onSettings:()=>void;onSignOut:()=>Promise<void>}){
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const container=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null),menu=useRef<HTMLDivElement>(null),menuId=useId();
 function close(){setOpen(false);trigger.current?.focus();}
 useEffect(()=>{if(!open)return;menu.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();const outside=(e:PointerEvent)=>{if(!busy&&!container.current?.contains(e.target as Node))setOpen(false);};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);},[open,busy]);
 async function signOut(){setError('');setBusy(true);try{await onSignOut();setOpen(false);}catch(e){setError(e instanceof Error?e.message:'Unable to sign out. Try again.');}finally{setBusy(false);}}
 return <div className="account-menu" ref={container} onKeyDown={e=>{
  if(e.key==='Escape'&&open&&!busy){e.preventDefault();close();}
  if(e.key==='Tab'&&open)setOpen(false);
  if(open&&['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const items=Array.from(menu.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')||[]);if(!items.length)return;const at=items.indexOf(document.activeElement as HTMLButtonElement);const next=e.key==='Home'?0:e.key==='End'?items.length-1:e.key==='ArrowDown'?(at+1)%items.length:(at-1+items.length)%items.length;items[next]?.focus();}
 }}><button className="avatar small account-avatar" ref={trigger} type="button" aria-label={`Account menu for ${name}`} aria-haspopup="menu" aria-expanded={open} aria-controls={open?menuId:undefined} onClick={()=>{setError('');setOpen(!open)}} onKeyDown={e=>{if(!open&&(e.key==='ArrowDown'||e.key==='ArrowUp')){e.preventDefault();setOpen(true)}}}>{accountInitial(name)}</button>
 {open&&<div className="account-dropdown"><div className="account-menu-identity"><strong>{name}</strong><span>{email}</span></div><div id={menuId} ref={menu} role="menu" aria-label="Account options"><button role="menuitem" tabIndex={-1} disabled={busy} onClick={()=>{close();onProfile()}}><UserRound size={17}/>My profile</button><button role="menuitem" tabIndex={-1} disabled={busy} onClick={()=>{close();onSettings()}}><Settings size={17}/>Settings & data</button><button role="menuitem" tabIndex={-1} className="sign-out-option" disabled={busy} onClick={()=>void signOut()}><LogOut size={17}/>{busy?'Signing out…':'Sign out'}</button></div>{error&&<p className="account-menu-error" role="alert">{error}</p>}</div>}
 </div>;
}
