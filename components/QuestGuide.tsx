import {chapters} from '@/lib/curriculum';

type QuestGuideProps = {
  q: {
    day:number;
    title:string;
    chapter:number;
    mission:string;
    lesson:string;
    pattern?:string;
    steps:{id:string;title:string;detail:string;minutes:number}[];
    questions:{id:string;prompt:string;hint:string;rubric:string}[];
  };
};

const jsExample = `const first = createCounter();
const second = createCounter();

first.increment();
first.increment();
second.increment();

console.log(first.read());  // 2
console.log(second.read()); // 1`;

function exampleFor(q:QuestGuideProps['q']){
  const title = `${q.title} ${q.mission}`.toLowerCase();
  const chapter = chapters[q.chapter-1];
  if(title.includes('counter')) return {
    input:'Call createCounter() twice, increment each instance in a different order, then read both values.',
    output:'The first counter keeps its own value and the second counter keeps a separate value.',
    code:jsExample,
    constraint:'Do not use a global variable. Each factory call must own its private state through closure.'
  };
  if(q.chapter===1) return {
    input:'Run the function with a normal case, a wrong type, an empty value, and a boundary value.',
    output:'Return the correct value for valid input and reject or explain invalid input without silent bugs.',
    code:`const result = solution(sampleInput);
console.log(result);
// also test: empty input, invalid type, repeated call`,
    constraint:'State the JavaScript concept first, then prove it with a small runnable example.'
  };
  if(q.chapter===2) return {
    input:'Create one user action such as click, type, submit, or route change.',
    output:'The UI shows loading, success, empty, and error states without losing user input.',
    code:`render(<Component />);
user.click(screen.getByRole('button'));
expect(screen.getByText('expected state')).toBeVisible();`,
    constraint:'Track state changes clearly. Explain what triggers a render and what data crosses component boundaries.'
  };
  if(q.chapter===3 || q.chapter===6 || q.chapter===7) return {
    input:'Send one valid request and one invalid request to the endpoint or function.',
    output:'Valid input returns a stable JSON shape. Invalid input returns a useful status/message.',
    code:`POST /api/example
Body: { "name": "Saurabh", "status": "active" }

200/201 Response:
{ "ok": true, "data": { "id": "sample-id" } }`,
    constraint:'Define request, validation, domain logic, error path, and response before coding.'
  };
  if(q.chapter===4 || q.chapter===5 || q.chapter===8) return {
    input:'Use 3-5 sample records, including one edge case such as missing notes, duplicate value, or stale version.',
    output:'The query/update returns only the allowed rows and preserves the invariant under edge cases.',
    code:`Input rows:
users(id) = [1, 2]
items(owner_id, status) = [(1,'open'), (1,'closed'), (2,'open')]

Expected:
only current user's rows are returned`,
    constraint:'Mention keys, constraints, indexes, transaction or authorization rule that protects the data.'
  };
  if(q.chapter===9 || q.chapter===10) return {
    input:'Start from a code change, environment variable, container, or deployment event.',
    output:'A repeatable build/deploy path with logs, health check, and rollback note.',
    code:`commit -> install -> test -> build -> deploy -> health check
If health fails: keep previous version and inspect logs`,
    constraint:'Separate public config from secrets. Explain how you would observe and recover from failure.'
  };
  if(q.chapter===11) return {
    input:'Given users, traffic, read/write ratio, data size, and latency target.',
    output:'A diagram plus API, data model, scaling strategy, failure handling, and tradeoffs.',
    code:`Client -> CDN -> API Gateway -> Service -> Cache -> Database
Events -> Queue -> Worker -> Notification`,
    constraint:'Clarify requirements first. Then estimate, design data flow, discuss bottlenecks, and defend tradeoffs.'
  };
  if(q.chapter===12 || q.chapter===13) return {
    input:'Take one interview prompt, answer aloud, then write the short version.',
    output:'A clear answer with situation, decision, tradeoff, proof, and next improvement.',
    code:`Clarify -> approach -> implementation -> test -> tradeoff -> final answer`,
    constraint:'Speak in simple English. Avoid jumping to code before explaining the reasoning.'
  };
  return {
    input:`Use the mission context: ${q.mission}`,
    output:'A working artifact, one verified edge case, and a short explanation you can say in an interview.',
    code:`1. Restate the task
2. Build the smallest version
3. Test normal + edge case
4. Explain complexity or tradeoff`,
    constraint:'Keep proof small and specific. Save the answer before looking at the rubric.'
  };
}

export function QuestGuide({q}:QuestGuideProps){
  const example = exampleFor(q);
  const chapter = chapters[q.chapter-1];
  const buildSteps = q.steps.slice(0,5);
  return <section className="card quest-guide-card">
    <div className="section-heading">
      <div>
        <span className="eyebrow">DAY {String(q.day).padStart(2,'0')} IMPLEMENTATION GUIDE</span>
        <h2>Example, hints, and proof checklist</h2>
      </div>
      <span className="subtle-pill">{chapter.tag}</span>
    </div>
    <p className="muted guide-lede">Use this like a LeetCode-style brief for the daily mission. Try first, then open the hints and rubric.</p>
    <div className="quest-example-grid">
      <article className="guide-panel">
        <span className="eyebrow">INPUT / ACTION</span>
        <p>{example.input}</p>
      </article>
      <article className="guide-panel">
        <span className="eyebrow">EXPECTED OUTPUT</span>
        <p>{example.output}</p>
      </article>
      <article className="guide-panel wide">
        <span className="eyebrow">SAMPLE / FLOW</span>
        <pre>{example.code}</pre>
      </article>
      <article className="guide-panel">
        <span className="eyebrow">CONSTRAINT</span>
        <p>{example.constraint}</p>
      </article>
    </div>
    <details className="guide-details" open>
      <summary>How to implement this today</summary>
      <ol className="guide-flow-list">
        {buildSteps.map((step,index)=><li key={step.id}><strong>{index+1}. {step.title}</strong><span>{step.detail}</span></li>)}
      </ol>
      <p className="guide-note"><strong>Core theory:</strong> {q.lesson}</p>
    </details>
    <details className="guide-details">
      <summary>Hints before checking the answer</summary>
      <ul className="guide-bullets">
        {q.questions.map(item=><li key={item.id}>{item.hint}</li>)}
      </ul>
    </details>
    <details className="guide-details">
      <summary>What your final answer should prove</summary>
      <ul className="guide-bullets">
        <li>Normal case works with a clear sample input and output.</li>
        <li>One edge case is tested or explained.</li>
        <li>You can explain the main concept in simple English.</li>
        <li>You mention complexity, data flow, or tradeoff when the topic needs it.</li>
        {q.questions.slice(0,2).map(item=><li key={`rubric-${item.id}`}>{item.rubric}</li>)}
      </ul>
    </details>
  </section>;
}
