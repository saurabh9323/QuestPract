/* Disposable, real SQLite execution. HTTP, cache and request scheduling are models. */
importScripts('/vendor/sql-wasm.js');
self.onmessage=async({data})=>{
  let db;
  try{
    const valid=['normal','double-click','competing','lost-response','offline','stale-cache','expired-session'];
    if(!valid.includes(data?.scenario)||!data.options||['atomic','unique','idempotency'].some(k=>typeof data.options[k]!=='boolean'))throw new Error('Invalid booking scenario or controls.');
    const {scenario,options}=data;
    const SQL=await initSqlJs({locateFile:()=>'/vendor/sql-wasm.wasm'});
    db=new SQL.Database();
    db.run("PRAGMA foreign_keys=ON; CREATE TABLE seats(id TEXT PRIMARY KEY,status TEXT NOT NULL CHECK(status IN ('available','booked'))); CREATE TABLE bookings(id INTEGER PRIMARY KEY,seat_id TEXT NOT NULL REFERENCES seats(id),customer TEXT NOT NULL); CREATE TABLE request_keys(customer TEXT NOT NULL,key TEXT NOT NULL,seat_id TEXT NOT NULL,booking_id INTEGER NOT NULL REFERENCES bookings(id),PRIMARY KEY(customer,key)); INSERT INTO seats VALUES('A7','available');");
    if(options.unique)db.run('CREATE UNIQUE INDEX one_booking_per_seat ON bookings(seat_id)');
    if(scenario==='stale-cache')db.run("UPDATE seats SET status='booked' WHERE id='A7'; INSERT INTO bookings VALUES(1,'A7','Ravi');");
    const initialBookings=scenario==='stale-cache'?1:0;
    const state={ui:{status:'idle',message:'A7 appears available. Choose Book A7.',bookingId:null},cache:'available',requests:[],counters:{sql:0,requests:0,commits:0,rollbacks:0}};
    const rows=q=>{const r=db.exec(q)[0];return r?{columns:r.columns,rows:r.values}:{columns:[],rows:[]}};
    const table=(name,columns)=>{const r=rows('SELECT * FROM '+name+' ORDER BY 1');return {...r,columns:r.columns.length?r.columns:columns}};
    const snap=()=>JSON.parse(JSON.stringify({...state,tables:{seats:table('seats',['id','status']),bookings:table('bookings',['id','seat_id','customer']),request_keys:table('request_keys',['customer','key','seat_id','booking_id'])}}));
    const steps=[];
    function emit(lane,title,detail,concept,action=()=>{},extra={}){
      if(steps.length>=120)throw new Error('Trace limit reached.');
      const before=snap();action();steps.push({step:steps.length+1,lane,title,detail,concept,...extra,before,after:snap()});
    }
    function query(sql,params=[]){
      state.counters.sql++;
      const statement=db.prepare(sql);try{statement.bind(params);const values=[];while(statement.step())values.push(statement.getAsObject());return values}finally{statement.free()}
    }
    function execute(title,detail,concept,sql,params=[],requestId){
      let error=null;
      emit('database',title,detail,concept,()=>{state.counters.sql++;try{db.run(sql,params);if(sql==='COMMIT')state.counters.commits++;if(sql==='ROLLBACK')state.counters.rollbacks++}catch(e){error=e}}, {sql,params,requestId});
      if(error){steps[steps.length-1].title+=' — rejected';steps[steps.length-1].detail=String(error.message);throw error}
    }
    emit('react','The seat map is visible','The screen uses a cached availability value. No booking has been made by this click.','state');
    emit('react','Book A7 → loading','Asha clicks Book. State changes before any reply arrives.','state',()=>{state.ui={status:'loading',message:'Request in progress…',bookingId:null}});
    if(scenario==='offline'){
      emit('network','Delivery failed','The simulated connection drops before the request reaches the handler.','offline');
      emit('react','Show a retryable error','No booking was created. Asha can try again when connected.','offline',()=>{state.ui={status:'error',message:'Offline: no request delivered. Retry when connected.',bookingId:null}});
    }else{
      const request=(id,customer,key)=>({id,customer,key,status:'sent',http:null,bookingId:null});
      const pending=[request('r1','Asha','intent-asha-a7')];
      if(scenario==='double-click')pending.push(request('r2','Asha','intent-asha-a7'));
      if(scenario==='competing')pending.push(request('r2','Ravi','intent-ravi-a7'));
      if(scenario==='lost-response')pending.push(request('r2','Asha','intent-asha-a7'));
      // Two preflight reads happen before writes in the controlled race schedule.
      const staleReads={};
      if(scenario==='competing')for(const req of pending){
        emit('network',`${req.id}: request sent`,`${req.customer} asks for A7. Both requests will read before the first write.`, 'request',()=>{state.requests.push({...req});state.counters.requests++},{requestId:req.id});
        emit('server',`${req.customer}: validate identity & seat`,'The modeled identity is valid and the seat input is A7.','auth',()=>{},{requestId:req.id});
        emit('database',`${req.customer}: preflight read`,'This read does not reserve the seat. Its answer can be stale by the time a write happens.','race',()=>{staleReads[req.id]=query('SELECT status FROM seats WHERE id=?',['A7'])[0].status},{sql:'SELECT status FROM seats WHERE id=?',params:['A7'],requestId:req.id});
      }
      for(const req of pending){
        if(scenario!=='competing')emit('network',`${req.id}: ${req.id==='r2'?'retry / repeat request':'request sent'}`,`${req.customer} → POST /bookings, seat=A7, key=${req.key}.`,'request',()=>{state.requests.push({...req});state.counters.requests++},{requestId:req.id});
        const stored=()=>state.requests.find(r=>r.id===req.id);
        const response=(http,bookingId,message,replayed=false)=>{
          if(scenario==='lost-response'&&req.id==='r1'&&http===201){
            emit('network','The committed response is lost','The request succeeded in the database, but the client did not receive it.','uncertainty',()=>{Object.assign(stored(),{status:'reply lost',http:null,bookingId:null})},{requestId:req.id});
            emit('react','Timeout → outcome unknown','Keep the same intention key for retry. Do not assume the write failed.','uncertainty',()=>{state.ui={status:'unknown',message:'No reply. Booking may exist. Retrying with the same key…',bookingId:null}});return;
          }
          emit('network',`${req.id}: HTTP ${http}`,message,replayed?'idempotency':'request',()=>{Object.assign(stored(),{http,bookingId,status:replayed?'replayed':http<300?'confirmed':'rejected'})},{requestId:req.id});
          if(req.customer==='Asha')emit('react',http<300?'Show confirmation':'Show a useful error',message,'state',()=>{state.ui={status:http<300?'confirmed':'error',message,bookingId:bookingId??state.ui.bookingId}},{requestId:req.id});
        };
        if(scenario!=='competing')emit('server','Validate identity & seat',scenario==='expired-session'?'The simulated session is expired. Reject before SQL.':'Identity and seat input passed the modeled checks.','auth',()=>{},{requestId:req.id});
        if(scenario==='expired-session'){response(401,null,'Sign in again before booking.');continue}
        if(options.idempotency){
          let previous;
          emit('database','Look up this request key','Match the customer, key and seat. A known result can be replayed.','idempotency',()=>{previous=query('SELECT booking_id,seat_id FROM request_keys WHERE customer=? AND key=?',[req.customer,req.key])[0]},{sql:'SELECT booking_id,seat_id FROM request_keys WHERE customer=? AND key=?',params:[req.customer,req.key],requestId:req.id});
          if(previous){response(200,previous.booking_id,`Booking #${previous.booking_id} confirmed again; no second insert.`,true);continue}
        }
        if(!options.atomic&&scenario!=='competing')emit('database','Read before writing','This separate read is not a reservation.','race',()=>{staleReads[req.id]=query('SELECT status FROM seats WHERE id=?',['A7'])[0].status},{sql:'SELECT status FROM seats WHERE id=?',params:['A7'],requestId:req.id});
        if(!options.atomic&&staleReads[req.id]!=='available'){response(409,null,'A7 is already booked. Choose another seat.');continue}
        let inTransaction=false;
        try{
          execute('BEGIN transaction','Group the seat change, booking and request result.','transaction','BEGIN',[],req.id);inTransaction=true;
          if(options.atomic){
            execute('Reserve only if still available','The database evaluates availability as part of this write.','atomic',"UPDATE seats SET status='booked' WHERE id=? AND status='available'",['A7'],req.id);
            const changed=db.getRowsModified();
            emit('server',`${changed} seat row changed`,changed?'Continue: this transaction reserved the seat.':'Stop: the current database state rejects this booking.','atomic',()=>{},{requestId:req.id});
            if(changed===0){execute('ROLLBACK','No available seat was changed; abandon this transaction.','transaction','ROLLBACK',[],req.id);inTransaction=false;response(409,null,'A7 is already booked. Choose another seat.');continue}
          }else execute('Blind write after the earlier check','This write trusts the old read. Two customers may both reach it.','race',"UPDATE seats SET status='booked' WHERE id=?",['A7'],req.id);
          execute('Insert the booking',options.unique?'The unique index rejects a second booking for A7.':'No unique index is present; duplicate seat bookings can be inserted.','unique','INSERT INTO bookings(seat_id,customer) VALUES(?,?)',['A7',req.customer],req.id);
          let bookingId;
          emit('database','Read the new booking ID','Use the ID produced by the actual insert.','transaction',()=>{bookingId=Number(query('SELECT last_insert_rowid() AS id')[0].id)},{sql:'SELECT last_insert_rowid() AS id',params:[],requestId:req.id});
          if(options.idempotency)execute('Remember the result for retry','Store the booking ID in the same transaction as the booking.','idempotency','INSERT INTO request_keys(customer,key,seat_id,booking_id) VALUES(?,?,?,?)',[req.customer,req.key,'A7',bookingId],req.id);
          execute('COMMIT','The booking is now committed. A network reply can still fail.','transaction','COMMIT',[],req.id);inTransaction=false;
          emit('server','Booking committed',`The handler has booking #${bookingId}.`,'transaction',()=>{},{requestId:req.id});
          emit('cache','Refresh the availability copy','The next seat-map read should show the committed state.','cache',()=>{state.cache='booked'},{requestId:req.id});
          response(201,bookingId,`Booking #${bookingId} confirmed for A7.`);
        }catch(error){
          if(inTransaction){execute('ROLLBACK after constraint failure','The failed insert and earlier seat change are rolled back together.','transaction','ROLLBACK',[],req.id)}
          if(!String(error.message).includes('UNIQUE constraint failed'))throw error;
          emit('server','The unique rule stopped the duplicate','The database rejected the second seat booking. The handler returns a conflict.','unique',()=>{},{requestId:req.id});
          response(409,null,'A7 is already booked. The database rejected a duplicate.');
        }
      }
    }
    if(!['offline','expired-session'].includes(scenario)){
      let finalStatus;
      emit('database','Read final availability','The actual seat row supplies the refreshed value.','cache',()=>{finalStatus=query('SELECT status FROM seats WHERE id=?',['A7'])[0].status},{sql:'SELECT status FROM seats WHERE id=?',params:['A7']});
      emit('cache','Refresh the final seat map','Update the teaching cache from the actual SQLite row.','cache',()=>{state.cache=finalStatus});
    }
    const final=snap(),count=final.tables.bookings.rows.length;
    const checks=[
      {name:'One seat has at most one booking',passed:count<=1,detail:`${count} booking row(s) for A7.`},
      {name:'No write after rejected identity or undelivered request',passed:!['offline','expired-session'].includes(scenario)||count===initialBookings,detail:['offline','expired-session'].includes(scenario)?`${count-initialBookings} new booking rows.`:'This run delivered an authenticated request.'},
      {name:'Confirmed replies reference actual rows',passed:final.requests.filter(r=>r.http&&r.http<300).every(r=>final.tables.bookings.rows.some(b=>b[0]===r.bookingId)),detail:'Every successful reply is checked against the final bookings table.'},
    ];
    self.postMessage({scenario,options,steps,final,checks});
  }catch(error){self.postMessage({error:error.message||'Booking run failed.'})}
  finally{db?.close()}
};
