import type {StudioState} from '../studio-state';
import type {BookingResult} from './types';
export const insideRecord=(scenario:string)=>`inside-app-cinema-${scenario}`;
export function insideProgress(studio:StudioState={}){
  const records=Object.entries(studio).filter(([id])=>id.startsWith('inside-app-cinema-'));
  const attempts=records.flatMap(([,r])=>r.attempts.filter(a=>a.outcome==='Inside a Real App · reflected'&&a.fields.runSummary&&a.fields.explanation?.trim()));
  return {scenarios:records.filter(([,r])=>r.attempts.some(a=>attempts.includes(a))).length,attempts:attempts.length,predictions:attempts.filter(a=>/^[012]$/.test(a.fields.runPrediction||'')).length,investigations:attempts.filter(a=>a.fields.investigated?.trim()).length,explanations:attempts.length};
}
export function bookingSummary(run:BookingResult){return JSON.stringify({scenario:run.scenario,options:run.options,steps:run.steps.length,bookings:run.final.tables.bookings.rows.length,counters:run.final.counters,checks:run.checks})}
export function bookingReport(run:BookingResult,prediction:string,explanation:string){
  return `# Inside a Real App — cinema booking\n\nScenario: ${run.scenario}\n\nReal SQLite in a disposable worker. Network, server, cache and competing timing are models. No real booking or payment.\n\nPrediction (before run): ${prediction||'Not recorded'} booking rows.\n\nControls: ${JSON.stringify(run.options)}\n\n## Database checks\n${run.checks.map(c=>`- ${c.passed?'PASS':'FAIL'}: ${c.name}. ${c.detail}`).join('\n')}\n\n## Request journey\n${run.steps.map(s=>`${s.step}. [${s.lane}] ${s.title}: ${s.detail}${s.sql?`\n   SQL: ${s.sql}\n   Parameters: ${JSON.stringify(s.params)}`:''}`).join('\n')}\n\n## My explanation\n${explanation||'Not written yet.'}\n\nPassing these checks is not proof of production correctness.\n`;
}
