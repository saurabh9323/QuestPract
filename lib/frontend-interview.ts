import type {InterviewQuestion} from './interview-materials';
import type {InterviewDepth} from './interview-depth';
export type FrontendQuestion=InterviewQuestion&{depth:InterviewDepth};
export const frontendPackSlug='frontend-3plus';
export const frontendPackReviewed='2026-11-03';
const react='https://react.dev/';
const mdn='https://developer.mozilla.org/en-US/docs/';
export const frontendInterviewQuestions:FrontendQuestion[]=[
  {
    id:'frontend3-rerenders',group:'React & JavaScript',
    question:'How would you identify and reduce unnecessary re-renders in a complex React application?',
    answer:'I reproduce a slow interaction and profile the affected tree before changing code. I check where state lives, which props or context values changed, and whether expensive work actually repeated. I move transient state closer to its consumers and remove redundant effect-driven updates. Then I apply targeted memoization or split context only where measurements justify it, and repeat the same interaction to compare.',
    example:'Typing into a header search field should not need to recalculate an unrelated revenue chart. Keep the input state local, pass only the chart inputs it needs, and profile before and after. A parent render does not necessarily produce a DOM mutation.',
    mistake:'Do not add memo/useMemo/useCallback everywhere. Own state and consumed context can still update a memoized component. Ask whether React Compiler is enabled before assuming manual memoization is needed.',
    depth:{opener:'“I would first measure the slow interaction, then identify the state or prop change causing repeated work.”',codeLabel:'Illustrative JSX — profiling a specific subtree',code:`import { Profiler } from 'react';
function RevenuePanel({ rows }) {
  return <Profiler id="revenue" onRender={(id, phase, ms) => {
    console.log({ id, phase, renderMs: ms });
  }}><RevenueChart rows={rows} /></Profiler>;
}
// RevenueChart is your component. Compare the same interaction.
// Profiler instrumentation needs a profiling-enabled production build.`,
      flow:[{title:'Reproduce',detail:'Type into search while the revenue panel is visible.',state:'Interaction: one keystroke'},{title:'Measure',detail:'Inspect committed render duration and the affected components.',state:'Evidence before optimization'},{title:'Narrow the update',detail:'Move search state down or pass stable, minimal chart inputs.',state:'Only relevant data reaches the chart'},{title:'Compare again',detail:'Repeat the same test and check behavior and timing.',state:'Evidence after optimization'}],followUps:['Why can a memoized child still render?','How would you distinguish React render cost from browser layout cost?'],checklist:['Name the interaction you measured.','Explain the changed state/prop/context.','Show a before/after measurement without inventing numbers.'],hinglish:'Pehle slow interaction measure karo. Har component par memo lagane se pehle dekho kaunsa state ya prop badal raha hai.',sources:[['React Profiler',react+'reference/react/Profiler'],['React memo and Compiler',react+'reference/react/memo']]},
  },
  {
    id:'frontend3-forms',group:'React & JavaScript',
    question:'When would you choose controlled inputs over uncontrolled inputs, and what are the trade-offs?',
    answer:'A controlled input receives its current value from React state and synchronously updates that state on change. I use it for live validation, dependent fields or previews. An uncontrolled input keeps its current value in the DOM; I can read it with FormData at submission. It fits simple forms with less per-keystroke state coordination. Both approaches need labels, validation and a clear reset strategy.',
    example:'A price calculator needs live quantity updates, so controlled state is useful. A newsletter form may only need the email on submit, so an uncontrolled field with a default value is sufficient.',
    mistake:'Do not switch the same input between controlled and uncontrolled during its lifetime. Initialize a controlled text value to an empty string, not undefined. Large controlled forms need careful state placement, not an automatic rejection of controlled inputs.',
    depth:{opener:'“I choose based on when the application needs the value: on every edit, or mainly on submission.”',codeLabel:'JSX examples — use inside a React component',code:`const [email, setEmail] = useState(''); // import useState
const live = <input aria-label="Email" value={email}
  onChange={e => setEmail(e.target.value)} />;

const onSubmit = e => {
  e.preventDefault();
  const email = new FormData(e.currentTarget).get('email');
  console.log(email); // Validate and submit through your application.
};
const simple = <form onSubmit={onSubmit}>
  <input aria-label="Email" name="email" defaultValue="" />
  <button>Subscribe</button>
</form>;`,flow:[{title:'User types',detail:'The browser receives an input event.',state:'New text: a@example.com'},{title:'Controlled path',detail:'onChange updates state, then React supplies the current value.',state:'DOM → event → state → value prop'},{title:'Uncontrolled path',detail:'The DOM keeps the edited value until the form is read.',state:'DOM → FormData on submit'},{title:'Validate',detail:'Client checks improve feedback; server checks enforce the contract.',state:'Submit only an intentional payload'}],followUps:['How do you reset each kind of form?','How would you keep one expensive preview from slowing typing?'],checklist:['Identify where the value lives.','Give one appropriate use case for each.','Describe validation and reset behavior.'],hinglish:'Live preview chahiye to state se value control karo. Sirf submit par value chahiye to FormData useful hai. Server validation dono mein chahiye.',sources:[['React input reference',react+'reference/react-dom/components/input']]},
  },
  {
    id:'frontend3-event-loop',group:'React & JavaScript',
    question:'How does the browser event loop interact with Promises, async/await and rendering?',
    answer:'Synchronous JavaScript runs until the current stack is empty. At a microtask checkpoint, pending promise reactions and other microtasks are drained, including new microtasks queued by them. An async continuation after await uses promise scheduling; await does not create a thread. Timers become eligible tasks after a delay. The browser also needs rendering opportunities, which long tasks or a continuously growing microtask queue can delay.',
    example:'A resolved promise callback runs before a zero-delay timer scheduled by the same ordinary script. Repeating await Promise.resolve() in a heavy loop is not a reliable way to yield for painting.',
    mistake:'Do not promise a paint between every two tasks, or an exact execution time for setTimeout(0). Browser scheduling and background-tab throttling affect timing.',
    depth:{opener:'“I separate synchronous work, microtask checkpoints, eligible tasks and the browser’s rendering opportunities.”',codeLabel:'JavaScript example — console order A, B, promise, timer',code:`console.log('A');
setTimeout(() => console.log('timer'), 0);
Promise.resolve().then(() => console.log('promise'));
console.log('B');
// Painting is not represented by this console log.
// async CPU-heavy work still blocks unless it yields or uses a worker.`,flow:[{title:'Run script',detail:'Log A, schedule a timer and a promise callback, then log B.',state:'Console: A, B'},{title:'Drain microtasks',detail:'The settled promise reaction runs at the checkpoint.',state:'Console: A, B, promise'},{title:'Rendering opportunity',detail:'The browser may perform rendering when appropriate; this is not a guaranteed paint here.',state:'Timing is browser-controlled'},{title:'Eligible timer task',detail:'The timer callback eventually runs when the main thread can take it.',state:'Console: A, B, promise, timer'}],followUps:['Why does await Promise.resolve() not necessarily make a CPU loop responsive?','When would you use a Web Worker instead of a timer?'],checklist:['Separate a promise from its callback.','Explain that await does not create a thread.','Avoid claiming a guaranteed paint order.'],hinglish:'Promise callback microtask hai. await se naya thread nahi banta. Heavy calculation ko async bolne se UI free nahi hoti.',sources:[['MDN microtasks and the runtime',mdn+'Web/API/HTML_DOM_API/Microtask_guide/In_depth']]},
  },
  {
    id:'frontend3-reconciliation',group:'React & JavaScript',
    question:'What happens when React updates the DOM? Explain reconciliation and Fiber.',
    answer:'An update triggers render work to compute the next UI description. Reconciliation uses component types, positions and keys to match identities and determine changes. Fiber is React’s internal representation of units of work and their relationships, supporting scheduling of render work. Rendering can be restarted or abandoned; keep it pure. A commit applies the chosen changes to the host environment, and the browser handles layout and paint afterward.',
    example:'Moving an item with a stable key can preserve its input state. Changing its key intentionally gives it a different identity and resets that subtree’s state. Calling the component function is not evidence that every DOM element changed.',
    mistake:'Fiber is an implementation detail, not a public application API or a separate thread per component. Not every render is interrupted, and a render is not a browser paint.',
    depth:{opener:'“I distinguish render and reconciliation from the commit that changes the DOM.”',codeLabel:'JSX identity example — stable IDs, deliberate reset',code:`// Inside a parent component; rows have stable unique IDs.
const list = rows.map(row => <EditableRow key={row.id} row={row} />);
// Changing documentId deliberately resets this editor subtree.
const editor = <Editor key={documentId} documentId={documentId} />;
// EditableRow and Editor are application components.`,flow:[{title:'Queue update',detail:'A state update requests work on the UI tree.',state:'Previous tree + pending update'},{title:'Render and reconcile',detail:'Compute output and match sibling identities using types and keys.',state:'Candidate tree; DOM not necessarily changed'},{title:'Commit',detail:'Apply the selected host changes. Rendering work that was abandoned is not committed.',state:'Current DOM reflects the committed tree'},{title:'Browser renders',detail:'Style, layout and paint happen as needed.',state:'Pixels follow browser rendering work'}],followUps:['What goes wrong with array-index keys when editable rows reorder?','Why should network requests or mutations not run during rendering?'],checklist:['Separate render, commit and paint.','Explain identity with a keyed-list example.','Identify Fiber internals as version-dependent.'],hinglish:'React pehle next UI calculate karta hai, phir selected changes commit hote hain. Key se identity samajhta hai; render aur paint same cheez nahi.',sources:[['React render and commit',react+'learn/render-and-commit'],['Preserving and resetting state',react+'learn/preserving-and-resetting-state'],['React Fiber source (implementation detail)','https://github.com/facebook/react/blob/main/packages/react-reconciler/src/ReactFiber.js']]},
  },
  {
    id:'frontend3-api-hook',group:'React & JavaScript',
    question:'How would you build a reusable API hook with loading, errors, cancellation and retry?',
    answer:'I define a clear state contract and keep request ownership explicit. A new request cancels the previous one and prevents late results from replacing current data. I check HTTP status because fetch does not reject for every HTTP error. Cleanup cancels work and suppresses obsolete updates. I provide an explicit retry for reads; automatic retries need a limit, eligible error categories and backoff. A server-state library is often preferable once caching and deduplication are needed.',
    example:'A user opens profile A and quickly switches to B. A’s slower reply must not overwrite B. The sample is a GET-only teaching hook with manual retry, cancellation and no cache.',
    mistake:'Aborting fetch does not undo a server-side mutation. Do not automatically retry a purchase without an idempotency design, or describe this small hook as a full server-state library.',
    depth:{opener:'“I would define the loading/error/data contract, then handle request races before adding retry behavior.”',codeLabel:'JavaScript/React teaching hook — GET, manual retry, no cache',code:`import { useCallback, useEffect, useRef, useState } from 'react';
export function useJson(url) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ url, status: 'idle', data: null, error: '' });
  const current = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    current.current = controller;
    let active = true;
    setState({ url, status: 'loading', data: null, error: '' });
    (async () => {
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const data = await response.json();
        if (active && !controller.signal.aborted)
          setState({ url, status: 'success', data, error: '' });
      } catch (error) {
        if (active && !controller.signal.aborted)
          setState({ url, status: 'error', data: null, error: String(error) });
      }
    })();
    return () => { active = false; controller.abort(); };
  }, [url, attempt]);
  const retry = useCallback(() => {
    current.current?.abort();
    setAttempt(n => n + 1);
  }, []);
  const cancel = useCallback(() => {
    current.current?.abort();
    setState({ url, status: 'cancelled', data: null, error: '' });
  }, [url]);
  const visible = state.url === url ? state
    : { url, status: 'loading', data: null, error: '' };
  return { ...visible, retry, cancel };
}`,flow:[{title:'Start request B',detail:'The URL changes; cleanup cancels the previous request A.',state:'active(A)=false; signal(A)=aborted'},{title:'Read response',detail:'Check HTTP status before parsing JSON.',state:'B: loading → success or error'},{title:'Reject stale update',detail:'A late callback must pass both ownership and cancellation checks.',state:'A cannot overwrite B'},{title:'Retry intentionally',detail:'Manual retry starts a new GET request. Cleanup still applies.',state:'attempt increments; one current controller'}],followUps:['Which requirements would make you choose RTK Query or another server-state library?','How would your retry policy differ for GET and POST /payments?'],checklist:['Describe stale-result prevention.','Separate HTTP errors from network errors.','State cancellation and retry limits.'],hinglish:'Purani request ka late result nayi screen ko overwrite nahi karna chahiye. Cleanup, signal aur request ownership important hain.',sources:[['React effect lifecycle',react+'reference/react/useEffect'],['MDN AbortController',mdn+'Web/API/AbortController']]},
  },
  {
    id:'frontend3-code-splitting',group:'Performance & architecture',
    question:'How would you implement route-based code splitting without making navigation feel worse?',
    answer:'I split substantial route or feature boundaries and keep the shared shell usable while the next chunk loads. I use a stable loading layout, handle chunk failures, and consider prefetching likely destinations when bandwidth permits. I inspect request waterfalls so code and data loading do not become unnecessary serial waits. Framework routing may already split routes; I check its behavior before adding manual boundaries.',
    example:'An analytics route contains a large charting library. Load it when the user enters analytics rather than including it in the initial login bundle. Reserve chart space so the page does not jump while loading.',
    mistake:'Do not declare lazy components inside a rendering component, show a full-page spinner for every small change, or assume every effect-based fetch suspends automatically.',
    depth:{opener:'“I would split at a meaningful route boundary and design the loading and failure experience at the same time.”',codeLabel:'JSX route content example — router and Error Boundary omitted',code:`import { lazy, Suspense } from 'react';
const Analytics = lazy(() => import('./Analytics.jsx'));
export function AnalyticsRoute() {
  return <Suspense fallback={<div role="status" style={{ minHeight: 320 }}>
    Loading analytics…
  </div>}><Analytics /></Suspense>;
}
// Analytics.jsx must export a default component.
// Put an Error Boundary above this route for rejected chunk loads.`,flow:[{title:'Enter route',detail:'Keep shared navigation mounted and start the route load.',state:'Shell remains usable'},{title:'Fetch chunk',detail:'The route’s module is requested when needed or intentionally prefetched.',state:'JavaScript chunk pending'},{title:'Show fallback',detail:'Reserve content space and communicate loading accessibly.',state:'Stable loading layout'},{title:'Resolve or recover',detail:'Render the loaded feature, or use an Error Boundary for load failure.',state:'Feature ready / retry path'}],followUps:['How would you handle a stale tab requesting a chunk removed by a deployment?','When can prefetching waste bandwidth?'],checklist:['Name the boundary and the cost it removes.','Cover loading, layout stability and errors.','Check code/data waterfalls.'],hinglish:'Heavy route ka code tab load karo jab zarurat ho. Loading state aur failure recovery bhi design ka part hain.',sources:[['React lazy',react+'reference/react/lazy']]},
  },
  {
    id:'frontend3-shared-state',group:'Performance & architecture',
    question:'How would you manage shared state? Compare Redux Toolkit, Context and server-state libraries.',
    answer:'I first classify the state: local interaction state, URL state, cross-feature client state, or remote cached data. Context distributes values to a subtree and works well for stable concerns such as a theme; changing its value updates consumers. Redux Toolkit gives explicit events, reducers and store tooling for complex shared client workflows. RTK Query or another server-state library manages request caching, subscriptions, invalidation and refetching. These are complementary choices.',
    example:'Keep an open menu local, filters in the URL, a complex multi-step editor in a reducer/store, and fetched product records in a query cache. Avoid copying the same product list into several independent stores.',
    mistake:'Context is not automatically a selective subscription store or a server cache. Redux Toolkit and RTK Query are not mutually exclusive; RTK Query is part of Redux Toolkit.',
    depth:{opener:'“I would classify ownership and lifetime first, rather than choose one global store for every value.”',codeLabel:'State-ownership plan — declarative teaching data',code:`const ownership = {
  menuOpen: 'local component state',
  searchFilters: 'URL',
  theme: 'Context',
  editorWorkflow: 'reducer or Redux Toolkit',
  products: 'query cache with invalidation'
};
// Choose based on actual sharing, update frequency and lifetime.`,flow:[{title:'Identify owner',detail:'Ask which components read and change the value.',state:'Local / URL / shared / remote'},{title:'Choose lifecycle',detail:'Decide whether navigation, refresh or cache expiry should reset it.',state:'Explicit source of truth'},{title:'Subscribe narrowly',detail:'Consumers receive only the data relevant to their feature.',state:'Avoid broad unrelated updates'},{title:'Update consistently',detail:'Client events update client state; server mutations invalidate or update cached results.',state:'One authority for each kind of data'}],followUps:['What happens when a Context provider creates a fresh object on every render?','How do you avoid showing stale data after a mutation?'],checklist:['Separate client state from remote cached state.','Explain sharing and update frequency.','Avoid duplicate sources of truth.'],hinglish:'Har cheez global store mein mat rakho. UI state, URL state aur server data ka owner aur lifetime alag ho sakta hai.',sources:[['React useContext',react+'reference/react/useContext'],['Redux: RTK Query basics','https://redux.js.org/tutorials/essentials/part-7-rtk-query-basics']]},
  },
  {
    id:'frontend3-slow-interactivity',group:'Performance & architecture',
    question:'A React page takes five seconds to become usable. How would you investigate and improve it?',
    answer:'I clarify what “usable” means and reproduce it on a representative device and connection. I capture a navigation and interaction trace, then separate network waits, JavaScript parse/execute work, long tasks, rendering and data waterfalls. I fix the largest observed bottleneck, retest the same scenario and monitor real users. Loading metrics and interaction responsiveness answer different questions; INP is not simply the time from navigation until startup finishes.',
    example:'If a search field is visible but input waits behind a large synchronous transformation, a faster API alone will not fix the delay. Reduce the work, split it or move suitable CPU work to a worker, then check input responsiveness again.',
    mistake:'Do not claim a universal fix such as adding useMemo, a CDN or SSR. A faster screenshot can still hide a blocked main thread. Never invent before/after timings for an interview story.',
    depth:{opener:'“I would define the slow user action, capture a trace and fix the measured bottleneck.”',codeLabel:'Browser timing example — application-specific hydration signal required',code:`performance.mark('route-start');
// In your application, call this when the intended route is usable.
function markRouteUsable() {
  performance.mark('route-usable');
  performance.measure('route-usability', 'route-start', 'route-usable');
}
// A custom startup measure is not INP. Validate the signal you chose.`,flow:[{title:'Define experience',detail:'Specify which interaction is delayed and on which device.',state:'Example: search input responds late'},{title:'Capture evidence',detail:'Inspect network and main-thread activity during that interaction.',state:'Waterfall + performance trace'},{title:'Target cause',detail:'Choose a fix tied to the largest observed delay.',state:'Less blocking work or fewer serial waits'},{title:'Verify outcome',detail:'Repeat under matching conditions and monitor field data.',state:'Measured change; regression budget'}],followUps:['How would you tell a network bottleneck from a long JavaScript task?','Why can LCP improve while interaction responsiveness remains poor?'],checklist:['Define a user-visible success condition.','Use both loading and interaction evidence.','Retest on a representative low-powered device.'],hinglish:'Five seconds kis cheez mein lag rahe hain—data, JS ya rendering? Pehle trace dekho, phir usi bottleneck ko fix karo.',sources:[['Chrome DevTools performance','https://developer.chrome.com/docs/devtools/performance'],['Interaction to Next Paint','https://web.dev/articles/inp']]},
  },
  {
    id:'frontend3-virtualization',group:'Performance & architecture',
    question:'How would you render an interactive table containing more than 50,000 records?',
    answer:'I avoid mounting one DOM row per record. Virtualization renders the visible window plus a small overscan buffer, with spacers preserving the scrollable size. I use stable row IDs and plan for row-height measurement, keyboard navigation, focus and screen-reader behavior. Filtering and sorting the whole dataset may still be expensive; server pagination, indexed queries or workers address different costs. Virtualization alone does not reduce the network payload.',
    example:'With 36-pixel rows and a 360-pixel viewport, only about ten rows are visible. At scrollTop 360 with three overscan rows on each side, the fixed-height example renders indexes 7 through 22 instead of all 50,000.',
    mistake:'Do not confuse DOM virtualization with server pagination. Variable row heights invalidate simple fixed-height math. Browser find-in-page and assistive navigation need an intentional fallback or accessible table design.',
    depth:{opener:'“I would bound the mounted DOM rows, then address data-fetching and filtering costs separately.”',codeLabel:'JavaScript fixed-height window calculation — not a full table component',code:`const count = 50000, rowHeight = 36, viewport = 360;
const scrollTop = 360, overscan = 3;
const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
const end = Math.min(count,
  Math.ceil((scrollTop + viewport) / rowHeight) + overscan);
console.log(start, end); // 7, 23; end is exclusive
const topSpacer = start * rowHeight;
const bottomSpacer = (count - end) * rowHeight;
// Render records.slice(start, end) with stable row IDs.
// Production tables also need measurement, focus and accessibility.`,flow:[{title:'Locate viewport',detail:'Translate scroll offset and viewport height to visible row positions.',state:'Visible indexes 10–19'},{title:'Add overscan',detail:'Keep a small nearby buffer to reduce blank edges during scrolling.',state:'Render indexes 7–22'},{title:'Preserve geometry',detail:'Top and bottom spacers represent rows not mounted in the DOM.',state:'16 rendered rows; total height preserved'},{title:'Handle interaction',detail:'Keep selection by row ID and restore focus as rows leave or enter the window.',state:'Identity is independent of mounted position'}],followUps:['How would you handle rows whose height changes after images load?','Why can sorting still be slow after adding virtualization?'],checklist:['Distinguish DOM, computation and network costs.','Explain window and overscan.','Address stable identity and keyboard access.'],hinglish:'50,000 records ka matlab 50,000 DOM rows zaruri nahi. Visible rows render karo; data fetch aur sorting ka cost alag handle karo.',sources:[['TanStack Virtual introduction','https://tanstack.com/virtual/latest/docs/introduction']]},
  },
  {
    id:'frontend3-memory-leaks',group:'Performance & architecture',
    question:'What causes memory leaks in React applications, and how would you debug them?',
    answer:'I look for objects that stay reachable after they should be released: global listeners, timers, subscriptions, detached DOM references and unbounded caches. I repeatedly mount, use and leave the same feature, then compare heap snapshots and retaining paths. I distinguish expected caching or temporary allocation from steadily retained objects. Cleanup should release external resources when dependencies change or the component unmounts, and the same navigation test should confirm the fix.',
    example:'A route adds a window resize listener on each mount but never removes it. Those listeners can retain closures from old mounts. Repeated navigation increases retained callbacks even though the visible page looks normal.',
    mistake:'A late promise response is not automatically proof of a memory leak. Garbage collection cannot reclaim objects still referenced by a listener or cache. An effect cleanup must mirror the resource setup.',
    depth:{opener:'“I would reproduce repeated navigation and inspect what retains the old objects, rather than assume any memory growth is a leak.”',codeLabel:'React cleanup example — one listener per active effect',code:`import { useEffect, useState } from 'react';
export function useWindowWidth() {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return width;
}`,flow:[{title:'Repeat lifecycle',detail:'Open and close the feature several times with the same actions.',state:'Comparable navigation cycles'},{title:'Inspect retention',detail:'Compare snapshots and look for growing detached objects or listener closures.',state:'Find the retaining path'},{title:'Release resource',detail:'Remove the exact listener, clear the timer or unsubscribe during cleanup.',state:'External reference removed'},{title:'Repeat measurement',detail:'Check whether unwanted retained objects stop accumulating.',state:'No claim based on one heap reading'}],followUps:['How do you distinguish a bounded cache from a leak?','Why must removeEventListener use the correct handler reference?'],checklist:['Name the resource retaining the object.','Use repeated, comparable measurements.','Show cleanup and a verification plan.'],hinglish:'Memory badh rahi hai to pehle retaining reference dekho. Old listener ya timer remove nahi hua to uska closure memory hold kar sakta hai.',sources:[['Chrome DevTools memory diagnosis','https://developer.chrome.com/docs/devtools/memory-problems']]},
  },
  {
    id:'frontend3-browser-rendering',group:'Browser & security',
    question:'Explain the browser rendering pipeline: DOM, CSSOM, layout, paint and compositing.',
    answer:'The browser parses HTML into the DOM and CSS into style information represented through the CSSOM. It computes styles, determines geometry during layout, records/draws visual content during paint, and composites layers as needed. Changes can invalidate different stages; not every update repeats the entire pipeline. JavaScript can trigger expensive synchronous layout if it reads geometry after invalidating styles. I use a performance trace to identify the actual stage causing work.',
    example:'A loop that changes one card’s width and immediately reads the next card’s geometry can repeatedly force layout. Grouping geometry reads before the writes avoids that repeated read/write alternation.',
    mistake:'Do not say every transform runs on the GPU or every DOM change repaints the whole page. Layer promotion is browser-dependent and layers consume memory.',
    depth:{opener:'“I would separate structure, style, geometry, pixels and composition, then explain which stage my change invalidates.”',codeLabel:'Browser JavaScript — batch geometry reads before writes',code:`const cards = [...document.querySelectorAll('.product-card')];
// Complete reads before invalidating widths.
const widths = cards.map(card => card.getBoundingClientRect().width);
cards.forEach((card, i) => { card.style.width = (widths[i] + 12) + 'px'; });
// This is an illustrative batching change, not a benchmark result.`,flow:[{title:'DOM and styles',detail:'Parse document structure and style rules, then compute element styles.',state:'Structure + computed styles'},{title:'Layout',detail:'Resolve element sizes and positions when geometry is invalidated.',state:'Boxes with coordinates'},{title:'Paint',detail:'Produce drawing work for visible content that needs repainting.',state:'Text, borders, backgrounds and images'},{title:'Composite',detail:'Combine relevant surfaces/layers for display.',state:'A displayed frame; stages may be skipped when reusable'}],followUps:['Why can getBoundingClientRect cause synchronous layout?','Why might animating width cost more than an appropriate transform?'],checklist:['Explain each stage using one UI change.','Describe layout thrashing.','Avoid guaranteed GPU/compositing claims.'],hinglish:'DOM structure hai, style appearance rules hain, layout size-position nikalta hai, paint pixels banata hai. Har change sab stages repeat nahi karta.',sources:[['MDN: how browsers work',mdn+'Web/Performance/Guides/How_browsers_work']]},
  },
  {
    id:'frontend3-security',group:'Browser & security',
    question:'How would you protect a frontend against XSS, CSRF and insecure token storage?',
    answer:'I treat untrusted content as data and use safe rendering/encoding; intentionally supported rich HTML needs an appropriate maintained sanitizer. For cookie-authenticated mutations, I use a server-validated CSRF strategy and suitable cookie attributes. HttpOnly reduces script access to a session cookie but does not stop an injected script from issuing actions in the user’s session. Long-lived browser-readable secrets increase the impact of XSS. Authorization remains a server responsibility.',
    example:'Render a customer name as React text. If the product needs user-authored rich text, sanitize that content before an HTML sink. A cookie-based transfer endpoint should validate its CSRF defense and authorization, not merely trust that the request came from a hidden button.',
    mistake:'React escaping is not protection for every unsafe HTML or URL sink. HttpOnly and SameSite are useful controls, not complete XSS/CSRF solutions. CORS is not authorization.',
    depth:{opener:'“I would handle XSS and CSRF as distinct threats, then choose storage and server checks around the authentication model.”',codeLabel:'Illustrative JSX and server-policy notes — not a complete security implementation',code:`const profile = { displayName: '<img src=x onerror=alert(1)>' };
const name = <span>{profile.displayName}</span>; // Text, not executable HTML
const serverCookiePolicy = {
  httpOnly: true, secure: true, sameSite: 'lax'
};
// Cookie attributes must be applied by the server.
// Cookie-authenticated mutations still require a CSRF strategy.
// Never ship a private provider/service key in client code.`,flow:[{title:'Identify trust boundary',detail:'Treat user content and client-supplied identity claims as untrusted.',state:'Validate input; authorize on server'},{title:'Render safely',detail:'Use text sinks; sanitize intentionally supported rich HTML.',state:'Content remains data'},{title:'Protect session actions',detail:'Apply server-validated CSRF protection to cookie-authenticated mutations.',state:'Request intent checked separately from login'},{title:'Limit exposure',detail:'Choose appropriate cookie/storage controls and avoid secret logging or client bundling.',state:'Defense in depth; no single magic control'}],followUps:['Can an XSS payload still act as the user when a session cookie is HttpOnly?','Why is a frontend route guard insufficient authorization?'],checklist:['Distinguish XSS from CSRF.','Discuss cookie and token-storage trade-offs.','Keep authorization and CSRF verification server-side.'],hinglish:'XSS mein injected script chalti hai; CSRF mein unwanted authenticated request karwayi ja sakti hai. Dono ki defense alag hai, aur server checks zaruri hain.',sources:[['OWASP XSS prevention','https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html'],['OWASP CSRF prevention','https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html'],['OWASP HTML5 storage guidance','https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html']]},
  },
  {
    id:'frontend3-api-failures',group:'Browser & security',
    question:'Several API requests fail at once. How would you centralize errors and retries?',
    answer:'I normalize transport and HTTP failures into an application error model, but let each feature decide whether partial content is useful. A shared client can coordinate one authentication refresh, cancellation and safe diagnostic IDs. I classify retryable reads separately from validation, authorization and mutation failures. Retries need an attempt/deadline budget, jitter and server guidance such as Retry-After. The UI should avoid a storm of duplicate notifications.',
    example:'An orders dashboard fetches orders, recommendations and a profile independently. Orders remain visible if recommendations fail. If ten requests share an expired session, coordinate one refresh and retry eligible requests only once after it succeeds; a failed refresh should end the loop.',
    mistake:'Promise.all rejects on one rejection but does not cancel other requests. Do not retry all 4xx errors or non-idempotent writes blindly. A bounded retry still needs cancellation and a total time budget.',
    depth:{opener:'“I would centralize classification and coordination, while preserving feature-specific recovery and partial results.”',codeLabel:'JavaScript example — partial results plus a retry classification helper',code:`async function readJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('HTTP ' + response.status);
  return response.json();
}
const results = await Promise.allSettled([
  readJson('/api/orders'), readJson('/api/recommendations')
]);
function mayRetryRead(status, attempts) {
  return attempts < 3 && [408, 429, 502, 503, 504].includes(status);
}
// This helper does not schedule retries. Add cancellation, jitter,
// Retry-After handling and an overall deadline in the request client.`,flow:[{title:'Classify failure',detail:'Separate offline, timeout, authentication, validation and server failures.',state:'Structured error; redact sensitive data'},{title:'Coordinate',detail:'Deduplicate equivalent requests and share a single authentication refresh where applicable.',state:'No refresh or notification storm'},{title:'Recover with limits',detail:'Retry only eligible operations within a bounded policy.',state:'Delay + jitter + Retry-After + cancellation'},{title:'Present useful UI',detail:'Keep successful sections and offer an action for the failed feature.',state:'Partial success remains usable'}],followUps:['How would you prevent ten failed requests from causing ten token refresh calls?','What changes for a payment request whose response was lost?'],checklist:['Classify failures before retrying.','Preserve partial success deliberately.','State retry bounds and mutation idempotency.'],hinglish:'Sab request fail ho to sabko blindly retry mat karo. Error type samjho, refresh ko coordinate karo aur successful data visible rakho.',sources:[['MDN Retry-After',mdn+'Web/HTTP/Reference/Headers/Retry-After'],['Redux: shared server-state requests','https://redux.js.org/tutorials/essentials/part-7-rtk-query-basics']]},
  },
  {
    id:'frontend3-rendering-strategies',group:'Advanced frontend concepts',
    question:'Compare SSR, CSR and hydration. When would you choose each rendering strategy?',
    answer:'CSR builds the UI in the browser from JavaScript. SSR produces initial HTML on the server; hydration lets React attach to matching server-rendered HTML and make it interactive. I choose based on discoverability, first-view content, personalization, caching and server cost. A public product page may benefit from server rendering, while a private tool can tolerate a client-driven shell. Many applications mix approaches by route and feature.',
    example:'Server-render a public product description, then hydrate the interactive quantity selector. The first client render must agree with the HTML; reading the browser clock or a random value during initial render can cause a mismatch.',
    mistake:'SSR does not eliminate browser JavaScript or automatically make interactions fast. Do not hide a genuine mismatch with suppression. React Server Components are a separate concept from SSR.',
    depth:{opener:'“I would choose the initial rendering strategy based on the user-visible content and operational constraints, then explain hydration separately.”',codeLabel:'Hydration entry illustration — normally owned by your framework',code:`import { hydrateRoot } from 'react-dom/client';
import App from './App.jsx';
const data = window.__INITIAL_DATA__; // Safely serialized by the server
hydrateRoot(document.getElementById('root'), <App data={data} />);
// The server must render App with matching initial data.
// Use your framework's escaping/serialization and bootstrap mechanism.`,flow:[{title:'Choose initial content',detail:'Decide whether the server supplies meaningful HTML or a client shell.',state:'SSR HTML / CSR bootstrap'},{title:'Load client code',detail:'Deliver JavaScript needed for interactive features.',state:'Code load and execution still cost time'},{title:'Hydrate or create',detail:'Hydrate matching server markup, or create client-rendered content.',state:'Client takes responsibility for interaction'},{title:'Measure experience',detail:'Check visible content, interactions, caching and server cost.',state:'Strategy follows product constraints'}],followUps:['What are common sources of hydration mismatch?','How do Server Components differ from server-rendered HTML and hydration?'],checklist:['Separate HTML generation from hydration.','Name a use case and trade-off.','Cover matching initial data and measurement.'],hinglish:'SSR initial HTML deta hai; hydration uske saath React interaction attach karta hai. SSR ka matlab browser JavaScript zero nahi hota.',sources:[['React hydrateRoot',react+'reference/react-dom/client/hydrateRoot']]},
  },
  {
    id:'frontend3-environment-secrets',group:'Advanced frontend concepts',
    question:'How would you manage environment-specific configuration without exposing secrets in the browser bundle?',
    answer:'I classify configuration as public or server-only. A browser must be able to inspect anything delivered to it, so secret API credentials belong in server-side configuration and authorized server operations. In Next.js, NEXT_PUBLIC_ values referenced by client code are inlined for the client at build time; changing the deployment environment afterward does not rewrite that bundle. I validate required server configuration, separate environment credentials and check built artifacts and logs for accidental exposure.',
    example:'A public analytics identifier can be client configuration. A Gemini private API key stays in an authorized server function; the client sends the user’s request to that function. Renaming a secret or hiding it in a minified file does not protect it.',
    mistake:'A .env file is not a security boundary once its contents enter a client bundle, API response or log. A static frontend cannot secretly hold a service-role key.',
    depth:{opener:'“I would first decide which values are safe for every browser to see, and keep all private credentials behind server authorization.”',codeLabel:'Next.js configuration sketch — server and client files are separate',code:`// client-config.js: intentionally public, inlined at build time
export const publicOrigin = process.env.NEXT_PUBLIC_SITE_ORIGIN;

// server-config.js: keep out of the client dependency graph
// import 'server-only'; // Next.js server-only boundary marker
export function requireProviderKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Provider key is not configured');
  return key; // Use only inside an authorized server operation.
}
// These excerpts represent TWO files. Never import the server file into UI.`,flow:[{title:'Classify values',detail:'Separate public display/config values from credentials and privileged endpoints.',state:'Public / server-only inventory'},{title:'Build client',detail:'Only intentionally public values may enter downloadable assets.',state:'Browser bundle contains no private key'},{title:'Use server secret',detail:'An authorized server operation reads environment-specific credentials.',state:'Secret stays behind a trusted boundary'},{title:'Validate and rotate',detail:'Check deployment configuration and inspect for accidental exposure.',state:'Separate environments; recover if a key leaks'}],followUps:['Why can promoting the same built artifact retain an old NEXT_PUBLIC_ value?','How would you rotate an accidentally exposed provider key?'],checklist:['Assume client-visible values are public.','Explain build-time versus server runtime configuration.','Keep authorization in the server operation.'],hinglish:'Browser ko jo milega wo public samjho. Private API key server function mein rakho; .env naam se secret secure nahi ho jata.',sources:[['Next.js environment variables','https://nextjs.org/docs/app/guides/environment-variables']]},
  },
];
