import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dsaPatternLessons,patternHtml} from '../lib/dsa-pattern-lab';
import {parseWorkspacePath} from '../lib/workspace-routes';
test('twenty unique pattern lessons have bounded valid replay states and theory',()=>{
 assert.equal(dsaPatternLessons.length,20);assert.equal(new Set(dsaPatternLessons.map(p=>p.id)).size,20);
 for(const p of dsaPatternLessons){assert.ok(p.clue&&p.avoid&&p.baseline&&p.invariant&&p.realLife);assert.ok(p.scenarios.length>=2);assert.ok(p.frames.length>=3);for(const f of p.frames){assert.ok(f.action&&f.memory&&f.reason);assert.ok(f.focus.every(i=>i>=0&&i<f.cells.length));}}
 assert.deepEqual(parseWorkspacePath('/dsa-patterns/'),{view:'patternLab'});
});
test('HTML export has offline controls and escapes text and embedded frame data',()=>{
 const p={...dsaPatternLessons[0],name:'<img src=x onerror=alert(1)>',frames:[{action:'</script><script>alert(1)</script>',cells:['<img>'],focus:[0],memory:'state',reason:'rule'}]};
 const html=patternHtml(p);assert.ok(html.includes('&lt;img'));assert.equal((html.match(/<script>/g)||[]).length,1);assert.ok(html.includes('textContent'));assert.ok(html.includes('id="play"'));assert.ok(!html.includes('src="http'));
});
