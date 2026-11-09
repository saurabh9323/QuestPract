import {readFileSync,statSync} from 'node:fs';
import {resolve,relative,sep} from 'node:path';

const root=resolve('out');
try{
 const html=readFileSync(resolve(root,'index.html'),'utf8');
 const paths=[...new Set([...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(match=>match[1].split('?')[0]))];
 const scripts=paths.filter(path=>path.startsWith('/')&&!path.startsWith('//')).map(path=>{
  const file=resolve(root,'.'+path),inside=relative(root,file);
  if(inside.startsWith('..'+sep)||inside==='..')throw new Error('Script path is outside the export.');
  return {path,bytes:statSync(file).size};
 });
 console.log(JSON.stringify({scope:'Local scripts referenced by exported home HTML; uncompressed bytes, not runtime requests or a speed score',scripts:scripts.length,bytes:scripts.reduce((sum,item)=>sum+item.bytes,0),files:scripts},null,2));
}catch(error){console.error('Build the static export first. '+error.message);process.exitCode=1;}
