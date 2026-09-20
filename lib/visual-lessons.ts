export type Algorithm='two-sum'|'binary-search';
export type Frame={title:string;explanation:string;active:number[];found:number[];discarded:number[];memory:[number,number][];variables:Record<string,string|number>;line:number;result?:string};
const base:Frame={title:'',explanation:'',active:[],found:[],discarded:[],memory:[],variables:{},line:-1};
export function parseVisualInput(text:string,target:string,algorithm:Algorithm){
 const parts=text.split(',').map(n=>n.trim());
 if(!text.trim()||parts.some(n=>!n)||parts.length>12)throw new Error('Enter 1–12 comma-separated integers.');
 const nums=parts.map(Number),goal=Number(target);
 if(nums.some(n=>!Number.isInteger(n)||Math.abs(n)>1000)||!target.trim()||!Number.isInteger(goal)||Math.abs(goal)>2000)throw new Error('Use integer values between −1000 and 1000, and a target between −2000 and 2000.');
 if(algorithm==='binary-search'&&nums.some((n,i)=>i>0&&n<nums[i-1]))throw new Error('Binary search needs ascending input. Sort the values first, then try again.');
 return {nums,target:goal};
}
export function algorithmFrames(nums:number[],target:number,algorithm:Algorithm):Frame[]{
 const frames:Frame[]=[{...base,title:'Predict before you play',explanation:algorithm==='two-sum'?'Which two distinct indices sum to the target? The map starts empty.':'Which index holds the target? Binary search only works on sorted input.',variables:{target}}];
 if(algorithm==='two-sum'){
  const seen=new Map<number,number>();
  for(let i=0;i<nums.length;i++){
   const needed=target-nums[i],variables={i,value:nums[i],needed,target};
   frames.push({...base,title:`Inspect index ${i}`,explanation:`${target} − ${nums[i]} = ${needed}. Look for ${needed} among earlier values.`,active:[i],variables,memory:[...seen],line:2});
   if(seen.has(needed)){const j=seen.get(needed)!;frames.push({...base,title:'Found two different indices',explanation:`Index ${j} holds ${needed}; index ${i} holds ${nums[i]}. Together they make ${target}.`,found:[j,i],active:[i],variables,memory:[...seen],line:3,result:`[${j}, ${i}]`});return frames;}
   seen.set(nums[i],i);frames.push({...base,title:'Remember this value',explanation:`${needed} was not in the map. Store value ${nums[i]} → index ${i}, then move forward.`,active:[i],variables,memory:[...seen],line:4});
  }
  frames.push({...base,title:'No matching pair',explanation:'Every value was checked against earlier values. No two distinct indices sum to the target.',memory:[...seen],variables:{target},line:6,result:'[]'});
 }else{
  let low=0,high=nums.length-1;
  while(low<=high){
   const mid=Math.floor((low+high)/2),variables={low,mid,high,target};
   const discarded=nums.flatMap((_,i)=>i<low||i>high?[i]:[]);
   frames.push({...base,title:`Check the middle: index ${mid}`,explanation:`The remaining search range is ${low}…${high}. Its middle value is ${nums[mid]}.`,active:[mid],discarded,variables,line:2});
   if(nums[mid]===target){frames.push({...base,title:'Target found',explanation:`Value ${target} is at index ${mid}. With duplicates, this algorithm returns one matching index, not necessarily the first.`,found:[mid],discarded,variables,line:3,result:String(mid)});return frames;}
   const tooSmall=nums[mid]<target;if(tooSmall)low=mid+1;else high=mid-1;
   frames.push({...base,title:tooSmall?'Discard the left portion':'Discard the right portion',explanation:tooSmall?`${nums[mid]} is too small. Sorted order rules out this value and everything to its left.`:`${nums[mid]} is too large. Sorted order rules out this value and everything to its right.`,discarded:nums.flatMap((_,i)=>i<low||i>high?[i]:[]),variables:{low,mid,high,target},line:tooSmall?4:5});
  }
  frames.push({...base,title:'Search range is empty',explanation:'low is now greater than high. The target is not present.',discarded:nums.map((_,i)=>i),variables:{low,high,target},line:7,result:'-1'});
 }
 return frames;
}
export const algorithmCode:Record<Algorithm,string[]>={
 'two-sum':['const seen = new Map();','for (let i = 0; i < nums.length; i++) {','  const needed = target - nums[i];','  if (seen.has(needed)) return [seen.get(needed), i];','  seen.set(nums[i], i);','}','return [];'],
 'binary-search':['let low = 0, high = nums.length - 1;','while (low <= high) {','  const mid = Math.floor((low + high) / 2);','  if (nums[mid] === target) return mid;','  if (nums[mid] < target) low = mid + 1;','  else high = mid - 1;','}','return -1;']
};
