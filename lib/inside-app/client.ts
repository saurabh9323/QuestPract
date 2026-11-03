import type {BookingOptions,BookingResult,ScenarioId} from './types';
export function runBooking(scenario:ScenarioId,options:BookingOptions,signal:AbortSignal):Promise<BookingResult>{
  return new Promise((resolve,reject)=>{
    if(signal.aborted){reject(new Error('Run cancelled.'));return}
    const worker=new Worker('/inside-app-worker.js');
    let settled=false;
    const finish=(error?:Error,result?:BookingResult)=>{if(settled)return;settled=true;clearTimeout(timer);signal.removeEventListener('abort',cancel);worker.terminate();error?reject(error):resolve(result!)};
    const cancel=()=>finish(new Error('Run cancelled.'));
    const timer=setTimeout(()=>finish(new Error('The database worker took too long. Try again.')),15000);
    signal.addEventListener('abort',cancel,{once:true});
    worker.onerror=()=>finish(new Error('The SQLite worker could not load. Reload the page and try again.'));
    worker.onmessage=({data})=>{
      if(settled)return;
      if(data?.error){finish(new Error(String(data.error)));return}
      if(!data||data.scenario!==scenario||!Array.isArray(data.steps)||!data.steps.length||data.steps.length>120||!data.final?.tables?.bookings||!Array.isArray(data.checks)){finish(new Error('The database returned an incomplete trace.'));return}
      finish(undefined,data);
    };
    try{worker.postMessage({scenario,options})}catch{finish(new Error('Unable to start the database worker. Please retry.'))}
  });
}
