 'use client';
import {useState} from 'react';
type Cell=string|number|null;
export type SqlInsights={plan?:Cell[][];planError?:string;tables?:{name:string;columns:string[];values:Cell[][]}[];rows:Cell[][];truncated:boolean;error?:string};
const steps=[
 ['FROM / JOIN','Choose tables and match related rows.','An employee can have many orders. A join can repeat the employee name.'],
 ['WHERE','Keep rows that satisfy a condition.','For paid totals, remove pending orders before calculating SUM. NULL requires IS NULL.'],
 ['GROUP BY / HAVING','Group rows, calculate aggregates and filter groups.','WHERE salary > 50000 filters employees; HAVING SUM(total) > 100 filters groups.'],
 ['SELECT / window functions','Choose output columns and compute values.','A window rank preserves rows, while grouping combines rows. DISTINCT can remove duplicates.'],
 ['ORDER BY / LIMIT','Sort the output and choose how many rows to return.','Without ORDER BY, SQL does not guarantee row order. Use a tie-breaker when selecting a top result.']
];
export default function SqlVisualGuide({result}:{result:SqlInsights|null}){
 const [step,setStep]=useState(0),[prediction,setPrediction]=useState('');
 return <section className="sql-visual-guide"><h3>Follow the journey of a query</h3><p>This is a teaching model of logical SQL stages, not an animation of your executed query. Not every query uses every stage; SQLite can choose a different physical plan.</p><div className="button-row">{steps.map(([title],i)=><button className="secondary" key={title} aria-pressed={step===i} onClick={()=>setStep(i)}>{i+1}. {title}</button>)}</div><article aria-live="polite"><h4>{steps[step][0]}</h4><p>{steps[step][1]}</p><p>{steps[step][2]}</p></article><div className="button-row"><button className="secondary" disabled={step===0} onClick={()=>setStep(s=>s-1)}>← Previous stage</button><button className="secondary" disabled={step===steps.length-1} onClick={()=>setStep(s=>s+1)}>Next stage →</button></div><label className="studio-field">Predict before running: how many rows, and why?<textarea rows={2} value={prediction} onChange={e=>setPrediction(e.target.value)} maxLength={2000}/></label><small>Prediction is scratch work for this visit. Save your reasoning in the explanation field below.</small>
 {result&&!result.error&&<><p><strong>Actual output: {result.rows.length}{result.truncated?'+':''} rows.</strong> Compare this with your prediction.</p><details><summary>Inspect actual sample tables</summary>{result.tables?.map(t=><div key={t.name}><h4>{t.name}</h4><div className="studio-table"><table><thead><tr>{t.columns.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{t.values.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j}>{cell===null?'NULL':String(cell)}</td>)}</tr>)}</tbody></table></div></div>)}</details><details><summary>Actual SQLite query plan</summary><p>SCAN reads through data; SEARCH uses a lookup strategy, often an index. A temporary B-tree can support sorting or grouping. This plan does not measure runtime or prove a query is efficient at production scale.</p>{result.planError&&<p>{result.planError}</p>}<ol>{result.plan?.map((row,i)=><li key={i}><code>{String(row[3]??row.join(' | '))}</code></li>)}</ol></details></>}
 <p><a href="/sql-game/">Try SQL Expedition: 10 missions with unlockable gates →</a></p></section>
}
