import {mkdir,copyFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
await mkdir(new URL('public/vendor/',root),{recursive:true});
for(const file of ['sql-wasm.js','sql-wasm.wasm'])await copyFile(new URL(`node_modules/sql.js/dist/${file}`,root),new URL(`public/vendor/${file}`,root));
await copyFile(new URL('node_modules/sql.js/LICENSE',root),new URL('public/vendor/sql.js.LICENSE',root));
