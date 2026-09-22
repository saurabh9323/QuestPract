/* Isolated, disposable SQLite exercise database. Never connects to Supabase. */
importScripts('/vendor/sql-wasm.js');
self.onmessage = async function(event) {
  let db;
  try {
    const {sql,seed}=event.data;
    if(typeof sql!=='string'||sql.length>10000)throw new Error('Use a query up to 10,000 characters.');
    const SQL=await initSqlJs({locateFile:()=>'/vendor/sql-wasm.wasm'});
    db=new SQL.Database();db.run(seed);db.run('PRAGMA query_only = ON;');
    let columns=[],rows=[],truncated=false,count=0;
    for(const statement of db.iterateStatements(sql)){
      count++;if(count>1)throw new Error('Run one statement at a time.');
      columns=statement.getColumnNames();
      if(!columns.length)throw new Error('Use a read query that returns columns.');
      while(statement.step()){if(rows.length>=200){truncated=true;break}rows.push(statement.get())}
    }
    if(!count)throw new Error('Write a SELECT query first.');
    self.postMessage({columns,rows,truncated});
  } catch(error){self.postMessage({columns:[],rows:[],truncated:false,error:error.message||'Query failed.'})}
  finally{if(db)db.close()}
};
