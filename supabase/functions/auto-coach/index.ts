import {handleCoachRequest} from './handler.ts';
declare const Deno:{env:{get:(name:string)=>string|undefined};serve:(handler:(req:Request)=>Promise<Response>)=>void};
Deno.serve(req=>handleCoachRequest(req,{env:name=>Deno.env.get(name),fetch}));
