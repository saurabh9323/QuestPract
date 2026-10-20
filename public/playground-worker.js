/* Executed only in a dedicated worker inside an opaque-origin, CSP-isolated iframe.
   Node tests run this exact file in a worker_threads test harness. */
'use strict';
self.onmessage = ({data}) => {
  const {source,args,limit=5000} = data;
  const trace=[], frames=[];
  let nextFrame=0, bytes=0, exhausted=false;
  const cap=Math.min(5000,Math.max(1,limit));
  function equal(actual,expected){
    if(actual===expected)return true;
    if(Array.isArray(actual)&&Array.isArray(expected))return actual.length===expected.length&&expected.every((v,i)=>equal(actual[i],v));
    if(actual&&expected&&Object.getPrototypeOf(actual)===Object.prototype&&Object.getPrototypeOf(expected)===Object.prototype){
      const keys=Object.keys(expected);
      return keys.length===Object.keys(actual).length&&keys.every(k=>Object.hasOwn(actual,k)&&equal(actual[k],expected[k]));
    }
    return false;
  }
  function copy(value,seen=new Set(),depth=0){
    if(value===undefined)return '[undefined]';
    if(typeof value==='number'&&!Number.isFinite(value))return String(value);
    if(value===null||['string','number','boolean'].includes(typeof value))return typeof value==='string'?value.slice(0,1000):value;
    if(typeof value==='function')return '[function]';
    if(depth>5)return '[depth limit]';
    if(seen.has(value))return '[circular]';
    seen.add(value);
    let result;
    if(value instanceof Map)result={type:'Map',entries:[...value.entries()].slice(0,128).map(pair=>pair.map(v=>copy(v,seen,depth+1)))};
    else if(value instanceof Set)result={type:'Set',values:[...value].slice(0,128).map(v=>copy(v,seen,depth+1))};
    else if(Array.isArray(value))result=value.slice(0,128).map(v=>copy(v,seen,depth+1));
    else result='[unsupported object]';
    seen.delete(value);return result;
  }
  function snapshot(){
    const state=Object.create(null),frame=frames.at(-1);
    for(const scope of frame?.scopes||[])for(const [name,get] of Object.entries(scope)){
      try{state[name]=copy(get())}catch{state[name]='[not initialized]'}
    }
    return state;
  }
  function emit(line,kind,target,value){
    if(exhausted||trace.length>=cap){exhausted=true;throw new Error('Step cap reached (5,000 maximum). Narrow the input or fix the loop.');}
    const event={step:trace.length,line,kind,target,value:copy(value),snapshot:snapshot(),frame:frames.at(-1)?.id||0};
    bytes+=JSON.stringify(event).length;
    if(bytes>4000000)throw new Error('Trace memory budget reached. Use a smaller input.');
    trace.push(event);
  }
  const denied=new Set(['constructor','prototype','__proto__','caller','callee','arguments']);
  function safeKey(key){if(denied.has(String(key)))throw new Error('Prototype/reflection access is not supported.');return key}
  const helpers={
    __enter(name,getters,line){if(frames.length>=100)throw new Error('Recursion depth cap: 100.');frames.push({id:++nextFrame,scopes:[getters]});emit(line,'call',name,null)},
    __leave(){frames.pop()},
    __scope(getters){const f=frames.at(-1);if(f)f.scopes.push(getters)},
    __unscope(){frames.at(-1)?.scopes.pop()},
    __value(line,kind,target,value){emit(line,kind,target,value);return value},
    __op(line,kind,target,operation){const value=operation();emit(line,kind,target,value);return value},
    __test(value,line){emit(line,'compare','condition',Boolean(value));return value},
    __get(object,key,line,target){const value=object[safeKey(key)];emit(line,'read',target,value);return value},
    __set(object,key,value,line,target){if(!Array.isArray(object)||!Number.isInteger(key)||key<0||key>=128)throw new Error('Array writes need an index from 0 to 127.');object[key]=value;emit(line,'write',target,value);return value},
    __call(fn,values,line,target){emit(line,'call',target,values);const result=fn(...values);emit(line,'return',target,result);return result},
    __method(object,key,values,line,target){
      safeKey(key);
      const allowed=object instanceof Map?['get','set','has','delete','clear']:object instanceof Set?['has','add','delete','clear']:Array.isArray(object)?['push','pop','shift','unshift','slice','includes','indexOf']:object===Math?['floor','ceil','round','abs','min','max','trunc']:typeof object==='string'?['charAt','slice','includes','indexOf']: [];
      if(!allowed.includes(key))throw new Error('Method not supported: '+String(key));
      emit(line,'call',target,values);
      const result=object[key](...values);
      if((Array.isArray(object)&&object.length>128)||((object instanceof Map||object instanceof Set)&&object.size>128))throw new Error('Collection cap: 128 entries.');
      if(['set','add','delete','clear','push','pop','shift','unshift'].includes(key))emit(line,'write',target,object);
      emit(line,'return',target,result);return result;
    }
  };
  try{
    // No evaluation occurs on the application/UI thread.
    const execute=new Function(...Object.keys(helpers),'__args','"use strict";\n'+source);
    const output=execute(...Object.values(helpers),args);
    self.postMessage({trace,output:copy(output),...(data.test?{passed:equal(output,data.expected)}:{})});
  }catch(error){self.postMessage({trace,output:null,error:error instanceof Error?error.message:'Execution failed.'});}
};
