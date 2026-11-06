/** Authored teaching examples. Snippets are displayed, never executed. */
export type OopEssential = {
  id: string;
  takeaway: string;
  useWhen: string;
  tradeoff: string;
  comparison: { title: string; before: string; after: string; explanation: string };
  answer: { define: string; example: string; tradeoff: string };
  quiz: {
    scenario: string;
    options: { id: string; text: string; correct: boolean; feedback: string }[];
  };
};

export const oopEssentials: OopEssential[] = [
  {
    id: 'objects',
    takeaway: 'A variable holds a reference. Copying that reference does not create a second object.',
    useWhen: 'Use an object to keep a related piece of state and the operations on it together. A class is useful when many instances follow the same rules.',
    tradeoff: 'Shared references are useful, but a mutation can surprise every caller holding that reference. Decide who owns changes.',
    comparison: {
      title: 'Two names are not two carts',
      before: 'const first = { items: ["Book"] };\nconst second = first;\nsecond.items.push("Pen");\n// first.items is now ["Book", "Pen"]',
      after: 'const first = { items: ["Book"] };\nconst second = { items: [...first.items] };\nsecond.items.push("Pen");\n// first.items is still ["Book"]',
      explanation: 'The second version copies the array of strings as well as the outer object. If the items were mutable objects, those nested objects would still be shared. Copy only as deeply as the ownership rule requires.'
    },
    answer: {
      define: 'A class describes how instances are initialized and behave. An object is one instance; a reference lets me access that object.',
      example: 'Two new carts have separate item lists. If I assign cart A to another variable, both variables refer to cart A.',
      tradeoff: 'I make shared ownership explicit, because a change through one reference is visible through the others.'
    },
    quiz: {
      scenario: 'const a = { items: ["Book"] }; const b = { ...a }; b.items.push("Pen"); What does a.items contain?',
      options: [
        { id: 'copy', text: 'Only Book: spreading always copies every nested value.', correct: false, feedback: 'Object spread copies the outer object. Here, both objects still hold the same items array reference.' },
        { id: 'shared', text: 'Book and Pen: the outer objects differ, but their array is shared.', correct: true, feedback: 'Correct. a !== b, but a.items === b.items. Distinguish object identity from the identity of its nested state.' },
        { id: 'error', text: 'An error: const prevents changes to the array.', correct: false, feedback: 'const prevents reassignment of the variable; it does not make the referenced object immutable.' }
      ]
    }
  },
  {
    id: 'encapsulation',
    takeaway: 'Write the invariant first. Every supported operation must preserve it, including operations that fail.',
    useWhen: 'Use an operation boundary when callers could otherwise create an invalid state: a negative balance, an overbooked seat or a completed task without a result.',
    tradeoff: 'A private field protects direct access, but a careless public method or leaked mutable reference can still break the rule.',
    comparison: {
      title: 'Hide the rule inside the operation',
      before: 'class Wallet {\n  balance = 100;\n}\nconst wallet = new Wallet();\nwallet.balance = -20; // invalid state is allowed',
      after: 'class Wallet {\n  #cents = 100;\n  withdraw(amount: number) {\n    if (!Number.isSafeInteger(amount) ||\n        amount <= 0 || amount > this.#cents)\n      throw new Error("Invalid withdrawal");\n    this.#cents -= amount;\n  }\n  get balance() { return this.#cents; }\n}',
      explanation: 'The invariant is an integer balance of at least zero. Validation happens before mutation. A failed withdrawal leaves the old balance intact; reading a number cannot mutate the stored balance.'
    },
    answer: {
      define: 'Encapsulation makes the object responsible for keeping its own state valid.',
      example: 'My wallet exposes withdraw rather than a public balance setter. It rejects an amount larger than the available balance before changing anything.',
      tradeoff: 'Private fields help, but I still validate every mutation and avoid returning mutable internal state.'
    },
    quiz: {
      scenario: 'A Team has a private members array, but getMembers() returns that exact array. Callers push members into it without the team’s capacity check. What fixes the boundary?',
      options: [
        { id: 'rename', text: 'Rename members to privateMembers.', correct: false, feedback: 'A name does not stop callers from mutating the array reference that was returned.' },
        { id: 'setter', text: 'Add a public setter so callers can replace the whole list.', correct: false, feedback: 'An unrestricted setter gives callers another way around the capacity rule.' },
        { id: 'snapshot', text: 'Return a safe snapshot and route additions through a validated addMember method.', correct: true, feedback: 'Correct. The operation owns the invariant. If member objects are mutable, also decide which of their fields can safely be shared in the snapshot.' }
      ]
    }
  },
  {
    id: 'abstraction',
    takeaway: 'A useful contract says what a caller may rely on: valid inputs, success, failure and side effects.',
    useWhen: 'Expose an abstraction when a caller should work with several implementations, or when the implementation detail would distract from the caller’s job.',
    tradeoff: 'A small method signature can hide ambiguity. Document whether a successful notification was recorded, queued or delivered.',
    comparison: {
      title: 'Name what success actually means',
      before: 'interface Notifier {\n  send(message: string): boolean;\n}\n// Does true mean queued, delivered or read?',
      after: 'type QueueResult =\n  | { status: "queued"; id: string }\n  | { status: "rejected"; reason: string };\ninterface Notifier {\n  // Records a request; delivery is not guaranteed.\n  enqueue(message: string): QueueResult;\n}',
      explanation: 'The caller can now distinguish acceptance from rejection and does not mistake acceptance for delivery. A real implementation would also specify allowed message sizes, duplicate handling and infrastructure failures.'
    },
    answer: {
      define: 'Abstraction exposes the behavior a caller needs while leaving implementation choices behind the boundary.',
      example: 'A welcome flow asks a Notifier to queue a message. It does not need to know how the queue stores that message.',
      tradeoff: 'The contract still needs clear failure and delivery semantics; hiding those details would make the abstraction misleading.'
    },
    quiz: {
      scenario: 'A notification adapter returns success when a message enters a queue. The checkout screen immediately says “Message delivered.” What is the main design problem?',
      options: [
        { id: 'contract', text: 'The caller assumes a stronger guarantee than the adapter’s contract provides.', correct: true, feedback: 'Correct. Display “queued” or use a separate delivery result. A method name and result should make the promise clear.' },
        { id: 'class', text: 'The adapter must inherit from the checkout class.', correct: false, feedback: 'Inheritance does not change what the queue can guarantee. Clarify the contract first.' },
        { id: 'private', text: 'The queue identifier should be a private field.', correct: false, feedback: 'Field visibility does not fix the mismatch between accepted and delivered.' }
      ]
    }
  },
  {
    id: 'inheritance',
    takeaway: 'Choose inheritance for a substitutable relationship, not just because two classes share a few lines.',
    useWhen: 'Use a base type when each subtype can keep the same behavioral promise and the shared lifecycle or implementation is useful.',
    tradeoff: 'A subclass is coupled to its base class. More hierarchy can make behavior harder to find and changes harder to isolate.',
    comparison: {
      title: 'Share only the behavior every subtype supports',
      before: 'class Bird {\n  fly() { return "flying"; }\n}\nclass Penguin extends Bird {\n  fly(): string { throw new Error("Cannot fly"); }\n}',
      after: 'interface Bird { move(): string; }\nclass Penguin implements Bird {\n  move() { return "swimming"; }\n}\nclass Sparrow implements Bird {\n  move() { return "flying"; }\n}',
      explanation: 'If Bird promised that fly succeeds, Penguin cannot safely replace it. The revised shared contract promises movement, which both implementations support. An interface can express this without sharing implementation.'
    },
    answer: {
      define: 'Inheritance specializes a base class. A subtype should work wherever the base type is expected without breaking the caller’s assumptions.',
      example: 'Shapes can share an area contract. I would not give every bird a fly operation because some birds cannot honor that promise.',
      tradeoff: 'I use composition when I only want to reuse a capability or when those capabilities vary independently.'
    },
    quiz: {
      scenario: 'An Exporter contract promises export() returns a file. A PreviewOnlyExporter subclass always throws “unsupported.” Which redesign best matches that requirement?',
      options: [
        { id: 'catch', text: 'Make every caller catch the unsupported error and inspect the concrete type.', correct: false, feedback: 'Callers would need special knowledge of the replacement. That is evidence the shared promise is wrong.' },
        { id: 'separate', text: 'Give preview a separate capability and let only export-capable objects implement Exporter.', correct: true, feedback: 'Correct. An object should not advertise a capability it never supports. If failure is allowed, distinguish operational failure from an absent capability.' },
        { id: 'empty', text: 'Return an empty string and keep the inheritance tree.', correct: false, feedback: 'An empty string does not fulfill the promised file result; it only hides the broken contract.' }
      ]
    }
  },
  {
    id: 'polymorphism',
    takeaway: 'One caller uses one operation; the object it receives supplies the behavior.',
    useWhen: 'Use polymorphism when the caller’s workflow stays the same while a meaningful operation varies, such as pricing or formatting.',
    tradeoff: 'Every implementation still needs the same behavioral contract. Removing a switch does not automatically make a design clearer.',
    comparison: {
      title: 'Let the supplied rule do the work',
      before: 'function total(kind: string, cents: number) {\n  if (kind === "regular") return cents;\n  if (kind === "sale") return Math.round(cents * 0.9);\n  throw new Error("Unknown rule");\n}',
      after: 'interface PriceRule { total(cents: number): number; }\nconst sale: PriceRule = {\n  total: cents => Math.round(cents * 0.9)\n};\nfunction checkout(cents: number, rule: PriceRule) {\n  return rule.total(cents);\n}\ncheckout(1000, sale); // 900',
      explanation: 'checkout asks the supplied object for a total. It does not identify that object by a type string. A small fixed switch can still be appropriate; this boundary is useful when rules change independently.'
    },
    answer: {
      define: 'Polymorphism lets different implementations respond to the same operation through a shared contract.',
      example: 'Checkout calls rule.total(1000). A regular rule returns 1000 and a sale rule returns 900 without changing checkout.',
      tradeoff: 'I define rounding and valid inputs consistently so replacing a rule keeps the caller’s assumptions valid.'
    },
    quiz: {
      scenario: 'Checkout receives a PriceRule. A new MemberRule satisfies the same contract. Where should the member-specific calculation live?',
      options: [
        { id: 'switch', text: 'In checkout, after checking the rule’s class name.', correct: false, feedback: 'This duplicates knowledge of concrete rules inside the caller and defeats the intended extension point.' },
        { id: 'name', text: 'In a special method that checkout calls only for members.', correct: false, feedback: 'The caller would again need to know which concrete implementation it received.' },
        { id: 'rule', text: 'In MemberRule.total, with the rule selected where checkout is configured.', correct: true, feedback: 'Correct. The composition boundary chooses the implementation; checkout only uses the shared total operation.' }
      ]
    }
  },
  {
    id: 'composition',
    takeaway: '“Has a collaborator” keeps independent choices independent. “Is a subtype” must preserve a shared promise.',
    useWhen: 'Use composition when features mix and match: a report has both a formatter and a delivery mechanism.',
    tradeoff: 'Delegation adds names and wiring. For a tiny stateless transformation, passing a function may be enough.',
    comparison: {
      title: 'Avoid a subclass for every combination',
      before: '// Two formats × two destinations = four variants.\nclass PdfEmailReport {}\nclass PdfDownloadReport {}\nclass TextEmailReport {}\nclass TextDownloadReport {}',
      after: 'type Format = (text: string) => string;\ntype Deliver = (output: string) => void;\nclass Report {\n  constructor(private format: Format,\n              private deliver: Deliver) {}\n  publish(text: string) {\n    this.deliver(this.format(text));\n  }\n}',
      explanation: 'Report coordinates two collaborators. A new destination can reuse either format. The example uses strings to focus on delegation; a real file format would define an appropriate output type.'
    },
    answer: {
      define: 'Composition builds behavior by delegating to collaborators. Inheritance specializes a base type.',
      example: 'A report has a formatter and a delivery strategy. I can change either without making a subclass for every combination.',
      tradeoff: 'I accept a little wiring for independent variation, but keep simple behavior as a function when a class adds no value.'
    },
    quiz: {
      scenario: 'A report supports 3 formats and 4 delivery destinations. A fifth destination is coming. What is the strongest reason to prefer composition here?',
      options: [
        { id: 'variation', text: 'Format and delivery vary independently, so collaborators avoid a growing combination hierarchy.', correct: true, feedback: 'Correct. Compose one format with one destination. The reason is independent variation, not a universal rule against inheritance.' },
        { id: 'speed', text: 'Composition guarantees faster runtime performance.', correct: false, feedback: 'This design choice does not guarantee faster execution. Its benefit here is organizing independent changes.' },
        { id: 'none', text: 'Composition removes all dependencies from the report.', correct: false, feedback: 'The report still depends on formatting and delivery contracts. Those dependencies become explicit.' }
      ]
    }
  },
  {
    id: 'contracts',
    takeaway: 'A contract describes what is required. A base class may also supply shared state or behavior.',
    useWhen: 'Start with the smallest capability a caller needs. Add a shared base only when its implementation and lifecycle are useful to the subtypes.',
    tradeoff: 'Sharing code through a base class also shares coupling. Do not create a hierarchy just to require a method.',
    comparison: {
      title: 'A caller can need a capability without needing a family tree',
      before: 'abstract class BaseReport {\n  abstract render(): string;\n}\nclass TextReport extends BaseReport {\n  render() { return "Ready"; }\n}',
      after: 'interface Report { render(): string; }\nconst textReport: Report = {\n  render: () => "Ready"\n};\nfunction preview(report: Report) {\n  return report.render();\n}',
      explanation: 'Here the base class had no shared behavior or state. A narrow contract is enough for preview. A base class becomes useful when there is a genuine common implementation, such as a shared rendering routine.'
    },
    answer: {
      define: 'An interface describes a contract. An abstract class can describe a contract and provide shared implementation or instance state.',
      example: 'A preview function only needs render(), so I give it a Report contract. Reports with a common rendering routine may also use a shared base class.',
      tradeoff: 'I check the language’s actual rules and choose inheritance only when the shared implementation justifies the coupling.'
    },
    quiz: {
      scenario: 'A preview function only calls render(). Three unrelated implementations can provide it, and there is no shared state or routine. What is a reasonable starting boundary?',
      options: [
        { id: 'base', text: 'A mandatory base class with fields none of the implementations need.', correct: false, feedback: 'That adds irrelevant state and coupling without helping the caller.' },
        { id: 'small', text: 'A small Report contract containing render().', correct: true, feedback: 'Correct. Describe what the caller needs. Shared implementation can be considered separately if a real common routine emerges.' },
        { id: 'any', text: 'An untyped value so every mistake can be discovered later.', correct: false, feedback: 'That gives up a useful description of the required capability. External data may still need runtime validation separately.' }
      ]
    }
  },
  {
    id: 'srp',
    takeaway: 'Responsibility follows a reason to change, not the number of methods in a class.',
    useWhen: 'Separate responsibilities when different requirements repeatedly change them independently, such as finance changing totals while design changes receipt layout.',
    tradeoff: 'Keep cohesive behavior together. Splitting each line into a new class can make one workflow harder to understand.',
    comparison: {
      title: 'Separate the policy from its presentation',
      before: 'function invoice(prices: number[]) {\n  const cents = prices.reduce((a, b) => a + b, 0);\n  return `<h1>Total: ${cents} cents</h1>`;\n}',
      after: 'const total = (prices: number[]) =>\n  prices.reduce((a, b) => a + b, 0);\nconst receipt = (cents: number) =>\n  `<h1>Total: ${cents} cents</h1>`;\nreceipt(total([200, 300])); // total policy stays separate',
      explanation: 'These tiny functions show the boundary, not a requirement to split every short function. The split becomes valuable when calculation rules and presentation have independent owners or changes.'
    },
    answer: {
      define: 'Single responsibility means keeping behavior with one cohesive reason to change together.',
      example: 'I separate invoice calculations from receipt layout so a design change does not require editing pricing rules.',
      tradeoff: 'A cohesive class may have several methods. I avoid unnecessary fragmentation and keep orchestration easy to follow.'
    },
    quiz: {
      scenario: 'InvoiceCalculator has subtotal(), tax() and total(), all maintained under one pricing policy. Is it violating SRP just because it has three methods?',
      options: [
        { id: 'three', text: 'Yes: SRP allows exactly one public method.', correct: false, feedback: 'SRP does not set a method limit. Ask which requirements cause those methods to change.' },
        { id: 'static', text: 'No, but only if all methods are static.', correct: false, feedback: 'Static versus instance methods does not determine responsibility.' },
        { id: 'cohesive', text: 'No: those methods can support one cohesive responsibility.', correct: true, feedback: 'Correct. Investigate independent reasons to change, rather than counting methods. Separate policies later if their change patterns demand it.' }
      ]
    }
  },
  {
    id: 'ocp',
    takeaway: 'Keep a stable workflow while extending a known point of variation.',
    useWhen: 'Create an extension point when a variation has become real and repeated, such as shipping quotes for different delivery methods.',
    tradeoff: 'Open/closed is relative to a particular change. Requirements, bugs and configuration can still require modifying existing code.',
    comparison: {
      title: 'Extend a rule without rewriting its caller',
      before: 'function shipping(kind: string, kg: number) {\n  if (kind === "standard") return 50 + kg * 10;\n  if (kind === "express") return 100 + kg * 20;\n  throw new Error("Unsupported method");\n}',
      after: 'type Quote = (kg: number) => number;\nconst standard: Quote = kg => 50 + kg * 10;\nconst pickup: Quote = () => 0;\nfunction shipping(kg: number, quote: Quote) {\n  return quote(kg);\n}\nshipping(2, pickup); // 0',
      explanation: 'The shipping workflow stays the same for a new rule. The application still needs to select or register pickup, and all rules must share units and input expectations. A fixed two-case switch may already be sufficient.'
    },
    answer: {
      define: 'The open/closed principle asks for stable code that can support a known variation through an extension point.',
      example: 'I pass a shipping strategy to checkout. Adding pickup creates a new strategy without rewriting the quote workflow.',
      tradeoff: 'I still change configuration, fix bugs and revise contracts when needed. I do not build a plugin system for imaginary requirements.'
    },
    quiz: {
      scenario: 'You add PickupShipping and register it in the application’s shipping choices. The quote workflow is unchanged. Does editing that registration automatically violate OCP?',
      options: [
        { id: 'boundary', text: 'No: the stable quote boundary supports the variation; wiring can still change.', correct: true, feedback: 'Correct. Identify which behavior is protected from which change. OCP is not a ban on editing any existing file.' },
        { id: 'never', text: 'Yes: no existing file may ever be modified.', correct: false, feedback: 'That interpretation would prevent fixes and normal configuration changes. OCP is about useful extension boundaries.' },
        { id: 'duplicate', text: 'Yes: duplicate checkout for pickup to avoid changing registration.', correct: false, feedback: 'Duplicating the whole workflow creates another copy to maintain and loses the stable extension point.' }
      ]
    }
  },
  {
    id: 'lsp',
    takeaway: 'A replacement must honor the behavior callers were promised, not merely have matching method names.',
    useWhen: 'Check substitutability whenever implementations share a contract. Look at accepted inputs, returned results, side effects and failures.',
    tradeoff: 'Some intuitive “is a” relationships fail for mutable APIs. A smaller capability or immutable design may express the relationship more honestly.',
    comparison: {
      title: 'Independent setters are part of the promise',
      before: '// Rectangle promises width changes preserve height.\nrectangle.setWidth(5);\nrectangle.setHeight(4);\nrectangle.setWidth(2);\n// Expected area: 8\n// A Square that also changes height would yield 4.',
      after: 'interface Shape { area(): number; }\nclass Square implements Shape {\n  constructor(private side: number) {}\n  area() { return this.side * this.side; }\n}\n// Share area(), not independent dimension setters.',
      explanation: 'The problem is the mutable rectangle contract, not the mathematical definition of a square. An area-only contract does not promise independent width and height changes. Production constructors would also validate dimensions.'
    },
    answer: {
      define: 'Liskov substitution means a replacement preserves the observable promises of the original contract.',
      example: 'A mutable rectangle promises that changing width leaves height alone. A square that changes both dimensions breaks that promise.',
      tradeoff: 'I can share a smaller area contract instead. I check inputs, outputs, errors and side effects when deciding whether substitution is safe.'
    },
    quiz: {
      scenario: 'A Parser contract accepts every nonempty string. A replacement rejects strings shorter than 10 characters, although that restriction was not in the contract. Which promise does it break?',
      options: [
        { id: 'output', text: 'It must always return the same concrete class as the original.', correct: false, feedback: 'Concrete result identity is not the stated issue. The caller was allowed to supply shorter nonempty strings.' },
        { id: 'input', text: 'It requires stronger input preconditions than callers were promised.', correct: true, feedback: 'Correct. A caller satisfying the original precondition can now fail. The replacement must accept those valid inputs or use a different contract.' },
        { id: 'none', text: 'None: matching the method name is enough.', correct: false, feedback: 'Matching signatures is not enough for behavioral substitutability. The input guarantee matters.' }
      ]
    }
  },
  {
    id: 'isp',
    takeaway: 'Give each caller the cohesive capabilities it needs; do not force unrelated promises onto implementations.',
    useWhen: 'Split a contract when clients or implementations need meaningfully different capabilities, such as reading a document versus changing it.',
    tradeoff: 'Many one-method interfaces are not automatically better. Group operations that serve the same client need, and enforce permissions separately.',
    comparison: {
      title: 'A reader should not have to pretend it can write',
      before: 'interface Documents {\n  read(): string;\n  write(text: string): void;\n  delete(): void;\n}\n// A preview caller only needs read().',
      after: 'interface Reader { read(): string; }\ninterface Writer { write(text: string): void; }\nfunction preview(document: Reader) {\n  return document.read();\n}\npreview({ read: () => "Published" });',
      explanation: 'The preview client depends on the read capability. A full implementation may support both Reader and Writer. Narrow types clarify dependencies; they do not grant or revoke server-side authorization.'
    },
    answer: {
      define: 'Interface segregation keeps clients from depending on capabilities they do not need.',
      example: 'A document preview receives a Reader, while an editor also needs a Writer. A read-only document does not implement write by throwing.',
      tradeoff: 'I keep contracts cohesive and avoid pointless fragmentation. Permissions still need enforcement at the trusted boundary.'
    },
    quiz: {
      scenario: 'A basic printer can print but cannot scan. A large Machine interface requires both methods. What is the most useful change?',
      options: [
        { id: 'throw', text: 'Implement scan() by always throwing “unsupported.”', correct: false, feedback: 'That advertises a capability the printer cannot provide and forces callers to discover the mismatch at runtime.' },
        { id: 'empty', text: 'Return an empty scan so the signature is satisfied.', correct: false, feedback: 'An empty result hides the missing capability; it does not provide the promised operation.' },
        { id: 'capability', text: 'Separate Printer and Scanner contracts; each client requests its needed capability.', correct: true, feedback: 'Correct. A multifunction device can implement both, while a basic printer only promises printing.' }
      ]
    }
  },
  {
    id: 'dip',
    takeaway: 'Business policy owns the capability it needs; infrastructure adapts to that contract.',
    useWhen: 'Invert the dependency when a business rule should remain stable while storage, time or external delivery implementations change.',
    tradeoff: 'Passing an object in is injection. It only supports inversion if the business policy depends on an appropriate abstraction, not vendor-specific details.',
    comparison: {
      title: 'Inject a business capability, not a vendor query language',
      before: 'class OrderService {\n  constructor(private db: VendorClient) {}\n  summary(id: string) {\n    return this.db.table("orders").select("summary", id);\n  }\n}\n// Injected, but still coupled to VendorClient.',
      after: 'interface Orders { summary(id: string): string; }\nclass OrderService {\n  constructor(private orders: Orders) {}\n  summary(id: string) {\n    return this.orders.summary(id);\n  }\n}\n// A vendor adapter or in-memory fake implements Orders.',
      explanation: 'VendorClient is an illustrative external dependency, not an installed API. The revised contract expresses the policy’s need. A real repository must also define missing records, asynchronous behavior and failures.'
    },
    answer: {
      define: 'Dependency inversion makes high-level policy depend on a contract rather than a low-level implementation detail.',
      example: 'OrderService needs an Orders repository. A database adapter and an in-memory fake both implement that contract, and the application wires one in.',
      tradeoff: 'Constructor injection supplies the dependency; inversion describes its direction. A dependency injection container is optional.'
    },
    quiz: {
      scenario: 'An OrderService receives a database SDK through its constructor, then uses the SDK’s vendor-specific query methods throughout its business rules. What can you conclude?',
      options: [
        { id: 'mechanism', text: 'It uses dependency injection, but the policy is still coupled to the vendor SDK.', correct: true, feedback: 'Correct. A policy-shaped repository contract would separate the business need from the SDK’s API. Passing an object alone does not establish inversion.' },
        { id: 'automatic', text: 'It automatically satisfies DIP because the constructor accepts a parameter.', correct: false, feedback: 'Injection is a wiring mechanism. The type and behavior the policy depends on determine the architectural direction.' },
        { id: 'container', text: 'It cannot satisfy DIP until a DI container is installed.', correct: false, feedback: 'Manual construction can wire an abstraction to its implementation. A container is optional.' }
      ]
    }
  }
];

export function essentialForLesson(id: string): OopEssential | undefined {
  return oopEssentials.find(lesson => lesson.id === id);
}

export type OopTraceStep = {
  label: string;
  caller: string;
  message: string;
  receiver: string;
  before: string;
  after: string;
  result: string;
  explanation: string;
};
export type OopTrace = { id: string; title: string; concept: string; steps: OopTraceStep[] };

export const oopMessageTraces: OopTrace[] = [
  {
    id: 'withdraw-success', title: 'Valid withdrawal', concept: 'Encapsulation · one object changes',
    steps: [
      { label: 'Send a message', caller: 'Checkout', message: 'walletA.withdraw(30)', receiver: 'Wallet A', before: 'A: 100 cents · B: 100 cents', after: 'A: 100 cents · B: 100 cents', result: 'No result yet', explanation: 'The caller requests an operation. Wallet B is a separate instance and does not receive this message.' },
      { label: 'Check the invariant', caller: 'Wallet A’s method', message: 'Internally validate 30 against A’s balance', receiver: 'Wallet A’s validation rule', before: 'A: 100 cents · B: 100 cents', after: 'A: 100 cents · B: 100 cents', result: 'Valid: positive integer, at most 100', explanation: 'The method checks the input before mutating state. The required invariant is a nonnegative integer balance.' },
      { label: 'Change owned state', caller: 'Wallet A’s method', message: 'Internally assign A.#cents = 100 − 30', receiver: 'Wallet A’s private state', before: 'A: 100 cents · B: 100 cents', after: 'A: 70 cents · B: 100 cents', result: 'withdraw finishes without returning a value', explanation: 'Only the receiving object changes. The invariant still holds because 70 is a nonnegative integer.' },
      { label: 'Observe the result', caller: 'Checkout', message: 'Read walletA.balance', receiver: 'Wallet A', before: 'A: 70 cents · B: 100 cents', after: 'A: 70 cents · B: 100 cents', result: 'Getter returns 70', explanation: 'The caller observes the new balance through a read operation. The getter returns a number, not a reference that can mutate private state.' }
    ]
  },
  {
    id: 'withdraw-rejected', title: 'Rejected withdrawal', concept: 'Failure · state stays valid',
    steps: [
      { label: 'Send a message', caller: 'Checkout', message: 'walletA.withdraw(120)', receiver: 'Wallet A', before: 'A: 100 cents · B: 100 cents', after: 'A: 100 cents · B: 100 cents', result: 'No result yet', explanation: 'This independent scenario starts both wallets at 100 cents. Predict which object changes before moving on.' },
      { label: 'Reject before mutation', caller: 'Wallet A’s method', message: '120 > 100 → throw “Invalid withdrawal”', receiver: 'Checkout’s error handler', before: 'A: 100 cents · B: 100 cents', after: 'A: 100 cents · B: 100 cents', result: 'Throws “Invalid withdrawal”', explanation: 'The amount exceeds the available balance. The method fails before assignment, so neither wallet changes.' },
      { label: 'Handle the failure', caller: 'Checkout', message: 'Catch the error; show rejection', receiver: 'Caller handles the error', before: 'A: 100 cents · B: 100 cents', after: 'A: 100 cents · B: 100 cents', result: 'No withdrawal completed', explanation: 'The caller handles the documented failure. The UI may explain the rejection, but it must not pretend the operation succeeded.' }
    ]
  },
  {
    id: 'price-rule', title: 'Choose a price rule', concept: 'Composition + polymorphism · delegated behavior',
    steps: [
      { label: 'Wire a collaborator', caller: 'Application setup', message: 'Give checkout the Sale rule', receiver: 'Checkout', before: 'Price: 1000 cents · rule: unselected', after: 'Price: 1000 cents · rule: Sale', result: 'A PriceRule collaborator is selected', explanation: 'The application chooses the concrete rule. Checkout only needs a total(cents) operation; it does not need to identify the class.' },
      { label: 'Delegate the operation', caller: 'Checkout', message: 'rule.total(1000)', receiver: 'Sale rule', before: 'Price: 1000 cents · rule: Sale', after: 'Price: 1000 cents · rule: Sale', result: 'Sale computes round(1000 × 0.9)', explanation: 'The same operation can be sent to Regular or Sale. The supplied object determines the behavior.' },
      { label: 'Return a value', caller: 'Sale rule', message: 'return 900', receiver: 'Checkout', before: 'Price: 1000 cents · rule: Sale', after: 'Price: 1000 cents · rule: Sale', result: 'Returns 900 cents; no stored price changes', explanation: 'This rule returns a value without mutating the input or charging a payment. Polymorphism does not require mutation or a class hierarchy.' }
    ]
  }
];
