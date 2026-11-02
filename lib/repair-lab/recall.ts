import {dayAssignments} from '../course';
import {submittedCourseDays} from '../progress-challenges';
import type {Progress} from '../progress';
import type {StudioState,StudioRecord} from '../studio-state';

export type RecallQuestion = {
  id:string; day:number; title:string; prompt:string; choices:string[]; answer:number;
  explanation:string; dryRun:string; transfer:string;
};
type Seed = [string,string,string[],number,string,string,string];
// Each question probes a decision or state transition; no complete implementation is revealed.
const seeds: Seed[] = [
 ['dsa-arrays-01','Two Sum sees [3] with target 6. What prevents incorrectly returning [0,0]?',
  ['Insert 3 before checking the complement','Check earlier values before inserting 3','Sort the output indices','Use the same index twice if values match'],1,
  'A previously stored complement must come from an earlier position. Checking first keeps one element from pairing with itself.',
  'Trace [3,3] with target 6. Write the Map before each check and the two distinct indices you would return.',
  'If only a yes/no answer is needed, which stored information could you omit?'],
 ['dsa-arrays-02','A sensor stream is [7,2,7]. You only need to know whether anything repeats. What information is enough?',
  ['The entire sorted history','A Map from index to value','A Set of previously seen values','The running sum'],2,
  'The decision needs presence, not frequency or positions. Set membership answers that directly; a running sum cannot identify repetition.',
  'Write the Set before processing each item. At which index can you stop?',
  'What must change if the requirement becomes “report every value and its count”?'],
 ['dsa-arrays-03','While compacting [0,4,0,2], the read pointer has consumed the first two elements. What should write mean?',
  ['The next position for a retained nonzero value','The last zero in the original input','The number of unvisited elements','Always the same position as read'],0,
  'The prefix before write contains retained values in their original order. After consuming 0 and 4, that prefix is [4] and write is 1.',
  'Trace read and write through the final 0 and 2. When is it safe to fill the remaining tail with zeroes?',
  'Would swapping every zero with the final element preserve nonzero order? Give a counterexample.'],
 ['dsa-arrays-04','For sorted [1,1,2,2,3], which comparison tells you whether a newly read value belongs in the unique prefix?',
  ['Compare with the largest value only','Compare with the input length','Compare with the first value always','Compare with the last retained value'],3,
  'Equal values are adjacent in sorted input. Comparing against the last retained value is enough to detect the next distinct value.',
  'Track the valid prefix and its length after each read. The unused tail is not part of the returned answer.',
  'If the array were unsorted, why would this adjacent-value reasoning fail?'],
 ['dsa-arrays-05','Remove 2 from [2,3,2,4] in place. With a write-pointer approach, when should write advance?',
  ['For every input element','Only when a value is retained','Only when the removed value is seen','Only after the full scan'],1,
  'write counts retained values. Copy 3, then 4 into the valid prefix; it ends at length 2 regardless of stale values after that prefix.',
  'Draw [valid prefix | unread input] after each read. Trace the all-removed case too.',
  'If order can change, how could replacing from the end reduce unnecessary writes?'],
 ['dsa-hash-01','Why is a Set alone insufficient to compare “aab” and “abb” as anagrams?',
  ['A Set cannot contain letters','Both strings have different lengths','Both have the same distinct letters but different counts','Anagrams require sorted original inputs'],2,
  'Anagram equality depends on multiplicity. Both Sets contain a and b, but their frequencies differ.',
  'Write counts for a and b in each string. Which count mismatch rejects the candidate?',
  'For lowercase a–z only, what tradeoff is there between 26 counters and a Map?'],
 ['dsa-hash-02','When grouping anagrams, which key groups “eat”, “tea” and “ate” together without merging “bat”?',
  ['The first character','The word length alone','The original word','A canonical sorted-character signature'],3,
  'All three anagrams have the same sorted character sequence. A length or first letter alone loses too much information.',
  'Write the key and group contents after processing eat, bat, tea, eat. Preserve the duplicate occurrence.',
  'How could a frequency signature avoid sorting each word, and why must separators be unambiguous?'],
 ['dsa-hash-03','You have counted characters in “aabbcd”. How do you preserve “first” when finding a unique character?',
  ['Scan the original text and find the first count of one','Sort the characters before returning an index','Return the final Map key','Return the smallest character alphabetically'],0,
  'The answer is about original position. A second scan of the source order finds c at index 4; sorting changes the meaning of the index.',
  'Trace the counts, then the second pass. Repeat with “aabb”, where no index qualifies.',
  'Why can a character that is unique so far cease to be unique later?'],
 ['dsa-hash-04','Unique intersection: A=[1,2,2], B=[2,2,3]. Which result satisfies the contract?',
  ['[2,2]','[2]','[1,2,3]','[]'],1,
  'Unique intersection keeps each shared value once. Membership plus an output Set can prevent duplicate matches.',
  'Show membership checks for each B value and the result after each check.',
  'How would the result contract differ for multiset intersection?'],
 ['dsa-hash-05','Multiset intersection: A contains two copies of 2, B contains three. After emitting two matches, what must happen?',
  ['Emit the third because 2 exists in A','Restore A’s count to two','Stop matching 2 because its remaining count is zero','Remove every result copy of 2'],2,
  'Each emitted result consumes one available occurrence. A count of zero prevents B from matching copies that A does not have.',
  'Draw remaining counts and output for A=[2,2,3], B=[2,2,2,3].',
  'Why would a boolean seen flag lose necessary information here?'],
 ['dsa-pointers-01','A palindrome check ignores punctuation and case. What should pointers do when the left character is “,”?',
  ['Skip it before comparing meaningful characters','Immediately return false','Compare it to the right letter','Delete every previous match'],0,
  'Ignored characters must not participate in the comparison. Skip them at either end, then compare normalized alphanumeric characters.',
  'Trace “A,ba!” with left and right indices. State what happens when the pointers cross.',
  'What result should an input containing only punctuation have under this contract?'],
 ['dsa-pointers-02','Sorted pair search: [1,3,5,8], target 9. At left=0 and right=2 the sum is 6. Which next move is justified?',
  ['Move right leftward','Restart the whole scan','Keep both pointers unchanged','Move left rightward'],3,
  'Every remaining value at or left of right is at most 5. Pairing the current 1 with a smaller value cannot reach 9, so this left candidate can be eliminated.',
  'Continue this state to left=1. Explain each discarded candidate, not just the pointer arithmetic.',
  'Would the same elimination be justified on an unsorted input?'],
 ['dsa-pointers-03','After sorting for Three Sum, what reduces the search after one position is fixed?',
  ['Search all remaining triples','Use two pointers on the remaining suffix for the needed pair','Use a Set of indices as the final answer','Move the fixed position backward each time'],1,
  'Fixing one value reduces the remaining requirement to a sorted pair sum. Duplicate fixed values and duplicate pair values need care to avoid repeated triplets.',
  'With sorted [-2,0,1,1,2], fix -2 and trace the suffix pointers for the remaining sum 2.',
  'Explain why two equal values at different indices may still be a valid pair.'],
 ['dsa-pointers-04','For Four Sum after sorting, which structure improves on four nested loops?',
  ['Four pointers that all move together','Only one scan regardless of values','Fix two distinct positions, then solve a sorted pair in their suffix','Remove all duplicate values before starting'],2,
  'Two fixed positions leave a pair target. Searching that suffix with two pointers gives a common O(n³) approach after sorting. Removing all duplicates can remove valid multiplicities.',
  'For [1,1,1,1] and target 4, explain why four distinct indices are allowed despite identical values.',
  'Which duplicate skips remove duplicate output tuples without deleting required input copies?'],
 ['dsa-pointers-05','Closest Three Sum: your current best sum is 4 for target 5. A candidate sums to 8. Should best change?',
  ['No: distance 1 is better than distance 3','Yes: 8 is the larger number','Yes: every new candidate replaces best','Only if all values are positive'],0,
  'The objective is absolute distance to the target, not maximum sum. Compare distances whenever you evaluate a candidate.',
  'Now evaluate candidate sums 3, 6 and 5. Write the distance at each step; an exact match has distance zero.',
  'If the contract allowed tied best sums, what tie-breaking rule would you need to clarify?'],
 ['dsa-window-01','For [2,1,5,1] with k=3, the first window sum is 8. What is the next window sum?',
  ['9: add only the new 1','6: subtract only the old 2','8: keep the old sum','7: subtract 2 and add 1'],3,
  'Adjacent windows share k−1 values. Replace only the departing and arriving elements: 8−2+1=7.',
  'Draw both windows and label shared, leaving and entering values. Repeat with all-negative numbers.',
  'Why is initializing best to zero wrong when every valid window has a negative sum?'],
 ['dsa-window-02','Longest unique substring on “abba”: after the second b, left=2. At the final a, its previous index is 0. What should left do?',
  ['Move backward to 1','Stay at 2 because the previous a is outside the window','Reset to 0','Move past the final a'],1,
  'A stale occurrence outside the current window must not move left backward. The maintained window is already unique with respect to that old a.',
  'Trace last-seen indices and left after all four characters. Which step would an unconditional assignment break?',
  'What invariant must be restored when the duplicate really is inside the current window?'],
 ['dsa-window-03','Why is a shrinking-window sum strategy safe for strictly positive numbers?',
  ['Removing the left value increases the sum','All positive arrays are sorted','Adding grows the sum and removing shrinks it','No positive array needs edge cases'],2,
  'Positivity makes sum changes monotone. Shrink while the sum is sufficient to explore shorter valid windows. Negative numbers invalidate this simple reasoning.',
  'For [2,3,1,2] and target 5, trace a grow step followed by each valid shrink. Record lengths before shrinking.',
  'Give an example with a negative value where removing left could increase the sum.'],
 ['dsa-window-04','In a window “AABA”, what is the fewest replacements needed to make all characters equal?',
  ['1, because length 4 minus largest frequency 3 equals 1','3, because A appears three times','0, because A is already most common','2, because there are two distinct letters'],0,
  'Keep the most frequent character and replace all others. Window length minus the largest frequency is the required replacement count for that window.',
  'Compute this quantity for AABA and ABBA. With budget k=1, which is valid?',
  'Why is the number of distinct letters alone insufficient to measure replacements?'],
 ['dsa-window-05','Find a permutation of pattern “ab” inside text “eidbaooo”. Which property should a candidate window satisfy?',
  ['Contains a or b somewhere','Has at most two distinct letters','Uses the same characters in the original order','Has length 2 and the same character frequencies'],3,
  'A permutation preserves length and multiplicities, not order. The window “ba” qualifies even though it reverses the pattern.',
  'Slide a length-two window through eidbaooo. Update the count balance for the leaving and entering letters.',
  'How does pattern “aab” expose the weakness of a Set-based comparison?'],
 ['dsa-prefix-01','nums=[2,4,-1,3], prefix=[0,2,6,5,8]. Which expression gives the inclusive sum from index 1 to 2?',
  ['prefix[2] − prefix[1]','prefix[3] − prefix[1]','prefix[3] − prefix[0]','prefix[2] + prefix[1]'],1,
  'prefix[i] is the sum of the first i elements. For [left,right], subtract the total before left from the total through right: 5−2=3.',
  'Draw prefix boundaries between cells. Work out [0,0] and [0,3] without rescanning.',
  'What changes if the array is updated frequently between queries?'],
 ['dsa-prefix-02','For a rectangle query with a padded 2D prefix table, why add back the top-left overlap after subtracting top and left strips?',
  ['To count each cell twice','Because negative values cannot be subtracted','The overlap was subtracted twice and must be restored once','Only because the table is square'],2,
  'Inclusion–exclusion removes the unwanted top and left regions. Their intersection was removed twice; adding it once leaves exactly the requested rectangle.',
  'On [[1,2],[3,4]], draw the padded 3×3 prefix table. Query just the bottom-right cell using four prefix entries.',
  'Why does a leading zero row and column simplify queries touching the top or left edge?'],
];

export const recallQuestions: RecallQuestion[] = seeds.map(([id,prompt,choices,answer,explanation,dryRun,transfer])=>{
  for(let day=1;day<=20;day++){
    const assigned=dayAssignments(day).dsa.find(q=>q.id===id);
    if(assigned)return {id,day,title:assigned.title,prompt,choices,answer,explanation,dryRun,transfer};
  }
  throw new Error(`Recall question ${id} is not assigned in days 1–20.`);
});
export const recallRecordId=(id:string)=>`repair-recall-${id}`;
export function completedRecallDays(p:Progress,today?:string){
  return submittedCourseDays(p,today).filter(d=>d.completed&&d.day<=20).map(d=>d.day).sort((a,b)=>a-b);
}
export function recallSelection(p:Progress,completedOnly:boolean,today?:string){
  const days=new Set(completedRecallDays(p,today));
  return recallQuestions.filter(q=>!completedOnly||days.has(q.day));
}
export function recallAttempts(record?:StudioRecord){
  // Sync can retain an edited draft as an attempt; only explicit quiz submissions count.
  return (record?.attempts||[]).filter(a=>a.fields.kind==='recall-choice'&&
    ['Correct decision','Review this decision'].includes(a.outcome)).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
}
export function recallSummary(questions:RecallQuestion[],studio:StudioState={}){
  let answered=0,firstCorrect=0;
  for(const q of questions){
    const first=recallAttempts(studio[recallRecordId(q.id)])[0];
    if(first){answered++;if(Number(first.fields.choice)===q.answer)firstCorrect++;}
  }
  return {answered,firstCorrect,total:questions.length};
}
export function selectRecallSprint(questions:RecallQuestion[],studio:StudioState={},count=5){
  // Previous misses first, then unseen, then the oldest correctly answered items.
  const priority=(q:RecallQuestion)=>{
    const attempts=recallAttempts(studio[recallRecordId(q.id)]);
    const last=attempts.at(-1);
    return {rank:last?(Number(last.fields.choice)===q.answer?2:0):1,time:last?Date.parse(last.at)||0:0};
  };
  return [...questions].sort((a,b)=>{const x=priority(a),y=priority(b);return x.rank-y.rank||x.time-y.time||a.day-b.day}).slice(0,count);
}
