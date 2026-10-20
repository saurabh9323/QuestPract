import type {LabModule} from './types';

// Deliberately executable starting points: edit an approach, then run its tests.
export const playgroundModules:LabModule[] = [
  {
    id:'two-pointers',title:'Two pointers · find a sorted pair',topic:'DSA',
    goal:'Return indices of two different elements whose sum equals target, or []. Input is sorted ascending.',
    inputs:[[1,2,4,7,11],9],expectedPattern:'Two pointers',renderers:['array','variables'],
    hints:['Use the ordering of the input.','A sum that is too small needs a larger left value.','Move one end inward after comparing the sum.','Keep left < right so an element cannot pair with itself.'],
    starterCode:`function solve(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  while (left < right) {
    const sum = nums[left] + nums[right];
    if (sum === target) return [left, right];
    if (sum < target) left++;
    else right--;
  }
  return [];
}`,
    tests:[{name:'Pair in the middle',args:[[1,2,4,7,11],9],expected:[1,3]},{name:'Duplicates',args:[[3,3],6],expected:[0,1]},{name:'No reuse',args:[[4],8],expected:[]},{name:'Empty',args:[[],2],expected:[]}]
  },
  {
    id:'sliding-window',title:'Sliding window · largest fixed window',topic:'DSA',
    goal:'Return the largest sum of k adjacent elements. Return null if k is invalid.',
    inputs:[[2,1,5,1,3,2],3],expectedPattern:'Sliding window',renderers:['array','variables'],
    hints:['Adjacent values form a window.','Reuse the previous sum.','Add the arriving value and subtract the leaving one.','Only update the best sum once the window has k values.'],
    starterCode:`function solve(nums, k) {
  if (k <= 0 || k > nums.length) return null;
  let sum = 0;
  let best = -Infinity;
  for (let right = 0; right < nums.length; right++) {
    sum += nums[right];
    if (right >= k) sum -= nums[right - k];
    if (right >= k - 1 && sum > best) best = sum;
  }
  return best;
}`,
    tests:[{name:'Normal window',args:[[2,1,5,1,3,2],3],expected:9},{name:'Negative values',args:[[-5,-2,-8],2],expected:-7},{name:'Single',args:[[6],1],expected:6},{name:'Invalid size',args:[[],2],expected:null}]
  },
  {
    id:'binary-search',title:'Binary search · shrink the range',topic:'DSA',
    goal:'Return the index of target in a sorted array of distinct numbers, or -1.',
    inputs:[[1,3,5,7,9,11,13],11],expectedPattern:'Binary search',renderers:['array','variables'],
    hints:['A sorted range lets you discard half.','Compare the middle value with the target.','Use mid + 1 or mid - 1 to make progress.','The loop includes left === right.'],
    starterCode:`function solve(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}`,
    tests:[{name:'Found',args:[[1,3,5,7,9,11,13],11],expected:5},{name:'Missing',args:[[1,3,5],4],expected:-1},{name:'One item',args:[[5],5],expected:0},{name:'Empty',args:[[],1],expected:-1}]
  },
  {
    id:'bubble-sort',title:'Bubble sort · watch adjacent swaps',topic:'DSA',
    goal:'Return the numbers in ascending order. This starting implementation changes its input array.',
    inputs:[[5,1,4,2,8]],expectedPattern:'Adjacent comparison and swap',renderers:['array','variables'],
    hints:['Compare neighbors.','The largest remaining value moves to the end.','Shorten the inner loop on each pass.','A temporary variable prevents overwriting the value needed for the second write.'],
    starterCode:`function solve(nums) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = 0; j < nums.length - i - 1; j++) {
      if (nums[j] > nums[j + 1]) {
        const temp = nums[j];
        nums[j] = nums[j + 1];
        nums[j + 1] = temp;
      }
    }
  }
  return nums;
}`,
    tests:[{name:'Mixed',args:[[5,1,4,2,8]],expected:[1,2,4,5,8]},{name:'Duplicates',args:[[3,1,3]],expected:[1,3,3]},{name:'Negative',args:[[0,-2,1]],expected:[-2,0,1]},{name:'Empty',args:[[]],expected:[]}]
  },
  {
    id:'hash-two-sum',title:'Two Sum · remember with a Map',topic:'DSA',
    goal:'Return indices of the first pair found by scanning left to right, or []. The same element cannot be used twice.',
    inputs:[[2,7,11,15],9],expectedPattern:'Hash lookup',renderers:['array','variables'],
    hints:['Remember information from earlier elements.','Look for target minus the current number.','Check before inserting the current index.','Store number → index and return the stored index plus the current one.'],
    starterCode:`function solve(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}`,
    tests:[{name:'Found',args:[[2,7,11,15],9],expected:[0,1]},{name:'Duplicate pair',args:[[3,3],6],expected:[0,1]},{name:'No self-pair',args:[[3],6],expected:[]},{name:'Negative pair',args:[[-2,5,7],3],expected:[0,1]}]
  }
];
