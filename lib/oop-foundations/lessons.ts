import type { FoundationFrame, FoundationLesson } from './types';

type NodeTuple = [string, string];
type VariableTuple = [string, string, string];

/** Source markers keep authored animation frames attached to an actual displayed line. */
function frame(source: string, marker: string, title: string, explanation: string, active: 0 | 1 | 2,
  nodes: [NodeTuple, NodeTuple, NodeTuple], variables: VariableTuple[]): FoundationFrame {
  const line = source.split('\n').findIndex(text => text.trim() === marker.trim()) + 1;
  if (!line) throw new Error(`Missing OOP walkthrough source marker: ${marker}`);
  return { title, explanation, active, line,
    nodes: nodes.map(([label, value], index) => ({ label, value, icon: ['📘', '⚙️', '📦'][index] })),
    variables: variables.map(([name, before, after]) => ({ name, before, after })) };
}

const classesUrl = 'https://www.typescriptlang.org/docs/handbook/2/classes.html';
const genericsUrl = 'https://www.typescriptlang.org/docs/handbook/2/generics.html';
const erasedUrl = 'https://www.typescriptlang.org/docs/handbook/2/basic-types.html#erased-types';

const fieldsSource = `class Counter {
  count = 0;
  increment() {
    this.count += 1;
    return this.count;
  }
}
const first = new Counter();
const second = new Counter();
const result = first.increment();
console.log(result, first.count, second.count);`;

const constructorsSource = `class Ticket {
  readonly seat: string;
  constructor(seat: string) {
    const clean = seat.trim();
    if (!clean) throw new Error("Seat required");
    this.seat = clean;
  }
}
const ticket = new Ticket(" A1 ");
console.log(ticket.seat);
try { new Ticket("  "); }
catch { console.log("Rejected"); }`;

const thisSource = `class Counter {
  count = 0;
  increment() { this.count += 1; }
}
const counter = new Counter();
const run = () => counter.increment();
run();
const detached = counter.increment;
try { detached(); }
catch { console.log("Missing receiver"); }
console.log(counter.count);`;

const staticSource = `class Coupon {
  static created = 0;
  readonly id: number;
  constructor() {
    Coupon.created += 1;
    this.id = Coupon.created;
  }
  static count() { return Coupon.created; }
}
const first = new Coupon();
const second = new Coupon();
console.log(first.id, second.id, Coupon.count());`;

const genericsSource = `class Box<T> {
  constructor(public value: T) {}
  read(): T { return this.value; }
}
const label = new Box<string>("Ready");
const count = new Box<number>(3);
console.log(label.read().toUpperCase());
console.log(count.read() + 1);
// label.value = 42; // Type error if uncommented.
// Runtime JavaScript has one Box class; T is erased.`;

const constraintsSource = `function keepWithTitle<T extends { title: string }>(item: T): T {
  console.log(item.title);
  return item;
}
const lesson = { title: "Objects", minutes: 12 };
const kept = keepWithTitle(lesson);
console.log(kept.minutes);
// keepWithTitle({ minutes: 12 }); // Type error: title is missing.`;

const overloadsSource = `function label(value: string): string;
function label(value: number): string;
function label(value: string | number): string {
  if (typeof value === "number") return "#" + value;
  return value.toUpperCase();
}
console.log(label(7));
console.log(label("ready"));
// label(true); // Type error: no overload accepts boolean.`;

const immutabilitySource = `type Profile = Readonly<{ name: string; tags: readonly string[] }>;
const first: Profile = { name: "Ana", tags: ["learner"] };
const second: Profile = {
  ...first, tags: [...first.tags, "mentor"]
};
console.log(first.tags.join(","));
console.log(second.tags.join(","), first === second);
const frozen = Object.freeze({ nested: { score: 1 } });
frozen.nested.score = 2;
console.log(frozen.nested.score);`;

const injectionSource = `interface Clock { now(): number; }
class Session {
  constructor(private clock: Clock) {}
  elapsed(start: number) { return this.clock.now() - start; }
}
const fixedClock: Clock = { now: () => 1500 };
const session = new Session(fixedClock);
console.log(session.elapsed(1000));
const later = new Session({ now: () => 2200 });
console.log(later.elapsed(1000));`;

const idempotencySource = `// Synchronous in-memory teaching model; no payment is made.
type Saved = { cents: number; receipt: string };
const saved = new Map<string, Saved>();
let totalCents = 0;
function apply(key: string, cents: number): string {
  const previous = saved.get(key);
  if (previous) {
    if (previous.cents !== cents) throw new Error("Key/body conflict");
    return previous.receipt;
  }
  if (!Number.isSafeInteger(cents) || cents <= 0) throw new Error("Invalid cents");
  totalCents += cents;
  const receipt = "demo-" + saved.size;
  saved.set(key, { cents, receipt });
  return receipt;
}
console.log(apply("order-7", 500));
console.log(apply("order-7", 500)); // Retry the same logical operation.
try { apply("order-7", 700); }
catch { console.log("Conflict"); }
console.log(totalCents);`;

/** Fixed, authored walkthroughs. These frames describe examples; the UI does not execute them. */
export const foundationLessons: FoundationLesson[] = [
  {
    id: 'fields-methods', title: 'Classes, fields & methods', category: 'Object basics',
    definition: 'A class describes how to create objects with related data and behavior. A field holds data; a method is an operation an object supports. Each new Counter below has its own count field.',
    why: 'Keeping a counter’s value beside its increment operation makes it easier to see what state that operation changes.',
    when: 'Use an object when behavior belongs with a particular stateful thing, such as a cart or timer. A plain object or function can be simpler when a reusable class adds little.',
    analogy: { story: 'A scorekeeper’s instructions are the class. Each game gets its own scorecard, whose score is a field. “Add one point” is an operation on that scorecard.', limit: 'Copying a reference to a scorecard does not print a new scorecard. Two variables can still point to the same object.' },
    code: { language: 'TypeScript', source: fieldsSource, expected: '1 1 0' },
    takeaway: 'Fields answer “what does this object know?” Methods answer “what can it do?”',
    pitfall: 'A method is not automatically safe just because it belongs to a class. These public count fields are intentionally simple; callers could still overwrite them. Encapsulation adds rules around changes.',
    interviewAnswer: 'A class describes related state and behavior. An instance is one object created from it. My Counter has a count field and an increment method; creating two counters gives them separate counts. I choose a class when that grouping helps explain ownership.',
    steps: [
      frame(fieldsSource, 'class Counter {', 'Describe a kind of object', 'The class defines the field initialization and operations. No Counter instance has been created yet.', 0, [['Class', 'Counter definition'], ['First object', 'not created'], ['Second object', 'not created']], [['instances', '0', '0']]),
      frame(fieldsSource, 'const first = new Counter();', 'Create the first instance', 'new creates a Counter and initializes its count to zero. first stores a reference to that object.', 1, [['Class', 'count starts at 0'], ['First object', 'count: 0'], ['Second object', 'not created']], [['first.count', 'no first object', '0']]),
      frame(fieldsSource, 'const second = new Counter();', 'Create a different instance', 'The same class creates a second object. Its field is initialized independently, so both counts are zero.', 2, [['Class', 'same instructions'], ['First object', 'count: 0'], ['Second object', 'count: 0']], [['second.count', 'no second object', '0'], ['first.count', '0', '0']]),
      frame(fieldsSource, 'this.count += 1;', 'Send first the increment operation', 'During first.increment(), this refers to first. The assignment changes only that object’s count; the following return produces 1.', 1, [['Call', 'first.increment()'], ['First object', 'count: 1'], ['Second object', 'count: 0']], [['first.count', '0', '1'], ['second.count', '0', '0']]),
      frame(fieldsSource, 'console.log(result, first.count, second.count);', 'Observe return value and state', 'result contains the number returned by increment. Reading the two fields confirms that the second object stayed unchanged.', 2, [['Return value', 'result: 1'], ['Object fields', 'first: 1 · second: 0'], ['Console', '1 1 0']], [['result', '1', '1'], ['second.count', '0', '0']])
    ],
    question: { prompt: 'After first.increment(), second.count is still zero. What best explains this?', options: [
      { id: 'separate', label: 'Each new Counter has its own count field.', correct: true, feedback: 'Correct. Both objects use the same class, but their instance state is separate.' },
      { id: 'const', label: 'const prevents second’s object from ever changing.', correct: false, feedback: 'const prevents rebinding the variable. It does not freeze the referenced object.' },
      { id: 'method-copy', label: 'Calling a method creates a fresh copy of every object.', correct: false, feedback: 'The method changes its receiving object. No copy operation appears in this example.' }
    ] },
    sources: [{ label: 'TypeScript: class members', url: classesUrl + '#class-members' }, { label: 'MDN: using classes', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_classes' }]
  },
  {
    id: 'constructors', title: 'Constructors & valid starting state', category: 'Object basics',
    definition: 'A constructor initializes a newly created class instance. It receives setup inputs and can reject values that would leave the object invalid.',
    why: 'A ticket with a blank seat is a bad starting state. Normalizing and checking the seat during construction gives every successfully created Ticket a usable value.',
    when: 'Use a constructor for required state and supplied dependencies. Keep expensive or asynchronous work outside it; a factory can coordinate that work before returning a ready object.',
    analogy: { story: 'Before handing over a library card, a librarian fills in the required member identifier. An incomplete application is rejected rather than issued as a half-ready card.', limit: 'A constructor can validate a local format, but it cannot establish every real-world fact, such as whether a seat still exists in a remote booking system.' },
    code: { language: 'TypeScript', source: constructorsSource, expected: 'A1\nRejected' },
    takeaway: 'A successful constructor should establish the object’s initial invariants.',
    pitfall: 'Declaring a parameter as string does not ensure it is nonblank. TypeScript’s readonly field is a type-checking restriction, not a runtime deep freeze. In a derived JavaScript class, call super() before accessing this.',
    interviewAnswer: 'A constructor sets up a new instance. I use it to provide required values and establish valid initial state. My Ticket trims its seat input and rejects an empty result. External lookups belong in a separate creation workflow rather than being hidden in a simple constructor.',
    steps: [
      frame(constructorsSource, 'const ticket = new Ticket(" A1 ");', 'Start construction with input', 'new Ticket passes the string with surrounding spaces to the constructor. ticket is assigned only after construction succeeds.', 0, [['Caller', 'new Ticket(" A1 ")'], ['Constructor input', 'seat: " A1 "'], ['Result', 'not assigned yet']], [['ticket', 'not initialized', 'not initialized']]),
      frame(constructorsSource, 'const clean = seat.trim();', 'Normalize the setup value', 'trim returns a new string without surrounding spaces. The local clean value is A1; the original string is not mutated.', 1, [['Input', '" A1 "'], ['Normalization', 'trim()'], ['Local value', 'clean: "A1"']], [['clean', 'not initialized', '"A1"']]),
      frame(constructorsSource, 'this.seat = clean;', 'Publish valid instance state', 'The nonempty check has passed. The constructor assigns A1 to the instance, returns normally, and ticket then refers to this initialized object.', 2, [['Validation', 'nonempty: true'], ['Assignment', 'this.seat = clean'], ['Ticket', 'seat: "A1"']], [['ticket.seat', 'not assigned', '"A1"']]),
      frame(constructorsSource, 'console.log(ticket.seat);', 'Use the completed object', 'The caller reads the seat after successful construction. The first console line is A1.', 2, [['Caller', 'read ticket.seat'], ['Ticket', 'seat: "A1"'], ['Console', 'A1']], [['ticket.seat', '"A1"', '"A1"']]),
      frame(constructorsSource, 'if (!clean) throw new Error("Seat required");', 'Reject a separate blank request', 'The second construction receives two spaces. Trimming produces an empty string, so this check throws before assigning this.seat. The original ticket remains valid.', 1, [['Second input', '"  "'], ['Constructor', 'clean: "" → throw'], ['Original ticket', 'seat: "A1"']], [['second clean', '""', '""'], ['ticket.seat', '"A1"', '"A1"']]),
      frame(constructorsSource, 'catch { console.log("Rejected"); }', 'Handle failed construction', 'The catch block prints Rejected. No successfully constructed second Ticket is returned to the caller.', 2, [['Failure', 'Seat required'], ['Caller', 'catch block'], ['Console', 'Rejected']], [['successful tickets', '1', '1']])
    ],
    question: { prompt: 'A constructor receives a string for a required seat. Why still check the trimmed value?', options: [
      { id: 'runtime', label: 'The string type permits empty or whitespace-only strings.', correct: true, feedback: 'Correct. A type describes the value category, while the constructor enforces the domain rule for valid seats.' },
      { id: 'readonly', label: 'readonly automatically removes whitespace only after construction.', correct: false, feedback: 'readonly does not transform values. The explicit trim call does that work.' },
      { id: 'never', label: 'Constructors cannot reject invalid inputs.', correct: false, feedback: 'A constructor can throw. The caller must then handle construction failure.' }
    ] },
    sources: [{ label: 'MDN: constructor', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/constructor' }, { label: 'TypeScript: constructors', url: classesUrl + '#constructors' }]
  },
  {
    id: 'this', title: 'this & method receivers', category: 'Object basics',
    definition: 'For an ordinary JavaScript method call such as counter.increment(), this refers to the receiving object. Extracting that method into a variable does not automatically keep its original receiver.',
    why: 'A callback can lose the object it needs. Recognizing the call form explains why a method works directly but fails when passed around.',
    when: 'Use this to read or change the receiving instance. When supplying callbacks, use a wrapper such as () => counter.increment(), or bind the method to the intended object.',
    analogy: { story: '“Update my score” works when it is addressed to one scorekeeper. Copying the sentence onto an unaddressed note loses who “my” refers to.', limit: 'JavaScript decides ordinary this from the invocation. Arrow functions instead capture their surrounding this, so different function forms follow different rules.' },
    code: { language: 'TypeScript', source: thisSource, expected: 'Missing receiver\n1' },
    takeaway: 'Read the call site: object.method() supplies the object; a detached method call may not.',
    pitfall: 'Class methods run in strict mode. In detached(), this is undefined, so reading this.count throws. An arrow callback is not inherently bound to counter; this wrapper works because its body explicitly calls counter.increment().',
    interviewAnswer: 'this is the receiver for an ordinary method invocation. counter.increment() uses counter, but a detached reference loses that receiver. For a callback, I can wrap the call or use bind. Arrow functions capture lexical this, which is a different rule.',
    steps: [
      frame(thisSource, 'const counter = new Counter();', 'Create the receiver', 'The object begins with count equal to zero. The class method exists, but no increment call has occurred.', 1, [['Class', 'Counter'], ['Receiver', 'counter.count: 0'], ['Calls', 'none']], [['counter.count', 'no object', '0']]),
      frame(thisSource, 'const run = () => counter.increment();', 'Create an explicit callback', 'Creating run stores a function; it does not execute increment. Its body retains an explicit counter.increment() call.', 0, [['Callback', 'run'], ['Body', 'counter.increment()'], ['Counter', 'count: 0']], [['counter.count', '0', '0']]),
      frame(thisSource, 'run();', 'Invoke through the wrapper', 'run executes counter.increment(). The method receives counter as this and changes its count from zero to one.', 1, [['Caller', 'run()'], ['Method receiver', 'this === counter'], ['Counter', 'count: 1']], [['counter.count', '0', '1']]),
      frame(thisSource, 'const detached = counter.increment;', 'Copy only the function reference', 'Reading the method gives detached the function. This step does not call it and does not permanently bind it to counter.', 0, [['Variable', 'detached'], ['Function', 'increment body'], ['Counter', 'count: 1']], [['counter.count', '1', '1']]),
      frame(thisSource, 'try { detached(); }', 'A call without the receiver fails', 'The class method is invoked as detached(), so this is undefined. Accessing this.count throws before changing the counter; catch prints Missing receiver.', 1, [['Call', 'detached()'], ['Inside method', 'this: undefined → error'], ['Counter', 'count: 1']], [['counter.count', '1', '1']]),
      frame(thisSource, 'console.log(counter.count);', 'Inspect the unaffected value', 'The successful wrapper call incremented once. The failed detached call did not mutate state, so the final output is 1.', 2, [['Successful calls', '1'], ['Counter', 'count: 1'], ['Console', '1']], [['counter.count', '1', '1']])
    ],
    question: { prompt: 'Which callback safely increments this counter when invoked later?', options: [
      { id: 'detached', label: 'const callback = counter.increment;', correct: false, feedback: 'That extracts the function without binding its receiver. callback() would not supply counter as this.' },
      { id: 'wrapper', label: 'const callback = () => counter.increment();', correct: true, feedback: 'Correct. The wrapper’s body explicitly invokes the method on counter.' },
      { id: 'called', label: 'const callback = counter.increment();', correct: false, feedback: 'That calls the method immediately and stores its return value, not a callback function.' }
    ] },
    sources: [{ label: 'MDN: this and invocation', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this' }, { label: 'TypeScript: this at runtime', url: classesUrl + '#this-at-runtime-in-classes' }]
  },
  {
    id: 'static-members', title: 'Static vs instance members', category: 'Object basics',
    definition: 'An instance member belongs to a particular object. A static member belongs to the class object. Here, each coupon has an id, while Coupon.created tracks construction through this class.',
    why: 'Distinguishing the two prevents accidentally sharing per-user state or expecting every object to have its own copy of a class-level counter.',
    when: 'Use instance state for individual objects. A static helper or counter can fit class-level behavior, but a standalone function is often equally clear for a stateless utility.',
    analogy: { story: 'Each printed ticket has its own serial number. A single numbering machine tracks the next number used by that machine.', limit: 'Two machines can have different counters. Likewise, this class-level variable is not a durable counter shared across servers, tabs or restarts.' },
    code: { language: 'TypeScript', source: staticSource, expected: '1 2 2' },
    takeaway: 'Read first.id on an instance; call Coupon.count() on the class.',
    pitfall: 'A mutable static field can become shared hidden state within this class’s execution context. It is not a database, a cross-process singleton or a safe source of globally unique identifiers.',
    interviewAnswer: 'Instance members describe each object’s state. Static members are accessed on the class. In my example, two coupons have different ids but contribute to one class-level count. That count is local to this runtime and is not a production identifier service.',
    steps: [
      frame(staticSource, 'static created = 0;', 'Initialize class-level state', 'When this class is evaluated, its static created field begins at zero. No Coupon instances have been constructed yet.', 0, [['Class object', 'Coupon.created: 0'], ['First coupon', 'not created'], ['Second coupon', 'not created']], [['Coupon.created', 'class not initialized', '0']]),
      frame(staticSource, 'Coupon.created += 1;', 'First construction updates the class', 'During new Coupon() for first, the constructor increments the class field. The following assignment will use this value for the new instance id.', 0, [['Class object', 'Coupon.created: 1'], ['First coupon', 'id not assigned yet'], ['Second coupon', 'not created']], [['Coupon.created', '0', '1']]),
      frame(staticSource, 'this.id = Coupon.created;', 'Keep an id on the first object', 'The first constructor copies the current number into first.id. Later class-counter changes do not rewrite that number on first.', 1, [['Class object', 'Coupon.created: 1'], ['First coupon', 'id: 1'], ['Second coupon', 'not created']], [['first.id', 'not assigned', '1']]),
      frame(staticSource, 'const second = new Coupon();', 'Construct another instance', 'The second constructor increments Coupon.created to two and assigns two to second.id. first.id remains one.', 2, [['Class object', 'Coupon.created: 2'], ['First coupon', 'id: 1'], ['Second coupon', 'id: 2']], [['Coupon.created', '1', '2'], ['first.id', '1', '1'], ['second.id', 'no object', '2']]),
      frame(staticSource, 'console.log(first.id, second.id, Coupon.count());', 'Read instance and class members', 'The static count method reads the class field. The log combines the two instance ids with the class-level count.', 0, [['Class method', 'Coupon.count() → 2'], ['Instance ids', 'first: 1 · second: 2'], ['Console', '1 2 2']], [['Coupon.created', '2', '2']])
    ],
    question: { prompt: 'A new browser tab loads a separate copy of this program. Should Coupon.created automatically retain the first tab’s count?', options: [
      { id: 'global', label: 'Yes: static means globally shared across every application.', correct: false, feedback: 'Static associates a member with this class object. It does not create cross-tab or cross-server storage.' },
      { id: 'readonly', label: 'Yes, because the instance id is readonly.', correct: false, feedback: 'readonly on an id does not persist or synchronize the class counter.' },
      { id: 'local', label: 'No: a separate runtime starts its own class state unless persistence is explicitly added.', correct: true, feedback: 'Correct. A class-level counter is local state, not a durable shared identifier system.' }
    ] },
    sources: [{ label: 'MDN: static members', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/static' }, { label: 'TypeScript: static members', url: classesUrl + '#static-members' }]
  },
  {
    id: 'generics', title: 'Generics: preserve a type relationship', category: 'Types & contracts',
    definition: 'A generic introduces a type parameter. Box<T> uses the same T for its stored value and read result, so callers keep useful type information while reusing one implementation.',
    why: 'A box of strings should return a string without requiring a cast. A box of numbers should support the same operations while returning a number.',
    when: 'Use a generic when types need to relate across inputs, outputs or stored values. If there is no useful relationship to preserve, a concrete type or union may be simpler.',
    analogy: { story: 'A reusable storage form has a blank for the item category. Filling in “books” tells a reader what kind of item to expect back from that form.', limit: 'The TypeScript type parameter is not a runtime label attached to each object. It is erased from the emitted JavaScript and cannot inspect untrusted data.' },
    code: { language: 'TypeScript', source: genericsSource, expected: 'READY\n4' },
    takeaway: 'T connects types during checking; the runtime still executes ordinary JavaScript values.',
    pitfall: 'Box<string> and Box<number> use one runtime class here. Generics do not validate JSON, select different machine code or prevent JavaScript callers from supplying an incorrect value. Validate untrusted inputs separately.',
    interviewAnswer: 'Generics preserve a relationship between types while sharing implementation. Box<T> stores T and returns T, so a string box gives me string operations without a cast. TypeScript erases the type parameter at runtime, so this is not a substitute for validating external data.',
    steps: [
      frame(genericsSource, 'const label = new Box<string>("Ready");', 'Type-check the string relationship', 'During TypeScript checking, T is string for this expression. The constructor value is compatible, and label.read() is known to return string. This frame describes checking, not runtime allocation.', 0, [['Type parameter', 'T = string'], ['Checker', '"Ready" fits string'], ['Known result type', 'label.read(): string']], [['phase', 'TypeScript source', 'type checking'], ['runtime objects', 'not traced yet', 'not traced yet']]),
      frame(genericsSource, 'const count = new Box<number>(3);', 'Check the numeric relationship', 'For count, T is number. The checker preserves a different relationship for this variable without defining a second runtime Box class.', 0, [['Type parameter', 'T = number'], ['Checker', '3 fits number'], ['Known result type', 'count.read(): number']], [['type-check: count.read()', 'not established', 'number']]),
      frame(genericsSource, '// Runtime JavaScript has one Box class; T is erased.', 'Move from types to runtime values', 'After type erasure, the two new expressions create two ordinary instances of the same Box class. Their stored values are Ready and 3; there is no runtime T field.', 1, [['Runtime class', 'one Box class'], ['Instances', 'label and count'], ['Stored values', '"Ready" and 3']], [['phase', 'type checking', 'illustrative runtime'], ['label.value', 'no traced instance', '"Ready"'], ['count.value', 'no traced instance', '3']]),
      frame(genericsSource, 'console.log(label.read().toUpperCase());', 'Use the returned string', 'At runtime, read returns Ready. toUpperCase returns READY, which is logged. It does not change the value stored in label.', 2, [['Instance', 'label.value: "Ready"'], ['Operation', 'read().toUpperCase()'], ['Console', 'READY']], [['label.value', '"Ready"', '"Ready"']]),
      frame(genericsSource, 'console.log(count.read() + 1);', 'Use the returned number', 'read returns 3, and addition produces 4. The box still stores 3. The type parameter helped checking; the runtime operated on the actual number.', 2, [['Instance', 'count.value: 3'], ['Operation', '3 + 1'], ['Console', '4']], [['count.value', '3', '3']])
    ],
    question: { prompt: 'An API sends malformed JSON. Does writing Box<User> automatically verify that the received value is a real User at runtime?', options: [
      { id: 'erased', label: 'No: generic type information is erased; validate the external value separately.', correct: true, feedback: 'Correct. The checker uses the declared relationship, but runtime data needs an actual validation operation.' },
      { id: 'class', label: 'Yes: a new User-specific Box runtime class is generated.', correct: false, feedback: 'This TypeScript example emits one Box class. Type parameters do not generate runtime validators.' },
      { id: 'cast', label: 'Only if the JSON is cast with as User.', correct: false, feedback: 'A type assertion changes what the checker assumes. It does not inspect or repair runtime data.' }
    ] },
    sources: [{ label: 'TypeScript: generic classes', url: genericsUrl + '#generic-classes' }, { label: 'TypeScript: erased types', url: erasedUrl }]
  },
  {
    id: 'generic-constraints', title: 'Generic constraints: ask for a capability', category: 'Types & contracts',
    definition: 'A generic constraint limits the types accepted for T. T extends { title: string } requires a title while preserving the specific input type as the return type.',
    why: 'The function needs to read a title, but callers should not lose other known fields such as minutes when the same object is returned.',
    when: 'Constrain T to the smallest shape your operation needs. Use a generic when preserving the caller’s more specific type matters; otherwise a plain parameter type may be enough.',
    analogy: { story: 'A reading desk accepts any item with a readable title. A magazine can still keep its issue number and a lesson can keep its duration when handed back.', limit: 'The constraint checks a TypeScript shape, not physical identity, business validity or actual runtime data. extends here does not require a class inheritance chain.' },
    code: { language: 'TypeScript', source: constraintsSource, expected: 'Objects\n12' },
    takeaway: 'A constraint states the minimum capability; T retains the rest of the caller’s known type.',
    pitfall: 'The constraint is erased, so it is not runtime validation. Returning only { title: item.title } would not generally satisfy T because the caller may require additional fields.',
    interviewAnswer: 'A constraint says what my generic function can safely use. keepWithTitle requires a string title and returns the original T, so a lesson keeps its minutes property. extends describes structural compatibility here, not necessarily inheritance. External data still needs runtime checking.',
    steps: [
      frame(constraintsSource, 'function keepWithTitle<T extends { title: string }>(item: T): T {', 'State the minimum type capability', 'During checking, the constraint makes item.title available as a string. Returning T promises the caller’s complete accepted type, not just the minimum title shape.', 0, [['Constraint', '{ title: string }'], ['Function', 'accept T → return T'], ['Extra fields', 'may be retained']], [['phase', 'TypeScript source', 'type checking']]),
      frame(constraintsSource, 'const kept = keepWithTitle(lesson);', 'Infer the caller’s full type', 'The checker infers a type containing title and minutes from lesson. It satisfies the title constraint, so kept also retains a known numeric minutes property.', 1, [['Input type', 'title: string · minutes: number'], ['Constraint check', 'has string title'], ['Result type', 'same inferred T']], [['type-check: kept.minutes', 'not established', 'number']]),
      frame(constraintsSource, 'console.log(item.title);', 'Read the actual runtime value', 'At runtime, the function receives lesson and logs its title, Objects. No generic constraint runs as a JavaScript validator.', 1, [['Runtime input', 'lesson object'], ['Read', 'item.title: "Objects"'], ['Console', 'Objects']], [['phase', 'type checking', 'illustrative runtime'], ['lesson.minutes', '12', '12']]),
      frame(constraintsSource, 'return item;', 'Return the same object reference', 'The function returns its input object. kept will point to the same object as lesson; no copying or field removal occurs.', 2, [['Input reference', 'lesson'], ['Return operation', 'return item'], ['Result reference', 'kept === lesson']], [['kept', 'not initialized', 'same reference as lesson']]),
      frame(constraintsSource, 'console.log(kept.minutes);', 'Use the retained field', 'The minutes field is still present at runtime and still known to the checker. The console prints 12.', 2, [['Kept object', 'title + minutes'], ['Read', 'kept.minutes: 12'], ['Console', '12']], [['lesson.minutes', '12', '12']])
    ],
    question: { prompt: 'Why does kept.minutes remain available after keepWithTitle(lesson)?', options: [
      { id: 'inherit', label: 'Every accepted object must inherit from a Title class.', correct: false, feedback: 'The constraint checks a compatible shape. No Title class appears in this example.' },
      { id: 'retained', label: 'T preserves the input type, and the function returns the same object.', correct: true, feedback: 'Correct. The constraint guarantees title, while the inferred T still includes minutes.' },
      { id: 'validator', label: 'The generic constraint adds a minutes field during runtime validation.', correct: false, feedback: 'The field was already on lesson. Constraints are erased and do not create properties or run validation.' }
    ] },
    sources: [{ label: 'TypeScript: generic constraints', url: genericsUrl + '#generic-constraints' }, { label: 'TypeScript: erased types', url: erasedUrl }]
  },
  {
    id: 'overloads', title: 'Overloads vs runtime branching', category: 'Types & contracts',
    definition: 'TypeScript overload signatures describe allowed call shapes. They share one implementation body, which must handle the runtime values itself.',
    why: 'A public API can describe distinct input combinations clearly. The signatures help callers, while an explicit check in the implementation chooses behavior.',
    when: 'Use overloads when distinct call shapes or input/output relationships need them. For this small same-return-type example, a single string | number parameter would also be reasonable.',
    analogy: { story: 'A help desk lists two accepted request forms. One clerk processes both and reads the form’s contents to decide what to do.', limit: 'TypeScript does not keep two clerks or runtime implementations. The overload declarations are erased; the remaining implementation performs the actual checks.' },
    code: { language: 'TypeScript', source: overloadsSource, expected: '#7\nREADY' },
    takeaway: 'Overload signatures describe calls; the one implementation executes them.',
    pitfall: 'Overloading is not overriding. Overriding replaces inherited behavior in a subtype. TypeScript overloads do not validate untrusted values or automatically dispatch to multiple function bodies.',
    interviewAnswer: 'Overloads describe several accepted call signatures for one TypeScript implementation. My label function accepts a number or a string, then uses typeof at runtime. A union parameter is enough here; I would prefer overloads when the call forms or return types need clearer relationships.',
    steps: [
      frame(overloadsSource, 'function label(value: string): string;', 'Describe the first accepted call', 'This declaration tells the checker that a string argument produces a string result. It has no executable function body.', 0, [['Public signature', 'string → string'], ['Type checker', 'call shape'], ['Runtime body', 'not this declaration']], [['phase', 'TypeScript source', 'type checking']]),
      frame(overloadsSource, 'function label(value: number): string;', 'Describe the other call', 'A second public signature accepts a number. The implementation below must be compatible with both declarations.', 0, [['Public signature', 'number → string'], ['Accepted calls', 'string or number'], ['Implementation', 'one shared body']], [['accepted call types', 'string', 'string or number']]),
      frame(overloadsSource, 'function label(value: string | number): string {', 'Keep one runtime implementation', 'The overload signatures and type annotations disappear from emitted JavaScript. The function body, including its typeof check, remains.', 1, [['Erased declarations', 'two overload signatures'], ['Runtime', 'one label function'], ['Branching', 'explicit typeof check']], [['phase', 'type checking', 'illustrative runtime']]),
      frame(overloadsSource, 'if (typeof value === "number") return "#" + value;', 'Handle label(7)', 'For the first runtime call, value is 7. The numeric branch returns #7, which the first console.log prints.', 1, [['Input', '7'], ['Runtime branch', 'typeof value === "number"'], ['Result', '"#7"']], [['value', '7', '7'], ['returned text', 'none for this call', '"#7"']]),
      frame(overloadsSource, 'return value.toUpperCase();', 'Handle label("ready")', 'For the second call, the numeric condition is false. The implementation uppercases the string and the second console.log prints READY.', 2, [['Input', '"ready"'], ['Runtime branch', 'string path'], ['Result', '"READY"']], [['value', '"ready"', '"ready"'], ['returned text', 'none for this call', '"READY"']])
    ],
    question: { prompt: 'What chooses the numeric behavior when the emitted JavaScript runs label(7)?', options: [
      { id: 'overload', label: 'A runtime overload registry selects a separate numeric function.', correct: false, feedback: 'TypeScript does not emit such a registry for these overloads. Only one implementation body remains.' },
      { id: 'override', label: 'A subclass overrides the string overload.', correct: false, feedback: 'There is no class hierarchy here. Overriding and overloading solve different problems.' },
      { id: 'branch', label: 'The typeof check in the single implementation.', correct: true, feedback: 'Correct. The overloads help type-check calls; the explicit branch performs runtime selection.' }
    ] },
    sources: [{ label: 'TypeScript: function overloads', url: 'https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads' }, { label: 'TypeScript: erased types', url: erasedUrl }]
  },
  {
    id: 'immutability', title: 'Immutability, readonly & copies', category: 'Types & contracts',
    definition: 'An immutable update creates a new value while preserving the old one. readonly restricts assignments during TypeScript checking; Object.freeze affects a JavaScript object at runtime but is shallow.',
    why: 'Keeping the old profile intact makes snapshots, undo and comparisons easier to reason about. It also avoids surprising other references to the original array.',
    when: 'Prefer immutable updates for state snapshots and values shared across callers. Decide which nested values must be copied; copying everything can add unnecessary work.',
    analogy: { story: 'Editing a photocopy leaves the original page unchanged. If both copies still point to the same attached notebook, writing in that notebook affects both.', limit: 'Copying an outer object is shallow. A readonly type or a frozen outer object does not automatically make every nested object immutable.' },
    code: { language: 'TypeScript', source: immutabilitySource, expected: 'learner\nlearner,mentor false\n2' },
    takeaway: 'Separate three questions: new reference, compile-time restrictions and runtime protection.',
    pitfall: 'const prevents rebinding a variable, not object mutation. TypeScript readonly does not freeze values. Object.freeze does not recursively freeze nested objects, as the final score update demonstrates.',
    interviewAnswer: 'For an immutable update, I create a new object and copy the nested array I need to change. The previous value stays intact. TypeScript readonly helps catch assignments during checking, while Object.freeze is a shallow runtime operation; neither automatically gives deep immutability.',
    steps: [
      frame(immutabilitySource, 'const first: Profile = { name: "Ana", tags: ["learner"] };', 'Create the original profile', 'first refers to an object with one tag. Its type restricts writes through this typed reference, but no runtime freezing has occurred.', 0, [['Type checking', 'readonly properties and tags'], ['Original profile', 'tags: learner'], ['New profile', 'not created']], [['first.tags', 'no profile', '["learner"]']]),
      frame(immutabilitySource, '...first, tags: [...first.tags, "mentor"]', 'Copy the changed path', 'The outer object is copied and tags is replaced with a new array containing the extra string. The original tags array is not modified.', 1, [['Original array', '["learner"]'], ['New array', '["learner", "mentor"]'], ['Object identity', 'first !== second']], [['first.tags', '["learner"]', '["learner"]'], ['second.tags', 'no new profile', '["learner", "mentor"]']]),
      frame(immutabilitySource, 'console.log(second.tags.join(","), first === second);', 'Compare the two snapshots', 'The preceding log prints learner for first. This line prints learner,mentor and false because second is a different object. Reading either snapshot does not mutate it.', 2, [['First output', 'learner'], ['Second output', 'learner,mentor'], ['Identity comparison', 'false']], [['first === second', 'false', 'false']]),
      frame(immutabilitySource, 'const frozen = Object.freeze({ nested: { score: 1 } });', 'Freeze only an outer object', 'A separate demonstration freezes the outer object referenced by frozen. The nested score object has not been frozen.', 0, [['Outer object', 'frozen at runtime'], ['Nested object', 'still mutable'], ['Nested score', '1']], [['frozen.nested.score', 'no frozen object', '1']]),
      frame(immutabilitySource, 'frozen.nested.score = 2;', 'Mutate the unfrozen nested object', 'The assignment changes score inside the nested object. It does not replace the frozen outer object’s nested property, so shallow freezing allows it.', 1, [['Outer property', 'same nested reference'], ['Nested assignment', 'score = 2'], ['Nested score', '2']], [['frozen.nested.score', '1', '2']]),
      frame(immutabilitySource, 'console.log(frozen.nested.score);', 'Observe the shallow-freeze limit', 'The final output is 2. Runtime protection of one object is different from recursively protecting every reachable object.', 2, [['Outer object', 'still frozen'], ['Nested object', 'score: 2'], ['Console', '2']], [['frozen.nested.score', '2', '2']])
    ],
    question: { prompt: 'Why can frozen.nested.score change even though Object.freeze(frozen) was used?', options: [
      { id: 'shallow', label: 'Object.freeze is shallow; the separate nested object was not frozen.', correct: true, feedback: 'Correct. The outer nested property still holds the same reference, but the object it references can change.' },
      { id: 'readonly', label: 'readonly fields automatically unfreeze objects at runtime.', correct: false, feedback: 'TypeScript readonly is erased. It neither freezes nor unfreezes runtime objects.' },
      { id: 'clone', label: 'Every property access secretly creates a deep clone.', correct: false, feedback: 'Property access returns the existing nested reference. No cloning occurs in this assignment.' }
    ] },
    sources: [{ label: 'TypeScript: readonly properties', url: 'https://www.typescriptlang.org/docs/handbook/2/objects.html#readonly-properties' }, { label: 'MDN: Object.freeze and shallow freezing', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze' }]
  },
  {
    id: 'dependency-injection', title: 'Dependency injection: supply a collaborator', category: 'Object basics',
    definition: 'Dependency injection supplies an object’s collaborator from outside instead of making the object choose and construct it internally. Here, a Session receives a Clock.',
    why: 'Time-dependent behavior becomes predictable when a test supplies a fixed clock. The session’s calculation can stay the same when a different clock is used.',
    when: 'Inject dependencies whose behavior or lifecycle matters, such as clocks, repositories and senders. A simple parameter is often enough; a container is optional.',
    analogy: { story: 'A cook is given a thermometer instead of building one inside every recipe. A training kitchen can supply a predictable demonstration thermometer.', limit: 'The collaborator must still honor its contract. Passing in an unreliable thermometer does not make the measurement correct.' },
    code: { language: 'TypeScript', source: injectionSource, expected: '500\n1200' },
    takeaway: 'Construction chooses the dependency; the consumer uses the capability it was given.',
    pitfall: 'Injection is a wiring mechanism, not automatically dependency inversion. Injecting a concrete vendor SDK can leave policy tightly coupled to that SDK. This example assumes clock readings and start use the same unit.',
    interviewAnswer: 'Dependency injection means supplying a collaborator rather than creating it inside the consumer. I inject a Clock into Session so a test can produce a predictable elapsed value. A container is optional. Depending on the small Clock contract also helps keep the policy independent of a particular time source.',
    steps: [
      frame(injectionSource, 'interface Clock { now(): number; }', 'Describe the needed capability', 'During checking, Session’s dependency must provide now() returning a number. The interface is a contract for the checker, not a runtime clock implementation.', 0, [['Contract', 'Clock.now(): number'], ['Consumer', 'Session'], ['Concrete clock', 'chosen outside']], [['phase', 'TypeScript source', 'type checking']]),
      frame(injectionSource, 'const session = new Session(fixedClock);', 'Supply a fixed collaborator', 'At runtime, the constructor stores the supplied fixedClock reference on session. The Session does not construct a clock or read time yet.', 1, [['Application setup', 'fixedClock.now() → 1500'], ['Injection', 'new Session(fixedClock)'], ['Session', 'holds fixedClock']], [['session.clock', 'no session', 'fixedClock reference']]),
      frame(injectionSource, 'elapsed(start: number) { return this.clock.now() - start; }', 'Ask the collaborator for a value', 'For session.elapsed(1000), the supplied clock returns 1500. The method subtracts the provided start, producing 500 without changing either object.', 1, [['Input', 'start: 1000'], ['Clock result', 'now(): 1500'], ['Calculation', '1500 − 1000 = 500']], [['start', '1000', '1000'], ['clock reading', '1500', '1500']]),
      frame(injectionSource, 'console.log(session.elapsed(1000));', 'Observe a predictable result', 'The first caller prints 500. Repeating this calculation with this fixed clock and the same start produces the same number.', 2, [['Session', 'same calculation'], ['Supplied clock', 'fixed 1500'], ['Console', '500']], [['returned elapsed', '500', '500']]),
      frame(injectionSource, 'console.log(later.elapsed(1000));', 'Swap the supplied behavior', 'The later session was constructed with another clock whose now() returns 2200. The unchanged elapsed method computes 1200 for the same start value.', 2, [['Other session', 'later'], ['Other clock', 'now(): 2200'], ['Console', '1200']], [['later start', '1000', '1000'], ['later elapsed', 'not yet returned', '1200']])
    ],
    question: { prompt: 'What makes this session’s elapsed calculation easy to test?', options: [
      { id: 'container', label: 'A DI container automatically verifies the calculation.', correct: false, feedback: 'No container appears here, and a container would not prove the subtraction correct.' },
      { id: 'controlled', label: 'The caller can supply a clock with a controlled result.', correct: true, feedback: 'Correct. The same calculation can be checked with known readings and a known start value.' },
      { id: 'private', label: 'A private constructor parameter stops time from changing globally.', correct: false, feedback: 'Visibility does not control time. The behavior is predictable because this supplied clock returns a fixed number.' }
    ] },
    sources: [{ label: 'Microsoft: dependency injection concepts', url: 'https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/overview' }, { label: 'TypeScript: constructor parameter properties', url: classesUrl + '#parameter-properties' }]
  },
  {
    id: 'idempotency', title: 'Idempotency: make retries safe', category: 'Reliable APIs',
    definition: 'An operation is idempotent when repeating the same intended request has the same intended state effect as doing it once. The response does not have to be identical: deleting an absent item can report a different result while leaving the same state.',
    why: 'A caller may retry after losing a response even though the first request succeeded. Repeating a state-changing operation blindly can apply its effect twice.',
    when: 'Use an idempotency design for retryable creation or payment requests. Scope the key to the authenticated caller and operation, and reuse it only for retries of the same logical request. This example demonstrates a local effect, not a production payment API.',
    analogy: { story: 'A café marks a numbered order slip as fulfilled. Showing that same slip again retrieves its recorded result instead of making a second order. Changing the order while keeping its slip number is a conflict.', limit: 'A handwritten slip can be lost, and two cashiers can read it at the same time. A real service needs a shared durable record and an atomic claim; external payments introduce a further crash window.' },
    code: { language: 'TypeScript', source: idempotencySource, expected: 'demo-0\ndemo-0\nConflict\n500' },
    takeaway: 'Retry the same intent with the same key and body; protect the effect, not just the response.',
    pitfall: 'This synchronous Map survives neither a restart nor multiple workers. A production design needs an atomic key claim, a validated request fingerprint, durable status/results and a policy for in-progress requests and expiry. A database transaction alone cannot atomically include an external payment: use the provider’s idempotency support and reconciliation for a crash after charging but before saving the result. Never promise exactly-once payment from this Map.',
    interviewAnswer: 'Idempotency keeps repeated requests from repeating the intended state effect. I would reuse a scoped key for one logical request, reject a changed body under that key, and claim the key atomically in durable storage. Equal responses are a separate API choice. With an external payment provider, I also need provider-supported deduplication and recovery for uncertain outcomes.',
    steps: [
      frame(idempotencySource, 'const previous = saved.get(key);', 'Look up the first logical request', 'For the first apply("order-7", 500), the local Map has no saved entry. The synchronous function continues to validation and then applies the effect.', 0, [['Request', 'key: order-7 · cents: 500'], ['Saved records', 'no order-7 entry'], ['Local state', 'totalCents: 0']], [['saved entries', '0', '0'], ['totalCents', '0', '0']]),
      frame(idempotencySource, 'totalCents += cents;', 'Apply the local effect once', 'The amount passed the positive-safe-integer check. This assignment adds 500 to the local total. At this exact line, the receipt has not yet been saved.', 1, [['Validated amount', '500'], ['Local effect', '0 + 500'], ['Local state', 'totalCents: 500']], [['totalCents', '0', '500'], ['saved entries', '0', '0']]),
      frame(idempotencySource, 'saved.set(key, { cents, receipt });', 'Remember the request and result', 'The function creates demo-0, stores it with cents equal to 500, then returns it. The first log prints demo-0. Production durability is deliberately absent from this teaching model.', 2, [['Request fingerprint', 'cents: 500'], ['Receipt', 'demo-0'], ['Saved record', 'order-7 → {500, demo-0}']], [['saved entries', '0', '1'], ['totalCents', '500', '500']]),
      frame(idempotencySource, 'return previous.receipt;', 'Replay the matching retry', 'The second call uses the same key and amount. The existing record matches, so it returns demo-0 before reaching the addition. The second log prints the saved receipt.', 2, [['Retry', 'order-7 · 500'], ['Match', 'same key and body'], ['Saved result', 'demo-0']], [['totalCents', '500', '500'], ['saved entries', '1', '1']]),
      frame(idempotencySource, 'if (previous.cents !== cents) throw new Error("Key/body conflict");', 'Reject changed intent under the same key', 'The third call keeps order-7 but changes cents to 700. It throws before any effect; the catch block logs Conflict. A retry must not silently change the logical request.', 1, [['Incoming body', 'cents: 700'], ['Conflict check', 'saved 500 ≠ incoming 700'], ['Local state', 'still 500']], [['totalCents', '500', '500'], ['saved cents for order-7', '500', '500']]),
      frame(idempotencySource, 'console.log(totalCents);', 'Separate effect from response policy', 'The final total is 500: one accepted effect, one replay and one conflict. This example chooses identical receipt replay; idempotency itself is about the repeated state effect.', 2, [['Accepted effect', 'one addition of 500'], ['Repeated requests', 'replay + conflict'], ['Console', '500']], [['totalCents', '500', '500']])
    ],
    question: { prompt: 'A retry uses the same idempotency key but changes the amount from 500 to 700. What should a design with a key/body consistency contract do?', options: [
      { id: 'new-charge', label: 'Apply another effect because the amount changed.', correct: false, feedback: 'That reuses one request identity for a different intent and defeats the deduplication contract.' },
      { id: 'silent', label: 'Silently return the old receipt as if 700 had been accepted.', correct: false, feedback: 'That misrepresents the accepted request. A body mismatch should be explicit under this contract.' },
      { id: 'conflict', label: 'Reject the key/body conflict without applying another effect.', correct: true, feedback: 'Correct. Use a new logical request and key only when intentionally making a different operation, not as an automatic response to an uncertain first outcome.' }
    ] },
    sources: [{ label: 'HTTP semantics: idempotent methods', url: 'https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2' }, { label: 'Stripe: provider-specific idempotent request behavior', url: 'https://docs.stripe.com/api/idempotent_requests' }, { label: 'AWS: safe retries with idempotent APIs', url: 'https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/' }]
  }
];
