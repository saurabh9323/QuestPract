/* Real SQLite, disposable per test. Never connects to an account database. */
importScripts('/vendor/sql-wasm.js');
function execute(SQL,seed,query){
 const db=new SQL.Database();
 try{
  db.run(seed);db.run('PRAGMA query_only=ON');
  let columns=[],rows=[],count=0;
  for(const statement of db.iterateStatements(query)){
   if(++count>1)throw new Error('Run one read statement at a time.');
   columns=statement.getColumnNames();if(!columns.length)throw new Error('Return rows with a SELECT query.');
   while(statement.step()){if(rows.length>=200)throw new Error('Result exceeds 200 rows. Narrow your query.');rows.push(statement.get());}
  }
  if(!count)throw new Error('Write a query first.');
  return {columns,rows};
 }finally{db.close();}
}
self.onmessage=async({data})=>{
 try{
  if(typeof data.query!=='string'||data.query.length>10000)throw new Error('Query limit: 10,000 characters.');
  const SQL=await initSqlJs({locateFile:()=>'/vendor/sql-wasm.wasm'});
  const tests=data.seeds.map((seed,index)=>{
   const expected=execute(SQL,seed,data.reference),actual=execute(SQL,seed,data.query);
   const normalize=rows=>{const result=rows.map(row=>JSON.stringify(row));return JSON.stringify(data.ordered?result:result.sort());};
   return {name:index===0?'Station data':'Extra data: ties, zero orders and NULL',passed:actual.columns.length===expected.columns.length&&normalize(actual.rows)===normalize(expected.rows),actual,expected};
  });
  self.postMessage({tests});
 }catch(error){self.postMessage({error:error.message||'Query failed.'});}
};
