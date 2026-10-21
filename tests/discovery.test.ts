import {test} from 'node:test';
import assert from 'node:assert/strict';
import {discoveryTopics,discoveryDay,makeDiscovery,discoveryFingerprint,sourceBacked} from '../lib/discovery';
import {readCoachPack} from '../lib/auto-coach';
import {officialReference} from '../supabase/functions/auto-coach/handler';
import {languageBasics} from '../lib/language-basics';
test('daily discovery uses India date and stable per-topic request identities',()=>{
 assert.equal(discoveryDay(new Date('2026-10-21T19:00:00Z')),'2026-10-22');
 const a=makeDiscovery('React','2026-10-21'),b=makeDiscovery('React','2026-10-21');assert.equal(a.id,b.id);assert.notEqual(a.id,makeDiscovery('React','2026-10-22').id);
 assert.equal(a.fields.research,'yes');assert.equal(a.fields.decision,'pending');assert.ok(readCoachPack(a.fields.pack));assert.throws(()=>makeDiscovery('https://attacker.invalid','2026-10-21'));
});
test('each discovery topic resolves to a fixed official source; arbitrary URLs do not',()=>{
 for(const topic of discoveryTopics)assert.ok(officialReference('Daily discovery: '+topic)?.startsWith('https://'));
 assert.equal(officialReference('http://127.0.0.1/secrets'),undefined);
 assert.equal(officialReference('Daily discovery: React https://attacker.invalid'),'https://react.dev/blog');
});
test('local or unsourced output cannot pass acceptance gate',()=>{
 const pack=readCoachPack(makeDiscovery('DSA','2026-10-21').fields.pack)!;assert.equal(sourceBacked(pack),false);assert.equal(sourceBacked({...pack,mode:'gemini'}),false);
 assert.equal(sourceBacked({...pack,mode:'gemini',sources:[{title:'Reference',url:'https://react.dev/blog',checkedAt:new Date().toISOString()}]}),true);
 assert.equal(discoveryFingerprint('What IS React?'),discoveryFingerprint('what is react'));
});
test('C examples retain escaped newlines in their string literals',()=>{assert.ok(languageBasics.C.includes('"%d\\n"'));assert.ok(languageBasics['C++'].includes('"\\n"'));assert.equal(Object.keys(languageBasics).length,5)});
