import type {InterviewDepth} from '@/lib/interview-depth';
export default function InterviewDeepDive({depth}:{depth:InterviewDepth}){
 return <div className="interview-deep-dive">
  <h4>Start your answer</h4><blockquote>{depth.opener}</blockquote>
  <h4>{depth.codeLabel}</h4><pre><code>{depth.code}</code></pre>
  <small>Illustrative example. This revision page does not execute or judge code.</small>
  <h4>Follow the reasoning</h4><ol className="interview-flow">{depth.flow.map(step=><li key={step.title}><strong>{step.title}</strong><p>{step.detail}</p><code>{step.state}</code></li>)}</ol>
  <details><summary>Hinglish help</summary><p>{depth.hinglish}</p></details>
  <h4>Be ready for the follow-up</h4><ul>{depth.followUps.map(q=><li key={q}>{q}</li>)}</ul>
  <h4>Check your answer</h4><ul>{depth.checklist.map(c=><li key={c}>{c}</li>)}</ul>
  <h4>Official references</h4><ul>{depth.sources.map(([title,url])=><li key={url}><a href={url} target="_blank" rel="noreferrer">{title} ↗</a></li>)}</ul>
 </div>;
}
