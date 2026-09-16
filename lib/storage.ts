import {createClient,SupabaseClient} from '@supabase/supabase-js';
import {Progress,validateProgress} from './progress';
export const GUEST_KEY='quest90.guest.v1';
export const CONFIG_KEY='quest90.supabase.v1';
export type Connection={url:string;key:string};
export function validConnection(config:Connection){
 const u=new URL(config.url);if(u.protocol!=='https:'||!u.hostname.endsWith('.supabase.co')||u.username||u.password||u.search||u.hash)throw new Error('Use your HTTPS Supabase project URL, for example https://project.supabase.co.');
 if(config.key.startsWith('sb_secret_'))throw new Error('A secret key cannot be used in the browser. Use a publishable key.');
 if(config.key.startsWith('eyJ')){try{const body=JSON.parse(atob(config.key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));if(body.role!=='anon')throw new Error('role');}catch{throw new Error('Use the anon key, not a service-role or user token.');}}
 else if(!config.key.startsWith('sb_publishable_'))throw new Error('Enter a publishable key or legacy anon key.');
 return {url:u.origin,key:config.key.trim()};
}
export function connect(config:Connection):SupabaseClient{const c=validConnection(config);return createClient(c.url,c.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});}
export async function readCloud(client:SupabaseClient,userId:string){const {data,error}=await client.from('training_state').select('payload,revision,updated_at').eq('user_id',userId).maybeSingle();if(error)throw new Error(error.message);return data?{progress:validateProgress(data.payload),revision:data.revision as number}:null;}
export async function writeCloud(client:SupabaseClient,p:Progress,revision:number){validateProgress(p);const {data,error}=await client.rpc('save_training_state',{new_payload:p,expected_revision:revision});if(error)throw new Error(error.message.includes('STALE_REVISION')?'Another session saved newer progress. Export your unsaved work, then reload cloud progress to reconcile it.':error.message.includes('START_DATE_LOCKED')?'Your course start date is locked in Supabase and cannot be changed.':error.message);if(typeof data!=='number')throw new Error('Unexpected save response. Check the SQL setup.');return data;}
