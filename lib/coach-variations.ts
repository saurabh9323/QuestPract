import type {CoachInput} from './coach-contract';
import type {CartoonLesson,CartoonScene} from './cartoon-lessons';

// These are reference algorithms on generated inputs. Submitted code is never evaluated.
export function localVariation(input:CoachInput,id:string,seed:number):{lesson:CartoonLesson;challenge:string;hint:string}|null{
 const topic=`${input.title} ${input.topic}`.toLowerCase(),n=2+seed%7;
 const scene=(title:string,say:string,technical:string,code:string,items:string[],active:number[]):CartoonScene=>({title,say,technical,code,items,active});
 function result(title:string,world:CartoonLesson['world'],challenge:string,hint:string,scenes:CartoonScene[],question:string,choices:string[],answer:number,why:string){return {challenge,hint,lesson:{id,title,world,category:'Generated reference example',why:hint,limit:'Generated with a built-in reference algorithm. This is not execution or grading of your submitted answer.',scenes,quiz:{question,choices,answer,why}}}}
 if(/binary search/.test(topic)){
  const nums=[n,n+4,n+8,n+12,n+16],target=nums[seed%5],scenes:CartoonScene[]=[];let left=0,right=4;
  while(left<=right){const mid=Math.floor((left+right)/2),found=nums[mid]===target;
   scenes.push(scene(`Inspect index ${mid}`,found?`Pip found ${target}!`:`${nums[mid]} is ${nums[mid]<target?'too small. Keep the right half.':'too big. Keep the left half.'}`,`Range [${left}, ${right}]; middle ${mid}. ${found?'Return this index.':'Sorted order lets us discard one half.'}`,`const mid = Math.floor((left + right) / 2);\n// nums[mid] = ${nums[mid]}, target = ${target}\n${found?'return mid;':nums[mid]<target?'left = mid + 1;':'right = mid - 1;'}`,nums.map(String),[mid]));
   if(found)break;if(nums[mid]<target)left=mid+1;else right=mid-1;
  }
  return result('Pip halves a new search','array',`Find ${target} in ${JSON.stringify(nums)} with binary search. Also search for ${n+1}, which is absent. Give the invariant and complexity.`,'Keep only the sorted range that can still contain the target.',scenes,'Which precondition supports this value-based binary search?',['Values are sorted','Values are all unique and positive','The array length is even'],0,'Sorted order lets each comparison rule out a half. This version returns any matching index.');
 }
 if(/closure|counter/.test(topic)){
  const code=`function counter(start) {\n  let value = start;\n  return () => ++value;\n}\nconst a = counter(${n});\nconst b = counter(${n});\nconsole.log(a(), a(), b());`;
  return result('Two pockets, two memories','stage',`Predict the output of this counter: start=${n}; call a(), a(), b() where a and b come from separate counter(start) calls. Explain what happens if b = a instead.`,'Each factory call creates a new captured variable. Assigning the same returned function shares its captured variable.',[
   scene('Create the pockets','Pip gives each counter its own pocket.',`a and b each close over a different value initialized to ${n}.`,code,[`a: ${n}`,`b: ${n}`],[0,1]),
   scene('Visit a twice','Only pocket a changes when we call a.',`a returns ${n+1}, then ${n+2}. b is still ${n}.`,`a(); // ${n+1}\na(); // ${n+2}`,[`a: ${n+2}`,`b: ${n}`],[0]),
   scene('Visit b once','Pocket b remembers its own starting point.',`The final output is ${n+1} ${n+2} ${n+1}.`,`b(); // ${n+1}`,[`a: ${n+2}`,`b: ${n+1}`],[1])
  ],'If b = a, which state does b use?',['The same captured variable as a','A new captured variable','No captured variable'],0,'Copying the function reference does not call the factory again.');
 }
 if(/event loop|microtask|macrotask/.test(topic)){
  const code=`console.log('start-${n}');\nsetTimeout(() => console.log('timer'), 0);\nPromise.resolve().then(() => {\n  console.log('promise');\n  queueMicrotask(() => console.log('nested'));\n});\nconsole.log('end');`;
  return result('Pip serves the queues','queue','Predict the log order for a synchronous start/end, a zero-delay timer, and a promise that queues another microtask. Explain why zero delay does not mean immediate.','Finish synchronous JavaScript, then drain microtasks before the next timer task.',[
   scene('Finish the current task','Pip finishes the current job before taking new jobs.',`The script logs start-${n}, then end. It schedules the other callbacks.`,code,['Script','Promise','Timer'],[0]),
   scene('Drain the microtasks','A tiny job can add another tiny job to this queue. Pip finishes both.', 'The promise logs promise and queues nested. The microtask checkpoint continues until empty.','// promise → nested',['Promise','Nested','Timer'],[0,1]),
   scene('Take the timer task','Now the timer gets its turn.','For this browser snippet: start, end, promise, nested, timer. Rendering timing is not guaranteed by this illustration.','// start → end → promise → nested → timer',['Microtasks empty','Timer'],[1])
  ],'Why does nested appear before timer?',['New microtasks are drained at the same checkpoint','Timers never execute','A promise creates a new CPU thread'],0,'The checkpoint keeps processing queued microtasks before moving to the next task.');
 }
 if(/where|sql filter/.test(topic)){
  const rows=[`Asha | ${n+2}`,`Ben | ${n-1}`,'Chen | NULL'];
  return result('Pip checks a new SQL gate','table',`scores contains ('Asha',${n+2}), ('Ben',${n-1}), ('Chen',NULL). Which rows survive WHERE points >= ${n}? How would you also include unknown scores?`,'WHERE keeps rows where the predicate is true. Comparisons with NULL yield unknown.',[
   scene('Meet the rows','Three friends bring scores. One score is missing.','Missing is not the same as zero.',`SELECT name FROM scores WHERE points >= ${n};`,rows,[]),
   scene('Use the gate','Only Asha passes this rule.',`${n+2} >= ${n} is true; ${n-1} >= ${n} is false; NULL >= ${n} is unknown.`,'-- Result: Asha',rows,[0]),
   scene('Change the rule','Let people with a missing score pass too.','Use IS NULL for a null check, not = NULL.',`WHERE points >= ${n} OR points IS NULL`,rows,[0,2])
  ],'Which expression checks missing scores?',['points = NULL','points IS NULL','points >= NULL'],1,'IS NULL is true for a null value; equality with NULL yields unknown.');
 }
 if(/prefix sum|range sum/.test(topic)){
  const a=[n,n+1,n+2],prefix=[0,n,2*n+1,3*n+3],sum=a[1]+a[2];
  return result('Pip keeps running totals','array',`For ${JSON.stringify(a)}, build prefix sums with a leading zero. Return the sum of indices 1 through 2, then of index 0 alone.`,'For inclusive [left,right], subtract prefix[left] from prefix[right + 1].',[
   scene('Start with nothing','Before reading anything, Pip has a total of zero.','prefix[0] = 0; prefix[i+1] includes values through index i.','const prefix = [0];',a.map(String),[]),
   scene('Keep running totals','Each new value adds to the total we remember.',`Prefix array: ${JSON.stringify(prefix)}.`,'for (const value of nums)\n  prefix.push(prefix[prefix.length - 1] + value);',prefix.map(String),[1,2,3]),
   scene('Remove the unwanted start','Subtract the total before the range starts.',`prefix[3] - prefix[1] = ${prefix[3]} - ${prefix[1]} = ${sum}.`,'return prefix[right + 1] - prefix[left];',prefix.map(String),[1,3])
  ],'After O(n) preprocessing, how much time does each range sum need?',['O(1)','O(n)','O(n log n)'],0,'Each answer uses two array lookups and one subtraction. Updating values requires extra work or another structure.');
 }
 if(/xor|single number/.test(topic)){
  const a=n,b=n+10,values=[a,b,a],first=a^b,answer=first^a;
  return result('Pip cancels matching badges','array',`One integer appears once; all others appear exactly twice. Find it in ${JSON.stringify(values)} with XOR. Explain why the assumption matters.`,'x XOR x = 0; x XOR 0 = x; XOR is associative and commutative.',[
   scene('Pick up the first badge',`Pip starts with zero, then picks up ${a}.`,'0 ^ x = x.',`0 ^ ${a} = ${a}`,values.map(String),[0]),
   scene('Combine the next badge','The accumulator holds a bitwise combination, not a sum.',`${a} ^ ${b} = ${first}. JavaScript number bitwise operators use signed 32-bit integers.`,`acc ^= ${b};`,values.map(String),[1]),
   scene('Cancel the pair',`The two ${a}s cancel. ${answer} remains.`,'The approach needs exactly one unpaired value; it does not find arbitrary duplicates.','let acc = 0;\nfor (const value of nums) acc ^= value;\nreturn acc;',values.map(String),[0,2])
  ],'Does this algorithm solve arbitrary duplicate detection?',['Yes, for every input','No, the pairing assumption is essential'],1,'Several unpaired values produce their XOR, which may not be one of the input values.');
 }
 if(/sliding window|fixed window/.test(topic)&&!(/substring|string/.test(topic))){
  const a=[n,n+1,n+2,n+3],sums=[a[0]+a[1],a[1]+a[2],a[2]+a[3]];
  return result('Pip moves a two-seat window','array',`Find the maximum sum of exactly two adjacent values in ${JSON.stringify(a)}. Explain what leaves and enters at every move.`,'Initialize the first window; subtract the outgoing value and add the incoming value.',sums.map((sum,i)=>scene(`Window ${i+1}`,`Pip looks at seats ${i} and ${i+1}. Their sum is ${sum}.`,`Window sum ${sum}; best so far ${sum}.`,i===0?'let sum = nums[0] + nums[1];\nlet best = sum;':`sum += nums[${i+1}] - nums[${i-1}];\nbest = Math.max(best, sum);`,a.map(String),[i,i+1])), 'What lets us update the next window in O(1)?',['Reuse the previous sum, removing one and adding one','Sort every window','Compare every pair in the array'],0,'Fixed adjacent windows differ by their outgoing and incoming elements.');
 }
 if(/queue|fifo/.test(topic)&&!(/message|event|micro|macro/.test(topic))){
  return result('Pip runs a fair waiting line','queue',`Enqueue ${n}, then ${n+1}; dequeue once; enqueue ${n+2}. What is next to leave? Implement with an array and a head index.`,'FIFO serves the earliest unremoved item. A head index avoids repeatedly shifting every element.',[
   scene('Two arrivals','Pip remembers who arrived first.','The head points to the next item to remove.',`const queue = [${n}, ${n+1}];\nlet head = 0;`,[String(n),String(n+1)],[0]),
   scene('Serve the first arrival',`${n} leaves first. We move the head forward.`,'A logical removal advances head; the old array entry is still retained until cleared or compacted.','const value = queue[head++];',[`served ${n}`,String(n+1)],[1]),
   scene('A new arrival joins the back',`${n+2} waits behind ${n+1}.`, 'Periodically clear or compact consumed entries to control memory growth.',`queue.push(${n+2});\n// next dequeue: ${n+1}`,[`served ${n}`,String(n+1),String(n+2)],[1])
  ],'Which item leaves next?',[String(n+2),String(n+1),String(n)],1,'The earliest item still waiting is removed first.');
 }
 return null;
}
