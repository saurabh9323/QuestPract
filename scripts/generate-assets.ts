import {mkdirSync,writeFileSync} from 'node:fs';
import {chapters,quests,curriculumVersion} from '../lib/curriculum';
import {questionBank,theory} from '../lib/bank';
const esc=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
mkdirSync('public/diagrams',{recursive:true});
for(const c of chapters){const blocks=c.diagram.map((label,i)=>{const x=30+(i%2)*270,y=46+Math.floor(i/2)*126;return `<rect x="${x}" y="${y}" width="230" height="84" rx="12" fill="${i===0?'#d4ecb7':'#ffffff'}" stroke="#ceddc2"/><text x="${x+17}" y="${y+24}" font-family="Arial,sans-serif" font-size="11" fill="#7c9468">0${i+1}</text><text x="${x+115}" y="${y+53}" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" fill="#34502e">${esc(label)}</text>`}).join('');writeFileSync(`public/diagrams/chapter-${c.id}.svg`,`<svg xmlns="http://www.w3.org/2000/svg" width="560" height="296" viewBox="0 0 560 296" role="img" aria-label="${esc(c.name)} concept flow"><rect width="560" height="296" rx="16" fill="#f2f7ec"/><defs><marker id="arrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="none" stroke="#88a176"/></marker></defs><g fill="none" stroke="#88a176" stroke-width="1.5" marker-end="url(#arrow)"><path d="M264 88 H294"/><path d="M415 133 V148 H145 V165"/><path d="M264 214 H294"/></g>${blocks}</svg>`)}
writeFileSync('public/curriculum.json',JSON.stringify({version:curriculumVersion,chapters,quests},null,2));
writeFileSync('public/question-bank.json',JSON.stringify({questions:questionBank,theory},null,2));
console.log(`Generated ${chapters.length} concept images and ${quests.length} quests.`);
