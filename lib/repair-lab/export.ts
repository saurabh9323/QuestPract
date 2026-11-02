import type {RepairModule} from './modules';

export function repairDownload(module:RepairModule,code=module.starterCode){
  // The learner runs this file locally. Browser execution always uses the existing sandbox.
  return `// Quest90 · ${module.title}
// Save as ${module.id}.mjs and run: node ${module.id}.mjs
// Edit the functions, keep the tests, then explain your optimization.
// ${module.goal}
// JavaScript only. Passing supplied cases is not a proof of correctness.

import {isDeepStrictEqual} from 'node:util';

${code}

// ---- Supplied tests: do not change these to make a result pass. ----
const tests = ${JSON.stringify(module.tests,null,2)};
let failures = 0;
for (const test of tests) {
  try {
    const actual = solve(...structuredClone(test.args));
    const passed = isDeepStrictEqual(actual, test.expected);
    if (!passed) failures++;
    console.log(passed ? 'PASS' : 'FAIL', test.name);
    if (!passed) console.log({ expected: test.expected, actual });
  } catch (error) {
    failures++;
    console.error('ERROR', test.name, error.message);
  }
}
console.log((tests.length - failures) + '/' + tests.length + ' supplied tests passed');
process.exitCode = failures ? 1 : 0;
`;
}

export function repairGuide(module:RepairModule){
  return `# ${module.title}

${module.scenario}

## Contract
${module.goal}

## Your tasks
${module.tasks.map(t=>'- '+t).join('\n')}

## Run it
1. Download the starter .mjs file from Quest90. It contains unfinished JavaScript and runnable tests.
2. Use a supported Node.js installation and run: node ${module.id}.mjs
3. Repair the functions. Keep the supplied tests. Use Ctrl+C if your local loop does not finish.
4. Add your own edge cases, then explain the optimization: ${module.optimization}
5. Paste ONLY your function declarations into the portal editor and run again to get the recorded trace.

## Work online or in your own repository
Paste the functions and tests into a Node.js online editor that supports ES modules and node:util. Runtimes differ; a browser-only JavaScript console cannot run the Node imports.
To keep your own copy, add this .mjs file to a repository you own, commit it and save its URL in Quest90. This download does not create or fork a GitHub repository automatically.

## Reflection
- What was the smallest failing input?
- Why was the original approach wrong or wasteful?
- What invariant does the repair preserve?
- What time and extra-space costs do you expect, and under which assumptions?
- Which edge case did you add?

Downloaded code is not sandboxed when you run it locally. The portal uses an isolated worker with a timeout and step cap. No solutions, API keys or account data are included in the starter.
`;
}
