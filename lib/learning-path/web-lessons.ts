import type { ReadingLesson } from '../commute-guides';

export const webPathLessons: ReadingLesson[] = [
  {
    id: 'guide-path-javascript',
    title: 'Promise.all: keep request order when results finish out of order',
    category: 'Learning path',
    topic: 'JavaScript',
    format: 'Visual guide',
    minutes: 9,
    explanation: 'Promise.all combines an iterable of promises into one promise. On success, result positions follow input positions, even when work finishes in a different order. A rejection makes the combined promise reject; it does not automatically stop the other operations. Calling a function starts its work according to that function’s behavior; Promise.all coordinates the returned promises.\n\nIn this small checkout simulation, stock becomes ready before the quote. Keep quote in slot 0 and stock in slot 1 so the screen cannot accidentally display a stock message as the price. The explicit finish functions let you control completion without relying on network speed or timer timing.',
    useWhen: 'Several independent results are all required before proceeding: a product quote plus availability, or several files needed for one report. If each result may succeed or fail independently, consider Promise.allSettled and design the partial-result UI explicitly.',
    example: 'A café prepares a sandwich and a drink at separate stations. The tray has a sandwich position and a drink position, regardless of which arrives first. Promise.all is the coordinator that waits for a complete tray. Analogy limit: rejecting the combined promise does not tell either station to stop; cancellation needs a separate supported mechanism.',
    code: `let finishQuote;
let finishStock;
const quote = new Promise(resolve => { finishQuote = resolve; });
const stock = new Promise(resolve => { finishStock = resolve; });
const checkout = Promise.all([quote, stock]);

finishStock('in stock');
finishQuote('499 INR');
checkout.then(parts => console.log(parts.join(' | ')));
console.log('waiting');`,
    output: 'waiting\n499 INR | in stock',
    steps: [
      { title: 'Reserve positions', detail: 'Both promise executors run synchronously and expose their resolve functions. Promise.all subscribes to each input with its original index.', state: 'Before: no work results\nAfter: quote pending → slot 0; stock pending → slot 1\nCombined: pending', line: 5 },
      { title: 'Complete stock first', detail: 'Resolving stock fulfills that input and schedules its reactions. Quote is still pending, so a complete checkout result is unavailable.', state: 'Before: quote pending; stock pending\nAfter: quote pending; stock fulfilled = in stock\nReserved order stays [quote, stock]', line: 7 },
      { title: 'Complete the quote', detail: 'Quote now fulfills too. The current synchronous script still needs to finish before queued promise reactions can run.', state: 'Before: quote pending\nAfter: quote fulfilled = 499 INR\nBoth inputs fulfilled; reactions queued', line: 8 },
      { title: 'Finish synchronous output', detail: 'Attaching then does not run its callback inline. The final synchronous console.log therefore prints first.', state: 'Before: output empty\nAfter: output = waiting', line: 10 },
      { title: 'Deliver an ordered result', detail: 'The promise reactions store each result in its reserved position. The combined promise fulfills and its callback joins those values.', state: 'Before: result delivery pending\nAfter: [499 INR, in stock]\nOutput adds: 499 INR | in stock', line: 9 },
    ],
    pitfall: 'Passing [loadQuote, loadStock] passes functions; it does not invoke them. Passing [await loadQuote(), await loadStock()] waits sequentially before Promise.all receives the values. Handle rejection, and do not confuse concurrency with CPU parallelism.',
    interview: 'I start independent operations and pass their promises to Promise.all. It preserves input order, so destructuring remains predictable. The group rejects when an input rejection is observed, but other work continues unless I separately cancel it. I use allSettled when the product needs individual outcomes.',
    recall: 'Stock resolves first. Why is the quote still the first item in the result?',
    answer: 'Promise.all assigns a result position from each input’s iteration index. Resolution order changes when the group becomes ready, not the meaning of each position.',
    questions: [
      { question: 'If quote rejects, does stock stop loading?', answer: 'No. The aggregate promise rejects, but the stock operation has its own lifetime. Cancellation requires an API such as a supported abort signal, plus application code that uses it.' },
      { question: 'Why does waiting appear after both finish calls in the source but before the result in the output?', answer: 'The finish calls settle the inputs. Promise handlers run later as jobs after the current synchronous script, so the immediate log runs before the aggregate handler.' },
    ],
    exercise: {
      task: 'Build a three-panel trip summary with independent fare, seat and departure promises. Control their completion manually, then present one ordered summary.',
      acceptance: ['Finish departure, then fare, then seat; the final array remains [fare, seat, departure].', 'Show a loading message until all three successful results are ready.', 'Make seat reject and show a useful error through catch; explain why the remaining operations are not automatically cancelled.', 'Repeat with allSettled and identify which panel failed without discarding the successful values.'],
      layout: 'Three labelled input cards → three reserved result slots → loading, complete or error summary. Keep input position and completion order visibly separate.',
    },
    hinglish: 'Kaam kisi bhi order mein finish ho sakta hai; result ka order input array se aata hai. Reject hone se baaki kaam apne aap cancel nahi hote.',
    resource: 'https://tc39.es/ecma262/multipage/control-abstraction-objects.html#sec-promise.all',
  },
  {
    id: 'guide-path-react',
    title: 'Keys define identity: reset a draft when its record changes',
    category: 'Learning path',
    topic: 'React',
    format: 'Visual guide',
    minutes: 9,
    explanation: 'React associates component state with an identity in the rendered tree. Component type, position and key affect that identity. Changing a prop alone does not necessarily replace the component or reset its state. A different key at the same parent position tells React that this is a different instance.\n\nHere the draft belongs to the selected support ticket. Ticket A and ticket B use the same Editor component type, but their different keys deliberately give them different state lifetimes. This example discards a draft when switching tickets; preserving separate drafts would require storing them above the editor, keyed by ticket ID.',
    useWhen: 'A form’s local state should start fresh when its logical owner changes: a selected ticket, quiz attempt or editable record. First decide whether losing the old local draft is acceptable.',
    example: 'A hotel desk gives each guest a labelled folder. Reusing a folder without clearing it can mix the previous guest’s notes into the next visit. A new key requests a fresh folder. Analogy limit: React does not archive the old folder automatically; unmounted local state is lost unless you store it elsewhere.',
    code: `// App.jsx in a React application; JSX is not a plain JS console script.
import { useState } from 'react';

function Editor({ ticketId }) {
  const [draft, setDraft] = useState('');
  return <label>
    Reply to {ticketId}
    <input value={draft} onChange={e => setDraft(e.target.value)} />
  </label>;
}

export default function App() {
  const [ticketId, setTicketId] = useState('A');
  return <main>
    <button onClick={() => setTicketId('A')}>Ticket A</button>
    <button onClick={() => setTicketId('B')}>Ticket B</button>
    <Editor key={ticketId} ticketId={ticketId} />
  </main>;
}`,
    output: 'Initial A: empty input\nType “Checking”: A shows Checking\nSwitch to B: empty input\nSwitch back to A: empty input (old local draft was discarded)',
    steps: [
      { title: 'Mount ticket A', detail: 'The editor appears under main with key A. Its state initializer supplies an empty draft for this instance.', state: 'Before: no editor\nAfter: Editor(type, key A) → draft ""', line: 17 },
      { title: 'Edit the same instance', detail: 'Typing calls setDraft. A new render retains the editor identity, so its local state becomes the typed text.', state: 'Before: A.draft = ""\nAfter: A.draft = "Checking"', line: 8 },
      { title: 'Select another owner', detail: 'Clicking Ticket B changes the parent state. Its next JSX passes ticketId B and key B to the editor position.', state: 'Before: selected A; editor key A\nAfter: selected B; requested editor key B', line: 16 },
      { title: 'Replace the editor', detail: 'The key changed. React removes A’s instance and creates B’s instance, applying the empty initial state again.', state: 'Before: key A → "Checking"\nAfter: key B → ""; A local state discarded', line: 17 },
      { title: 'Return to A', detail: 'A has no mounted editor state to recover. Switching back creates a fresh A instance; keys identify state but are not a draft database.', state: 'Before: key B → ""\nAfter: newly mounted key A → ""', line: 15 },
    ],
    pitfall: 'Do not generate a random key during every render: it repeatedly destroys local state and can lose focus. Keys need stability within their sibling group, not global uniqueness. React does not pass key as an ordinary prop, so ticketId is supplied separately.',
    interview: 'I decide what object owns the state and how long that state should live. A stable record key preserves identity for that record; changing the key resets its subtree. If switching records should retain drafts, I lift a draftById map to a longer-lived owner instead of expecting keys to store removed state.',
    recall: 'What changes if key={ticketId} is removed while the Editor stays in the same position?',
    answer: 'Changing ticketId alone retains the same Editor instance. Its draft can remain “Checking” while its label changes to B, which is incorrect if each switch must start a new reply.',
    questions: [
      { question: 'Does changing any prop reset useState to its initial value?', answer: 'No. The initializer establishes state for a new instance; later prop updates usually render the existing instance with its retained state.' },
      { question: 'How would you preserve one draft for each ticket?', answer: 'Store drafts in the parent as a map from ticket ID to text, and give Editor a value and onChange callback. The parent then owns the draft lifetime across editor replacements.' },
    ],
    exercise: {
      task: 'Create a two-customer appointment form and choose an explicit draft policy: reset on customer change, then add a second version that preserves each customer’s draft.',
      acceptance: ['The reset version clears its field when changing customer ID but retains text on unrelated parent renders.', 'The preserving version restores each customer’s own text after switching away and back.', 'Every input has a visible label, and customer buttons show the selected customer.', 'Explain why a random key would break both the typing experience and the intended state lifetime.'],
      layout: 'Customer selector above one labelled editor. A short note under the editor states “resets on switch” or “drafts saved for this session”.',
    },
    hinglish: 'Key component ki pehchaan hai. Nayi key se naya local state milta hai; purana draft chahiye toh usse parent mein sambhalo.',
    resource: 'https://react.dev/learn/preserving-and-resetting-state',
  },
  {
    id: 'guide-path-vite',
    title: 'Vite env values cross a build boundary, not a live settings channel',
    category: 'Learning path',
    topic: 'Vite',
    format: 'Visual guide',
    minutes: 8,
    explanation: 'Vite processes source modules for development and production builds. In client code, import.meta.env exposes selected configuration values; during a production build those references are replaced with build-time values. With the default prefix, VITE_ variables are exposed to the browser, and custom environment values are strings.\n\nA deployed static JavaScript file does not reread the host machine’s environment on each page load. If a banner setting changes after the bundle was generated, rebuilding and deploying a new bundle is one way to update it. A separately fetched public settings endpoint is a different design for runtime configuration.',
    useWhen: 'Choose public API base URLs, build labels or feature configuration that may be fixed for each deployment. Keep credentials in an appropriate backend; a VITE_ variable is public client configuration.',
    example: 'A bakery prints its opening hours on a batch of takeaway menus. Updating the hours in the office spreadsheet does not change menus already printed. The production bundle is that printed batch. Analogy limit: a development server is not a printed menu; it serves transformed modules, and changes to env files require restarting it.',
    code: `# .env.production (default Vite configuration)
VITE_BUILD_LABEL=preview
VITE_SHOW_TOURS=false

// src/main.js in a Vite project; do not combine these files.
const label = import.meta.env.VITE_BUILD_LABEL;
const showTours = import.meta.env.VITE_SHOW_TOURS === 'true';
console.log(import.meta.env.MODE, label, showTours);

# Build command, with no higher-priority environment overrides:
npx vite build`,
    output: 'Browser console after serving the built application:\nproduction preview false\n\nChanging .env.production alone leaves an already deployed bundle unchanged.',
    steps: [
      { title: 'Choose the mode', detail: 'The ordinary vite build command uses production mode. Vite loads applicable env files; a mode-specific file can override a generic file, while existing process environment values have higher priority.', state: 'Before: source + env files\nAfter: mode production; selected label "preview"', line: 11 },
      { title: 'Expose public strings', detail: 'The default VITE_ prefix makes these two values available to client code. The text false is still a string at this boundary.', state: 'Before: VITE_SHOW_TOURS=false in file\nAfter: import.meta.env.VITE_SHOW_TOURS = "false"', line: 3 },
      { title: 'Convert deliberately', detail: 'An equality check accepts exactly the string true. Boolean("false") would produce true because it is a nonempty string.', state: 'Before: "false"\nAfter: "false" === "true" → false', line: 7 },
      { title: 'Build and serve', detail: 'Production processing substitutes the selected values. The browser runs the built code and prints the resulting mode, label and Boolean.', state: 'Before: source reads import.meta.env\nAfter: generated client assets → production preview false', line: 8 },
      { title: 'Change the configuration', detail: 'Editing an env file does not mutate assets that were already built. Rebuild and deploy the new assets to change this build-time label.', state: 'Before: deployed label preview\nAfter file edit only: still preview\nAfter rebuild + deploy: new label', line: 2 },
    ],
    pitfall: 'A name beginning VITE_ is not protected because it came from an env file or because that file is ignored by Git. Its value can be embedded in client assets. Also distinguish mode from NODE_ENV: --mode staging selects staging configuration and does not by itself turn a production build into a development build.',
    interview: 'I separate configuration available when building from configuration required at runtime. Vite substitutes client env references during production builds. I validate and convert string values, keep secrets out of client configuration, and rebuild or choose a runtime endpoint according to how often settings must change.',
    recall: 'Why does Boolean(import.meta.env.VITE_SHOW_TOURS) enable a flag whose file value is false?',
    answer: 'The custom env value is the nonempty string “false”. JavaScript considers that truthy. Compare explicitly with “true” or use a validated parser.',
    questions: [
      { question: 'Will changing a hosting environment variable update a static bundle that has already been built?', answer: 'Not by itself. The bundle contains the values selected during its build. The host must rebuild it, or the application must use an independently implemented runtime configuration source.' },
      { question: 'What changes when building with --mode staging?', answer: 'Vite selects staging mode and its applicable env files, and import.meta.env.MODE becomes staging. Build optimization and NODE_ENV are a separate concern; staging mode is not a synonym for the development server.' },
    ],
    exercise: {
      task: 'Add a public environment badge and a Boolean help-panel flag to a small Vite application. Build two variants and inspect the actual served result.',
      acceptance: ['A false string produces a hidden help panel, and a true string produces a visible panel.', 'Production and staging builds show their expected MODE and public label.', 'Changing an env file without rebuilding does not change the previously built output.', 'No password, private token or service credential appears in any VITE_ setting.'],
      layout: 'Small environment badge near the page title, a help-panel region controlled by the parsed flag, and a written table of mode → label → expected visibility.',
    },
    hinglish: 'Build ke waqt jo value bundle mein gayi, wahi browser padhta hai. “false” string ko Boolean banane ke liye seedha Boolean() mat lagao.',
    resource: 'https://vite.dev/guide/env-and-mode',
  },
  {
    id: 'guide-path-nextjs',
    title: 'Next.js App Router: pass data across a small client boundary',
    category: 'Learning path',
    topic: 'Next.js',
    format: 'Visual guide',
    minutes: 10,
    explanation: 'In the Next.js App Router, pages and layouts are Server Components by default. A module beginning with “use client” defines an entry into the client module graph for interactive behavior such as state and event handlers. A Server Component can render that Client Component and pass props supported by React serialization.\n\nThis sample leaves product description rendering in the page and places only the quantity picker behind the client boundary. It uses fixed public data, so it also fits a static export: Server Components then run at build time. Client Components can be prerendered for the first HTML response; the directive does not mean that every line runs only in the browser.',
    useWhen: 'A mostly informational page needs a small interactive region. Decide which component requires browser interaction, what data crosses the boundary, and whether your deployment has a runtime server or only static files.',
    example: 'A museum prints the exhibit description but attaches a visitor-operated audio button. The description and the control share one display while needing different machinery. Analogy limit: a Client Component can also contribute to server-generated initial HTML; client describes the module boundary and interactive capabilities, not an absolute ban on server rendering.',
    code: `// app/page.jsx — Server Component
import Quantity from './quantity';
export default function Page() {
  const product = { name: 'Sketchbook', maxQuantity: 3 };
  return <main>
    <h1>{product.name}</h1>
    <Quantity max={product.maxQuantity} />
  </main>;
}

// app/quantity.jsx — separate file; directive must be at the top
'use client';
import { useState } from 'react';
export default function Quantity({ max }) {
  const [count, setCount] = useState(1);
  return <section>
    <p aria-live="polite">Quantity: {count}</p>
    <button disabled={count >= max}
      onClick={() => setCount(n => Math.min(n + 1, max))}>
      Add one
    </button>
  </section>;
}`,
    output: 'Initial UI: Sketchbook / Quantity: 1 / Add one\nAfter one click: Quantity: 2\nAfter two clicks: Quantity: 3; Add one is disabled\nThis JSX requires a Next.js App Router project with a root layout.',
    steps: [
      { title: 'Render public page data', detail: 'Page constructs the public product data and returns a server-rendered heading plus a reference to the interactive Quantity component.', state: 'Before: product data\nAfter: heading Sketchbook + Quantity(max: 3)', line: 7 },
      { title: 'Cross the boundary', detail: 'The numeric max prop is represented in the React payload. Quantity and its client dependencies supply the code needed for interaction; the page module itself does not become client code.', state: 'Before: server page holds product\nAfter: public max = 3 crosses to client component', line: 12 },
      { title: 'Show and hydrate', detail: 'Initial HTML can show Quantity: 1 before interaction is ready. Client JavaScript hydrates the component and connects its event handling.', state: 'Before: initial visible HTML\nAfter: hydrated Quantity; count = 1; max = 3', line: 15 },
      { title: 'Update local state', detail: 'Clicking requests a state update in the interactive component. It does not require the Server Component to run again to compute this local increment.', state: 'Before: count = 1\nAfter first click: count = 2\nHeading remains Sketchbook', line: 19 },
      { title: 'Respect the UI limit', detail: 'A second click reaches three. The button disables and the updater clamps to max. This demonstrates a UI rule, not authoritative inventory validation.', state: 'Before: count = 2; button enabled\nAfter: count = 3; button disabled', line: 18 },
    ],
    pitfall: 'Do not import a database module into a client entry or pass secrets as props: props sent to the browser are public. Avoid reading window during render merely because a component is marked use client. Static export provides no request-time Next.js server, and real checkout inventory must be verified by a suitable backend.',
    interview: 'I keep data and rendering that do not require browser interaction in Server Components, then put a client boundary around the stateful control. I pass only appropriate serializable public data. I also state the deployment model: a static export runs server components during the build and needs a separate backend for runtime writes.',
    recall: 'Does adding use client to Quantity force Page to become a Client Component too?',
    answer: 'No. Page can remain a Server Component that renders a client entry. The boundary applies to the client entry’s imported module graph; it does not propagate upward to the importing Server Component.',
    questions: [
      { question: 'Why pass max as a number instead of a normal server-created onClick function?', answer: 'The number is serializable public data. An ordinary server-created event handler cannot be sent as a client callback. Define this local event behavior inside the Client Component; Server Functions are a distinct feature with their own rules.' },
      { question: 'Can the displayed max guarantee that three items are still available at checkout?', answer: 'No. It is a UI constraint based on the provided value. Stock can change, so an authoritative backend must validate availability when accepting an order.' },
    ],
    exercise: {
      task: 'Build a product description with a client-side quantity picker and local subtotal. Keep the description in a Server Component and declare the files at the boundary.',
      acceptance: ['The page passes only a public name, numeric unit price and maximum quantity as needed.', 'Only the picker requires use client; controls are labelled and keyboard accessible.', 'Count stays between one and max, and subtotal changes with the count.', 'Explain when the page runs in static export and where a real purchase would need server validation.'],
      layout: 'Product heading and description above a compact quantity row. Show subtotal below the row and a clear label that this exercise does not place an order.',
    },
    hinglish: 'Jahan interaction chahiye, wahin client boundary rakho. Props browser tak jaate hain, isliye unmein secret mat bhejo.',
    resource: 'https://nextjs.org/docs/app/getting-started/server-and-client-components',
  },
  {
    id: 'guide-path-cpp',
    title: 'unique_ptr moves ownership while the object stays put',
    category: 'Learning path',
    topic: 'C++',
    format: 'Visual guide',
    minutes: 10,
    explanation: 'std::unique_ptr expresses sole ownership of an object and releases that object through its deleter when the owner is destroyed or reset. Moving a unique_ptr transfers that ownership; copying is disabled. For a move construction, the source unique_ptr becomes empty. The managed object itself does not have to move in memory.\n\nThis C++14-or-later example creates one receipt, transfers responsibility from ownerA to ownerB and observes one destructor call at scope exit. std::move permits move operations by changing the expression category; the receiving move constructor performs this ownership transfer. This pattern is one use of RAII: attach resource cleanup to an object’s lifetime.',
    useWhen: 'One object should control a dynamically allocated object’s lifetime, especially when transferring it between factory, service and consumer. Prefer a local value when dynamic allocation or ownership transfer is unnecessary.',
    example: 'A venue has one checkout token for a borrowed projector. Handing the token to another staff member transfers responsibility for returning the same projector. Analogy limit: raw pointers can still observe the projector; unique ownership does not prevent all aliases or automatically make access thread-safe.',
    code: `#include <iostream>
#include <memory>
#include <utility>

struct Receipt {
  int id;
  explicit Receipt(int value) : id(value) {}
  ~Receipt() { std::cout << "release " << id << '\\n'; }
};

int main() {
  {
    auto ownerA = std::make_unique<Receipt>(7);
    auto ownerB = std::move(ownerA);
    std::cout << "ownerB " << ownerB->id << '\\n';
    std::cout << std::boolalpha << "ownerA empty " << !ownerA << '\\n';
  }
  std::cout << "scope ended\\n";
}`,
    output: 'ownerB 7\nownerA empty true\nrelease 7\nscope ended',
    steps: [
      { title: 'Create one owned receipt', detail: 'make_unique creates a Receipt with id 7 and gives its ownership to ownerA. There is one Receipt object and one nonempty unique_ptr.', state: 'Before: no Receipt\nAfter: ownerA → Receipt{id: 7}\nowner count = 1', line: 13 },
      { title: 'Transfer ownership', detail: 'ownerB is move-constructed from ownerA. The pointer and cleanup responsibility transfer; this does not construct another Receipt.', state: 'Before: ownerA → Receipt 7\nAfter: ownerA → null; ownerB → same Receipt 7', line: 14 },
      { title: 'Read through the live owner', detail: 'ownerB can dereference its object. ownerA can be checked for emptiness, but dereferencing it now would be invalid.', state: 'Before: no output\nAfter: ownerB 7\nownerA empty true', line: 16 },
      { title: 'Leave the inner scope', detail: 'ownerB is destroyed and its default deleter deletes the Receipt, running its destructor. The empty ownerA has no object to delete.', state: 'Before: ownerB owns Receipt 7\nAfter: Receipt destroyed once\nOutput adds: release 7', line: 17 },
      { title: 'Continue after cleanup', detail: 'Execution resumes outside the scope after its local objects have been destroyed. No explicit delete was needed.', state: 'Before: inner scope ended\nAfter: output adds scope ended\nNo live Receipt remains', line: 18 },
    ],
    pitfall: 'Do not build two unique_ptr owners from the same raw address: both could try to delete it. A raw pointer obtained through get() does not own or extend the lifetime. std::move alone does not empty every type; the empty-source guarantee here belongs to unique_ptr’s move construction.',
    interview: 'I use unique_ptr when there is one owner and an object needs dynamic lifetime. Ownership can move, but cannot be copied. Its destructor performs cleanup, including ordinary exception unwinding. I keep borrowed references within the owner’s lifetime and prefer value members when they express the design more simply.',
    recall: 'After auto ownerB = std::move(ownerA), did Receipt’s move constructor need to run?',
    answer: 'No. The unique_ptr move constructor transfers the stored pointer and deleter. The Receipt remains the same managed object; ownerA becomes empty and ownerB now owns it.',
    questions: [
      { question: 'Why does auto ownerB = ownerA fail to compile?', answer: 'That asks to copy a unique_ptr. Copying would create two owners without an ownership policy, so its copy operations are deleted. An explicit move expresses the transfer.' },
      { question: 'Can a raw Receipt* saved before the transfer still refer to the receipt?', answer: 'Yes, the managed object remains at its address during this pointer transfer. The raw pointer is only a borrower and becomes dangling after the owning pointer destroys or resets the receipt.' },
    ],
    exercise: {
      task: 'Write a makeReceipt factory returning unique_ptr<Receipt>, then transfer the result into a processReceipt function that accepts unique_ptr by value.',
      acceptance: ['Compile as C++14 or later and include the headers used by the example.', 'Show the caller’s pointer becoming empty after the move into processReceipt.', 'Print exactly one Receipt destructor message after the owning lifetime ends.', 'Explain how a function taking const Receipt& would borrow instead of take ownership.'],
      layout: 'Draw two owner boxes above one Receipt box. Move the single ownership arrow between boxes, then cross out the Receipt only when its final owner ends.',
    },
    hinglish: 'Object ki copy nahi bani; usko delete karne ki zimmedari doosre owner ko mili. Move ke baad purane unique_ptr ko dereference mat karo.',
    resource: 'https://eel.is/c++draft/unique.ptr.single.ctor',
  },
  {
    id: 'guide-path-java',
    title: 'try-with-resources: close every acquired resource on failure',
    category: 'Learning path',
    topic: 'Java',
    format: 'Visual guide',
    minutes: 9,
    explanation: 'Java’s try-with-resources declares resources that implement AutoCloseable. When control leaves the try body, successfully initialized resources are closed in reverse declaration order, including when the body throws. A following catch runs after this cleanup. This is deterministic resource management; waiting for garbage collection is not a substitute for closing a file or connection.\n\nThe demo uses a small logging resource so cleanup is visible without requiring files or a database. It opens an input and an output, simulates a failed export, closes output then input, and finally reports the failure. The syntax shown is available in Java 7 and later.',
    useWhen: 'Acquire closeable resources for one bounded operation: reading a file, exporting a report, or working with suitable database connection and statement objects. Only close resources that the operation owns.',
    example: 'Packing away a workshop can require stopping the cutting machine before disconnecting its power supply. The most recently acquired resource is released first. Analogy limit: reverse order is Java’s specified cleanup order, not a guarantee that every resource dependency has been designed correctly.',
    code: `public class ResourceDemo {
  static final class Resource implements AutoCloseable {
    private final String name;
    Resource(String name) {
      this.name = name;
      System.out.println("open " + name);
    }
    @Override public void close() {
      System.out.println("close " + name);
    }
  }

  public static void main(String[] args) {
    try (Resource input = new Resource("input");
         Resource output = new Resource("output")) {
      System.out.println("copy");
      throw new IllegalStateException("bad row");
    } catch (IllegalStateException error) {
      System.out.println("caught " + error.getMessage());
    }
  }
}`,
    output: 'open input\nopen output\ncopy\nclose output\nclose input\ncaught bad row',
    steps: [
      { title: 'Acquire input', detail: 'The first initializer succeeds. Java now tracks input as a resource to close when leaving the statement.', state: 'Before: no resources\nAfter: input open\nOutput: open input', line: 14 },
      { title: 'Acquire output', detail: 'The second initializer succeeds. Both resources are now available within the body; output will close before input.', state: 'Before: input open\nAfter: input open; output open\nCleanup order: output → input', line: 15 },
      { title: 'Fail during copying', detail: 'The body prints copy and then throws. Normal work stops, but resource cleanup is still performed before entering the catch.', state: 'Before: copy executing\nAfter: IllegalStateException("bad row") pending\nBoth resources still need cleanup', line: 17 },
      { title: 'Close in reverse order', detail: 'Java calls output.close() and then input.close(). Here neither close method throws, so the original failure remains the exception being propagated.', state: 'Before: input open; output open\nAfter: output closed; input closed\nOutput adds: close output, close input', line: 18 },
      { title: 'Handle the failure', detail: 'The catch now receives the original exception. The resource lifetimes have ended before the error is reported.', state: 'Before: failure pending after cleanup\nAfter: caught bad row\nOpen resources = 0', line: 19 },
    ],
    pitfall: 'Closing is not the same as rolling back an application’s business changes; transaction behavior must be defined separately. If both the body and close throw, the body exception is primary and close exceptions are suppressed, available through getSuppressed(). Never silently discard these details during diagnosis.',
    interview: 'I use try-with-resources for resources I own that implement AutoCloseable. It closes successfully acquired resources in reverse order on normal and exceptional exits. When the body and cleanup both fail, Java preserves the body failure and attaches cleanup failures as suppressed exceptions.',
    recall: 'If opening output throws after input was successfully opened, is input still closed?',
    answer: 'Yes. Resources initialized earlier in the statement are still closed. There is no successfully initialized output resource for that declaration to close; a failing constructor must manage any partial acquisition it performs internally.',
    questions: [
      { question: 'Does catch execute before or after these resources close?', answer: 'After. Cleanup for the try-with-resources statement happens before its associated catch or finally blocks execute.' },
      { question: 'Why not rely on garbage collection to close a database connection?', answer: 'Memory reachability does not provide a timely resource-release contract. Connections and file descriptors are external resources with limited capacity; closing them at the intended scope boundary makes ownership explicit.' },
    ],
    exercise: {
      task: 'Save the example as ResourceDemo.java, run it, then make output.close() throw a RuntimeException after printing its close message.',
      acceptance: ['The baseline output matches the six displayed lines.', 'In the failure variant, input.close() still runs even though output.close() throws.', 'The caught primary exception is still bad row, and getSuppressed() exposes the cleanup failure.', 'A short explanation distinguishes resource cleanup from transaction commit or rollback.'],
      layout: 'Two resource rows show unopened → open → closed. A separate exception row shows body failure → cleanup → primary plus suppressed errors.',
    },
    hinglish: 'Try block fail ho tab bhi acquired resources close hote hain. Jo last mein khula, woh pehle close hoga; original error ko chhupao mat.',
    resource: 'https://docs.oracle.com/javase/tutorial/essential/exceptions/tryResourceClose.html',
  },
  {
    id: 'guide-path-csharp',
    title: 'LINQ Where stores a query; ToList takes a snapshot now',
    category: 'Learning path',
    topic: 'C#',
    format: 'Visual guide',
    minutes: 9,
    explanation: 'For LINQ to Objects, Where creates an enumerable query whose predicate runs when the results are enumerated. It does not immediately copy matching elements into a new list. ToList enumerates that query now and materializes the current results. Enumerating the original query again can observe changes made to its source in between.\n\nThe inventory example uses a List<int>, so its behavior is local and easy to trace. A query over a database through IQueryable has additional provider, translation and execution rules; do not assume this in-memory example explains every LINQ source.',
    useWhen: 'Use deferred queries to describe a transformation you want to enumerate later. Materialize deliberately when a report needs a stable set of current values or when repeated enumeration would redo expensive work. Consider the extra memory cost.',
    example: 'A saved grocery checklist rule says “show prices at least 100”. Applying the rule tomorrow uses tomorrow’s shelf labels. A printed copy of today’s matching prices stays unchanged. Analogy limit: ToList copies the sequence’s elements, not an entire object graph; if the elements are mutable reference objects, both lists can still refer to the same objects.',
    code: `using System;
using System.Collections.Generic;
using System.Linq;

class Program {
  static void Main() {
    var prices = new List<int> { 80, 120, 150 };
    var expensive = prices.Where(price => price >= 100);
    var snapshot = expensive.ToList();
    prices.Add(200);
    Console.WriteLine("query: " + string.Join(",", expensive));
    Console.WriteLine("snapshot: " + string.Join(",", snapshot));
  }
}`,
    output: 'query: 120,150,200\nsnapshot: 120,150',
    steps: [
      { title: 'Create the source', detail: 'The list contains three integer values. No query or result snapshot exists yet.', state: 'Before: no source\nAfter: prices = [80,120,150]', line: 7 },
      { title: 'Describe the filter', detail: 'Where returns a deferred enumerable connected to prices and the predicate. It has not created a saved list of matching values.', state: 'Before: source only\nAfter: expensive = rule(price >= 100) over prices\nSaved results: none', line: 8 },
      { title: 'Materialize current values', detail: 'ToList enumerates expensive, evaluates the predicate and stores its current matches in a separate List<int>.', state: 'Before: deferred rule\nAfter: snapshot = [120,150]\nprices remains [80,120,150]', line: 9 },
      { title: 'Change the source', detail: 'The new value is appended after the first enumeration has completed. The integer snapshot is unaffected.', state: 'Before: prices = [80,120,150]\nAfter: prices = [80,120,150,200]\nsnapshot = [120,150]', line: 10 },
      { title: 'Enumerate both', detail: 'string.Join enumerates expensive now, so 200 is included. Enumerating snapshot reads the two values materialized earlier.', state: 'Before: query has not been enumerated since Add\nAfter: query → 120,150,200\nsnapshot → 120,150', line: 12 },
    ],
    pitfall: 'Avoid side effects in query predicates and do not structurally modify a List while enumerating it. Repeating Count() and then foreach over a deferred query can repeat work. ToList is a shallow materialization, not deep cloning or automatic thread safety.',
    interview: 'I distinguish a query definition from its execution. With LINQ to Objects, Where is deferred; enumeration reads the current source. ToList executes and stores the results, trading memory for a stable sequence of those element values or references. I materialize at an intentional boundary rather than assuming a query variable already contains results.',
    recall: 'If ToList moves below prices.Add(200), what does snapshot print?',
    answer: 'It prints 120,150,200, because materialization then occurs after the source contains 200. The query is evaluated when ToList runs.',
    questions: [
      { question: 'Is expensive automatically updated as a stored list when Add runs?', answer: 'No stored result list is updated. expensive is a deferred description that will inspect its source on the next enumeration.' },
      { question: 'Would ToList protect a list of Product objects from later changes to Product.Price?', answer: 'Not by itself. It creates a separate list containing the same object references. Copy the required values or create an appropriate immutable representation if those values must remain frozen.' },
    ],
    exercise: {
      task: 'Create an expense report from a List<int>. Compare a deferred query for expenses above a threshold with a materialized report captured before adding a new expense.',
      acceptance: ['The deferred query includes an eligible expense added before its next enumeration.', 'The earlier integer snapshot retains its original values.', 'A counter inside a temporary diagnostic predicate demonstrates when enumeration occurs; remove the side effect from the final implementation.', 'Explain why the result would need more care if each expense were a mutable object.'],
      layout: 'Source list on the left; deferred rule above an arrow; snapshot card stamped “captured before Add” on the right. Show two distinct outputs below.',
    },
    hinglish: 'Query likhne se result ki photo nahi banti. Enumerate karne par filter chalta hai; ToList us waqt ke results ko list mein rakhta hai.',
    resource: 'https://learn.microsoft.com/en-us/dotnet/csharp/linq/get-started/introduction-to-linq-queries',
  },
  {
    id: 'guide-path-python',
    title: 'Mutable defaults share one object across function calls',
    category: 'Learning path',
    topic: 'Python',
    format: 'Visual guide',
    minutes: 8,
    explanation: 'Python evaluates a default argument expression when the function definition executes. If the default is a mutable list, later calls that omit that argument receive the same list object. Appending changes that shared object, so one call can affect the next. A default of None lets the function create a new list inside each call when that is the intended contract.\n\nThe repaired helper below distinguishes “no list supplied” from “an empty list supplied”. When a caller explicitly passes a list, the helper deliberately appends to that caller’s list. This is an ownership decision to document, not an accidental side effect to leave ambiguous.',
    useWhen: 'Design optional collection parameters for batch jobs, notification recipients or request metadata. Decide whether each call should get fresh storage and whether a caller-provided collection may be mutated.',
    example: 'A registration desk can hand each visitor a new blank form, or keep adding names to one shared clipboard. Writing [] in a default argument chooses the clipboard once when defining the function. Analogy limit: sharing is not always a bug—some designs intentionally share state—but hidden state across unrelated requests is usually surprising.',
    code: `def add_bad(name, attendees=[]):
    attendees.append(name)
    return attendees

print(add_bad("Mira"))
print(add_bad("Omar"))

def add_attendee(name, attendees=None):
    if attendees is None:
        attendees = []
    attendees.append(name)
    return attendees

print(add_attendee("Mira"))
print(add_attendee("Omar"))
team = []
add_attendee("Rae", team)
print(team)`,
    output: "['Mira']\n['Mira', 'Omar']\n['Mira']\n['Omar']\n['Rae']",
    steps: [
      { title: 'Define the shared default', detail: 'Executing def add_bad creates its default list once. No attendee has been appended yet.', state: 'Before: function undefined\nAfter: add_bad default → list L0 = []', line: 1 },
      { title: 'Reuse it across two calls', detail: 'Both calls omit attendees, so both receive L0. The first print occurs before the second mutation, but the second call sees Mira already present.', state: 'Before: L0 = []\nAfter first call: [Mira]\nAfter second call: [Mira,Omar]', line: 6 },
      { title: 'Create per-call lists', detail: 'The repaired default is None. Each omitted argument triggers a new list allocation inside the function.', state: 'Before: attendees = None for each call\nAfter: Mira call → L1 [Mira]\nOmar call → separate L2 [Omar]', line: 10 },
      { title: 'Respect an explicit empty list', detail: 'team is an actual list even when empty. The is None check is false, so the supplied list is retained and modified.', state: 'Before: team → L3 []\nAfter: team → same L3 [Rae]', line: 17 },
      { title: 'Explain the contract', detail: 'Independent default calls have independent storage; explicit list arguments opt into modification of the supplied list. A nonmutating helper would need a different implementation.', state: 'Default omitted → allocate new list\nList supplied → mutate that list\nDefault object lifetime is now harmless None', line: 18 },
    ],
    pitfall: 'Replacing the check with if not attendees treats an explicit empty list as absent and breaks the promised caller mutation. If None is a meaningful supplied value, use a unique sentinel object instead. The same mutable-default concern applies to dictionaries and other mutable objects.',
    interview: 'Default arguments are evaluated when def executes, not freshly for every call. A mutable default can therefore retain changes across calls. I use None plus an identity check to allocate per call, and I separately document whether supplied collections are mutated or copied.',
    recall: 'Why use attendees is None instead of if not attendees?',
    answer: 'An empty list is falsey but is still a deliberately supplied object. The identity check detects only the absence marker, so an explicit empty list can be modified according to this helper’s contract.',
    questions: [
      { question: 'If two variables capture consecutive add_bad results, do they refer to different lists?', answer: 'No. When both calls omit the second argument, both results refer to the same default list. A later append is visible through either reference.' },
      { question: 'How could this helper return an updated list without mutating a supplied list?', answer: 'Make a copy first, for example result = [] if attendees is None else list(attendees), then append to result and return it. This is a shallow copy and should be stated in the function’s contract.' },
    ],
    exercise: {
      task: 'Write add_tag(tag, tags=None) in two versions: one that modifies a supplied list and one that always returns a new outer list.',
      acceptance: ['Two calls omitting tags produce separate results without accumulated tags.', 'In the mutating version, an explicitly supplied empty list receives the tag.', 'In the copying version, the supplied list remains unchanged and the returned list contains the tag.', 'Use is checks to demonstrate which references share an object, and explain the result in one paragraph.'],
      layout: 'Draw each variable as a label with an arrow to a list box. Shared arrows explain the bug; separate boxes explain the per-call fix.',
    },
    hinglish: 'Default wali list har call par nayi nahi banti. None check karke function ke andar list banao, aur caller ki list mutate hogi ya copy—yeh contract clear rakho.',
    resource: 'https://docs.python.org/3/tutorial/controlflow.html#default-argument-values',
  },
  {
    id: 'guide-path-dsa',
    title: 'Lower-bound binary search keeps a shrinking unknown interval',
    category: 'Learning path',
    topic: 'DSA',
    format: 'Visual guide',
    minutes: 11,
    explanation: 'Lower bound returns the first index whose value is at least the target, or the array length if there is no such value. It answers an insertion-position question, so it works whether or not the target exists and chooses the first position among duplicates. This version assumes an ascending array of finite numbers.\n\nMaintain two facts: every index before lo has a value less than target, and every index at or beyond hi has a value at least target. Only [lo, hi) remains unknown. A midpoint comparison removes part of that interval without losing the answer. At lo === hi, the boundary is known. Time is O(log n) comparisons with constant-time indexed access; extra space is O(1).',
    useWhen: 'Find the earliest departure at or after a requested minute, the first price meeting a minimum, or the left edge of a run of equal values. The data must already satisfy the ordering required by the comparison.',
    example: 'A timetable lists departures at minutes [5, 12, 12, 20, 31]. A passenger arriving at minute 12 needs the first departure that is not earlier: index 1. Analogy limit: the algorithm assumes the timetable stays sorted and unchanged during the search; real delays can violate that model.',
    code: `function lowerBound(values, target) {
  let lo = 0;
  let hi = values.length;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (values[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
const departures = [5, 12, 12, 20, 31];
console.log(lowerBound(departures, 12));
console.log(lowerBound(departures, 13));
console.log(lowerBound(departures, 40));
console.log(lowerBound([], 12));`,
    output: '1\n3\n5\n0',
    steps: [
      { title: 'Start with the whole unknown range', detail: 'For target 12, lo is 0 and hi is 5. No real index has been excluded. hi is an exclusive endpoint and can equal the array length.', state: 'Before: [5,12,12,20,31], target 12\nAfter: lo=0; hi=5; unknown indices [0,5)', line: 3 },
      { title: 'Keep an equal midpoint as a candidate', detail: 'mid is 2 and values[2] is 12. This position qualifies, but an earlier 12 may exist, so move hi to mid instead of returning immediately.', state: 'Before: lo=0; hi=5; mid=2\nComparison: 12 >= 12\nAfter: lo=0; hi=2; indices 2..4 known to qualify', line: 7 },
      { title: 'Continue toward the first match', detail: 'mid is now 1 and also holds 12. Again keep the qualifying boundary while narrowing the still-unknown earlier positions.', state: 'Before: lo=0; hi=2; mid=1\nComparison: 12 >= 12\nAfter: lo=0; hi=1; unknown [0,1)', line: 7 },
      { title: 'Exclude a value that is too early', detail: 'mid is 0 and holds 5. This index cannot be an answer; sorted order also rules out every earlier index. Advance lo past mid.', state: 'Before: lo=0; hi=1; mid=0\nComparison: 5 < 12\nAfter: lo=1; hi=1; unknown interval empty', line: 6 },
      { title: 'Return the boundary', detail: 'The loop ends at index 1. Everything before it is too small and everything from it onward qualifies. For target 40 the same contract returns 5, an insertion position after the final item.', state: 'Before: lo=hi=1\nAfter: return 1; departures[1]=12\nNo-match sentinel for target 40: length 5', line: 9 },
    ],
    pitfall: 'Using lo = mid can fail to shrink a one-element interval. Using hi = mid - 1 mixes inclusive and exclusive conventions. Returning on equality can return the second duplicate. Do not index values[result] without checking result < values.length. Finding a position is O(log n), but inserting into an array can still take O(n).',
    interview: 'I define the contract as the first index with value at least target. I maintain a half-open unknown interval, with all earlier positions too small and all positions from hi onward qualifying. Each branch shrinks the interval, so termination leaves exactly the boundary. Duplicates, empty input and an answer at length follow from the same invariant.',
    recall: 'Why does values[mid] === target move hi to mid instead of returning?',
    answer: 'The midpoint qualifies but may not be the first qualifying position. Retaining it as the right boundary and searching earlier positions finds the leftmost occurrence.',
    questions: [
      { question: 'How would you decide whether the target actually exists after lowerBound returns i?', answer: 'Check i < values.length and values[i] === target. The function always returns an insertion position, including when the target is absent.' },
      { question: 'What changes to find the first value strictly greater than target?', answer: 'Use values[mid] <= target in the branch that advances lo. Equal values then belong to the excluded left side, producing an upper bound. State and preserve the revised invariant.' },
    ],
    exercise: {
      task: 'Build a departure finder that uses lowerBound to show the first available departure at or after a chosen minute, or a clear no-departures message.',
      acceptance: ['For [5,12,12,20,31], targets 4, 12, 13 and 40 return indices 0, 1, 3 and 5.', 'Empty input returns 0 and the UI does not attempt to read an existing departure.', 'Record lo, hi and mid for each iteration and show that hi - lo strictly decreases.', 'Explain why sorting unsorted input has its own cost and why insertion into an array is not made logarithmic by this search.'],
      layout: 'A sorted horizontal timeline with lo and hi boundary markers, a highlighted mid value, a target input and a result card. Draw hi at the gap after the final item when hi equals length.',
    },
    hinglish: 'Answer ko guess mat karo; unknown range ko chhota karo. Equal value milne par bhi left mein dekho, kyunki pehli matching position chahiye.',
    resource: 'https://docs.python.org/3/library/bisect.html#bisect.bisect_left',
  },
];
