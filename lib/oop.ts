export type OopLesson = {
  id: string; title: string; group: 'Foundations' | 'SOLID' | 'Patterns';
  explanation: string; analogy: string; code: string; output: string;
  flow: string[]; mission: string; hints: string[]; checks: string[];
  question: string; rubric: string; pitfall: string;
};

export const oopLessons: OopLesson[] = [
  {
    id:'objects', title:'Classes, objects & identity', group:'Foundations',
    explanation:'A class describes behavior and initialization. Each new instance has its own state. Two references can point to the same object; mutating it through either reference affects that same object.',
    analogy:'Two shopping carts follow the same rules but belong to different customers.',
    code:`class Cart {
  items: string[] = [];
  add(item: string) { this.items.push(item); }
}
const first = new Cart();
const second = new Cart();
const alias = first;
alias.add("Book");
console.log(first.items.length, second.items.length);
console.log(alias === first);`, output:'1 0\ntrue',
    flow:['new Cart()','Separate instance state','Alias points to first','add("Book")','Only first changes'],
    mission:'Implement a TaskList with add and count methods. Create two lists and prove that adding to one does not change the other.',
    hints:['Initialize the array per instance, not in a shared static field.','Create an alias and predict what changes after a mutation.'],
    checks:['Two fresh lists have count 0.','Adding twice to the first produces counts 2 and 0.','Explain reference identity versus equal contents.'],
    question:'What is the difference between a class, an object, and a reference? What happens when you copy a reference?',
    rubric:'Define the blueprint, instance, and reference; explain aliasing with two separate instances and one shared reference.',
    pitfall:'A shallow copy still shares nested objects. A static mutable collection is shared by instances.'
  },
  {
    id:'encapsulation', title:'Encapsulation & invariants', group:'Foundations',
    explanation:'Encapsulation keeps state changes behind operations that enforce rules. Private fields alone are not enough: public methods must preserve the object’s invariants.',
    analogy:'An ATM lets you withdraw through a validated operation; it does not let you overwrite the balance.',
    code:`class Wallet {
  #balance = 100;
  withdraw(amount: number) {
    if (!Number.isInteger(amount) || amount <= 0 || amount > this.#balance)
      throw new Error("Invalid withdrawal");
    this.#balance -= amount;
  }
  get balance() { return this.#balance; }
}
const wallet = new Wallet();
wallet.withdraw(30);
console.log(wallet.balance);`, output:'70; withdrawing 80 next throws and leaves the balance at 70.',
    flow:['withdraw(30)','Validate amount','Check available balance','Update private state','Read balance: 70'],
    mission:'Build a wallet using integer cents. Add deposit and withdraw, rejecting negative, fractional, non-finite and excessive amounts without changing state.',
    hints:['Write “balance >= 0” before implementing methods.','Validate before mutation; return a primitive balance value.'],
    checks:['Deposit 25 into 100 → 125.','Withdraw 30 from 100 → 70.','Invalid operations leave state unchanged.'],
    question:'Why is a public balance setter weaker than deposit and withdraw methods?',
    rubric:'Explain invariants, validation, mutation boundaries and why private data is not a substitute for server authorization.',
    pitfall:'Returning a mutable internal array lets callers bypass your methods. In-memory validation also does not solve concurrent database writes.'
  },
  {
    id:'abstraction', title:'Abstraction & contracts', group:'Foundations',
    explanation:'An abstraction exposes the behavior callers need without exposing every implementation detail. Its contract includes inputs, outputs, errors and side effects.',
    analogy:'You ask a courier to deliver a parcel without choosing its sorting algorithm.',
    code:`interface Sender { send(message: string): string; }
class EmailSender implements Sender {
  send(message: string) { return "Email queued: " + message; }
}
function welcome(sender: Sender) { return sender.send("Welcome"); }
console.log(welcome(new EmailSender()));`, output:'Email queued: Welcome (demonstration only; no email is sent).',
    flow:['welcome(sender)','Sender contract','EmailSender.send','Queue acknowledgment'],
    mission:'Define a Notifier contract and implement ConsoleNotifier and RecordingNotifier. Inject either into a welcome function.',
    hints:['Callers should depend on send, not provider-specific fields.','A recording implementation can store messages for inspection.'],
    checks:['Both implementations accept the same message.','RecordingNotifier records exactly one welcome.','State whether success means queued or delivered.'],
    question:'How does abstraction differ from encapsulation? Give an example using a notification service.',
    rubric:'Abstraction chooses the exposed contract; encapsulation controls internal state and changes. Explain how both can coexist.',
    pitfall:'A vague send() contract hides important failure and delivery semantics.'
  },
  {
    id:'inheritance', title:'Inheritance & substitutability', group:'Foundations',
    explanation:'Inheritance relates a specialized type to a base type. The child must honor the promises of the base type wherever callers use it.',
    analogy:'An electric car can be a vehicle, but a bicycle should not inherit a refuel method just to reuse wheels.',
    code:`abstract class Shape { abstract area(): number; }
class Square extends Shape {
  constructor(private side: number) { super(); }
  area() { return this.side * this.side; }
}
const shape: Shape = new Square(4);
console.log(shape.area());`, output:'16',
    flow:['Shape contract','Square extends Shape','area() dispatch','16'],
    mission:'Add Circle and Rectangle to Shape. Reject negative dimensions in constructors and compute total area from a list of Shape values.',
    hints:['Each subtype implements area without callers checking its concrete type.','Document whether zero-size shapes are permitted.'],
    checks:['Square(4) returns 16.','Rectangle(3, 4) returns 12.','All accepted dimensions satisfy the same area contract.'],
    question:'When does inheritance become harmful? Explain a subclass that breaks its parent’s contract.',
    rubric:'Cover substitutability, fragile base classes, deep hierarchies and a composition alternative.',
    pitfall:'Inheritance solely for code reuse often forces methods onto objects that cannot meaningfully support them.'
  },
  {
    id:'polymorphism', title:'Polymorphism & dispatch', group:'Foundations',
    explanation:'Polymorphism lets the same operation work with different implementations through one contract. Runtime dispatch selects an implementation for the actual object.',
    analogy:'A checkout can request a payment through the same contract for a card or a wallet.',
    code:`interface PriceRule { total(cents: number): number; }
class Regular implements PriceRule { total(c: number) { return c; } }
class Sale implements PriceRule { total(c: number) { return Math.round(c * 0.9); } }
for (const rule of [new Regular(), new Sale()])
  console.log(rule.total(1000));`, output:'1000\n900',
    flow:['PriceRule reference','total(1000)','Concrete implementation','1000 or 900'],
    mission:'Add a FixedDiscount rule with a floor of zero. Pass any rule into Checkout without changing Checkout.',
    hints:['Keep branching out of Checkout.','Specify integer rounding and validate inputs at the boundary.'],
    checks:['Regular(1000) → 1000.','Sale(1000) → 900.','Discount larger than price → 0.'],
    question:'Explain overriding versus overloading. Does TypeScript overload syntax choose an implementation at runtime?',
    rubric:'Overriding supplies subtype behavior; overload signatures describe accepted calls, but a TypeScript implementation must handle them itself.',
    pitfall:'TypeScript interfaces and overload signatures disappear at runtime; they do not validate untrusted input.'
  },
  {
    id:'composition', title:'Composition vs inheritance', group:'Foundations',
    explanation:'Composition assembles an object from collaborators. It helps when capabilities vary independently and a single inheritance tree would create many combinations.',
    analogy:'A computer has a keyboard; it is not a kind of keyboard.',
    code:`interface Formatter { format(text: string): string; }
class Report {
  constructor(private formatter: Formatter) {}
  render(text: string) { return this.formatter.format(text); }
}
const report = new Report({ format: text => text.toUpperCase() });
console.log(report.render("sales"));`, output:'SALES',
    flow:['Report has Formatter','render("sales")','Delegate format','Return SALES'],
    mission:'Give Report independent formatter and delivery collaborators. Demonstrate two combinations without creating subclasses for each combination.',
    hints:['Draw “has a” arrows before writing classes.','Try the same behavior using plain functions and closures.'],
    checks:['Changing delivery does not change formatting.','Collaborators can be replaced with fakes.','Explain when a function is simpler than a class.'],
    question:'How would you implement the same feature with OOP and with function composition?',
    rubric:'Compare state ownership, dependencies, lifecycle, testing and complexity; do not claim one style is universally better.',
    pitfall:'Too many tiny wrappers can obscure simple behavior. Choose boundaries based on actual variation.'
  },
  {
    id:'contracts', title:'Interfaces vs abstract classes', group:'Foundations',
    explanation:'An interface describes a contract. An abstract class can also provide shared implementation and instance state. TypeScript interfaces are erased; abstract classes still generate JavaScript classes.',
    analogy:'A job specification lists required skills; a training base class also supplies shared tools and a routine.',
    code:`interface Report { render(): string; }
abstract class BaseReport implements Report {
  constructor(protected title: string) {}
  abstract body(): string;
  render() { return this.title + ": " + this.body(); }
}
class SalesReport extends BaseReport {
  body() { return "500 cents"; }
}
console.log(new SalesReport("Daily").render());`, output:'Daily: 500 cents',
    flow:['Report contract','BaseReport shared render','SalesReport body','Combined output'],
    mission:'Implement a TextReport and a SalesReport using the shared render routine. Then implement the Report interface with a plain object to show inheritance is optional.',
    hints:['Use an interface when the caller only needs a contract.','Use an abstract base only if shared state or implementation justifies the coupling.'],
    checks:['Both reports reuse the title formatting.','The plain object works wherever Report is expected.','Explain what still exists after TypeScript compilation.'],
    question:'When would you choose an interface instead of an abstract class in TypeScript or C#?',
    rubric:'Compare contracts, shared state, default behavior and inheritance constraints. Explain that TypeScript interfaces are erased and C# interfaces are runtime types; modern C# can include default interface implementations.',
    pitfall:'Do not assume an interface always has identical semantics across TypeScript, Python and C#.'
  },
  {
    id:'srp', title:'S · Single responsibility', group:'SOLID',
    explanation:'Keep together behavior that changes for the same reason. A service handling pricing, database storage and PDF layout has several independent reasons to change.',
    analogy:'The cashier calculates the bill; the printer formats the receipt.',
    code:`const total = (prices: number[]) => prices.reduce((a, b) => a + b, 0);
const receipt = (cents: number) => "Total cents: " + cents;
console.log(receipt(total([200, 300])));`, output:'Total cents: 500',
    flow:['Order lines','Pricing responsibility','500 cents','Receipt formatting'],
    mission:'Split an InvoiceService that calculates tax, saves invoices and formats email into three focused collaborators.',
    hints:['List who requests changes: finance, database team, design team.','Keep orchestration readable instead of splitting every line into a class.'],
    checks:['A formatting change leaves tax logic alone.','Tax behavior can be checked without a database.','Explain the responsibility of the orchestrator.'],
    question:'Does single responsibility mean a class can only have one method?',
    rubric:'No; describe one cohesive reason to change and show several methods that support it.',
    pitfall:'Method count is not a measure of responsibility.'
  },
  {
    id:'ocp', title:'O · Open/closed principle', group:'SOLID',
    explanation:'Design stable behavior so likely variations can be added through an extension point. Do not build abstractions for every imagined future change.',
    analogy:'A power socket accepts a new appliance without rewiring the room.',
    code:`type Discount = (cents: number) => number;
function checkout(cents: number, discount: Discount) { return discount(cents); }
console.log(checkout(1000, c => c - 100));
console.log(checkout(1000, c => Math.round(c * 0.8)));`, output:'900\n800',
    flow:['Stable checkout','Injected discount','New rule','Same checkout'],
    mission:'Replace a growing delivery-type switch with shipping strategies. Add pickup without editing the quote calculation.',
    hints:['Identify which part changes repeatedly.','Adding a strategy can still require a configuration or registry update.'],
    checks:['Existing shipping quotes stay the same.','Pickup costs 0.','Unsupported types produce an explicit error.'],
    question:'Does open/closed mean existing code must never change?',
    rubric:'Explain stable boundaries and extending known variation; bug fixes and evolving requirements can require modification.',
    pitfall:'A speculative plugin framework can cost more than a small switch.'
  },
  {
    id:'lsp', title:'L · Liskov substitution', group:'SOLID',
    explanation:'A replacement must preserve the observable promises of its contract. It must not demand stronger preconditions or weaken guaranteed outcomes.',
    analogy:'A substitute courier cannot accept a parcel and silently abandon the promised delivery.',
    code:`interface Reader { read(): string; }
interface Writer { write(text: string): void; }
class ReadOnlyDocument implements Reader {
  read() { return "Published"; }
}
function preview(doc: Reader) { return doc.read(); }
console.log(preview(new ReadOnlyDocument()));`, output:'Published',
    flow:['Caller needs Reader','ReadOnlyDocument','read() succeeds','Contract preserved'],
    mission:'Refactor a ReadOnlyFile subclass that throws from write(). Give readers and writers separate contracts.',
    hints:['Start with what the caller is allowed to assume.','Exceptions must also be part of the contract.'],
    checks:['Every Reader supports read.','A write-capable caller requires Writer.','Read-only objects are never passed as writers.'],
    question:'Why can a square subclass break a mutable rectangle contract with independent width and height setters?',
    rubric:'Show that setting width can unexpectedly change height; discuss immutable shapes or a smaller shared abstraction.',
    pitfall:'A relationship that is true mathematically may still violate a mutable software contract.'
  },
  {
    id:'isp', title:'I · Interface segregation', group:'SOLID',
    explanation:'Clients should depend on the capabilities they actually use. Small, cohesive contracts avoid forcing implementations to provide unrelated operations.',
    analogy:'A basic printer should not promise scanning or faxing.',
    code:`interface Printer { print(text: string): string; }
interface Scanner { scan(): string; }
function printLabel(p: Printer) { return p.print("Order 42"); }
console.log(printLabel({ print: text => "Printed: " + text }));`, output:'Printed: Order 42',
    flow:['Label client','Printer interface','print()','No scan dependency'],
    mission:'Split an AdminUserRepository with read, write, delete and export operations so a public profile page only receives read capability.',
    hints:['List each caller’s required methods.','Narrow interfaces express intent; server authorization still enforces access.'],
    checks:['Read-only callers do not require delete.','Fakes implement only the needed contract.','Authorization remains on the server.'],
    question:'How do interface segregation and single responsibility differ?',
    rubric:'ISP focuses on client dependencies; SRP focuses on cohesive reasons to change.',
    pitfall:'A TypeScript interface is not a security boundary.'
  },
  {
    id:'dip', title:'D · Dependency inversion', group:'SOLID',
    explanation:'High-level business policy should depend on a contract, with infrastructure implementing that contract. Dependency injection supplies collaborators; inversion is the architectural direction.',
    analogy:'An appliance expects a power standard rather than a specific power station.',
    code:`interface Orders { find(id: string): string; }
class OrderService {
  constructor(private orders: Orders) {}
  summary(id: string) { return this.orders.find(id); }
}
const fake: Orders = { find: id => "Order " + id };
console.log(new OrderService(fake).summary("42"));`, output:'Order 42',
    flow:['Controller','OrderService','Orders contract','Fake or database adapter'],
    mission:'Remove a hardcoded database client from OrderService. Inject an OrderRepository and a clock.',
    hints:['Put the contract near the business policy.','Wire concrete dependencies at the application boundary.'],
    checks:['The service runs against an in-memory fake.','Time-dependent results are deterministic with a fixed clock.','Database details remain in the adapter.'],
    question:'Is constructor injection the same thing as dependency inversion?',
    rubric:'Distinguish the mechanism of passing dependencies from depending on stable abstractions; a DI container is optional.',
    pitfall:'Injecting a concrete vendor SDK everywhere still couples business policy to that SDK.'
  },
  {
    id:'strategy', title:'Strategy · interchangeable behavior', group:'Patterns',
    explanation:'Strategy packages interchangeable algorithms behind one contract. It is useful when a behavior changes independently of the object using it.',
    analogy:'A route planner chooses fastest, cheapest or shortest routes.',
    code:`type Shipping = (weight: number) => number;
const standard: Shipping = kg => 50 + kg * 10;
const express: Shipping = kg => 100 + kg * 20;
const quote = (kg: number, strategy: Shipping) => strategy(kg);
console.log(quote(2, standard), quote(2, express));`, output:'70 140',
    flow:['Package weight','Selected strategy','Cost calculation','Quote'],
    mission:'Implement standard, express and pickup strategies with a shared quote function. Reject negative weights at the input boundary.',
    hints:['Functions can implement a strategy; a class is not mandatory.','Keep selection and calculation separate.'],
    checks:['Weight 2 returns 70 and 140.','Pickup returns 0.','Invalid weight is rejected.'],
    question:'When would you choose Strategy over inheritance or a switch?',
    rubric:'Discuss independent variation, runtime selection, complexity cost and testability.',
    pitfall:'A strategy changes behavior; a factory creates/selects objects. They solve different problems.'
  },
  {
    id:'factory', title:'Factory · object creation', group:'Patterns',
    explanation:'A factory centralizes construction and selection while returning a shared contract. This is a simple factory example, not the subclass-based Factory Method pattern.',
    analogy:'A restaurant counter creates your chosen meal without exposing kitchen setup.',
    code:`interface Exporter { export(text: string): string; }
function makeExporter(kind: "text" | "json"): Exporter {
  switch (kind) {
    case "text": return { export: text => text };
    case "json": return { export: text => JSON.stringify({text}) };
    default: throw new Error("Unsupported format");
  }
}
console.log(makeExporter("json").export("hello"));`, output:'{"text":"hello"}',
    flow:['Requested format','Factory selection','Exporter object','export("hello")'],
    mission:'Create a notifier factory for email and console adapters. Return a shared contract and reject unsupported runtime input.',
    hints:['Keep provider setup inside the factory.','Do not assume a TypeScript union validates an HTTP request.'],
    checks:['Each supported kind returns the expected implementation.','Unknown runtime input fails clearly.','Consumers only need the shared contract.'],
    question:'How does a simple factory differ from Factory Method and Abstract Factory?',
    rubric:'Distinguish a creation function, an overridable creation method, and families of related products.',
    pitfall:'Centralizing creation does not mean hiding global mutable dependencies.'
  },
  {
    id:'observer', title:'Observer · events & cleanup', group:'Patterns',
    explanation:'Observer lets subscribers react to an event without the publisher knowing each subscriber. Subscription lifecycle and failure behavior are part of the design.',
    analogy:'Subscribers get a newsletter when it is published and can unsubscribe later.',
    code:`class Events {
  #listeners = new Set<(message: string) => void>();
  subscribe(fn: (message: string) => void) {
    this.#listeners.add(fn);
    return () => { this.#listeners.delete(fn); };
  }
  emit(message: string) { for (const fn of this.#listeners) fn(message); }
}
const events = new Events();
const stop = events.subscribe(console.log);
events.emit("Order created");
stop(); events.emit("No listeners");`, output:'Order created (printed once).',
    flow:['Publisher emits','Subscriber registry','Callback runs','Unsubscribe cleans up'],
    mission:'Build an order event publisher with two subscribers. Unsubscribe one and specify what happens if a subscriber throws.',
    hints:['Return a cleanup function.','The sample is synchronous and stops if a listener throws; decide whether your version should isolate failures.'],
    checks:['Two subscribers each receive the first event.','Only the remaining subscriber receives the next event.','Describe memory leaks and failure policy.'],
    question:'How does an in-process observer differ from a durable message queue?',
    rubric:'Contrast lifetime, delivery, retries, persistence and process boundaries; local callbacks do not guarantee delivery.',
    pitfall:'Do not assume events are durable or exactly-once because callbacks were registered.'
  },
  {
    id:'adapter', title:'Adapter · external boundaries', group:'Patterns',
    explanation:'An adapter translates a provider’s interface into the one your application expects. Keep data conversion and provider-specific errors at that boundary.',
    analogy:'A travel plug adapter connects incompatible socket shapes through a compatible interface.',
    code:`interface Weather { celsius(): number; }
const vendor = { fahrenheit: () => 86 };
class WeatherAdapter implements Weather {
  celsius() { return (vendor.fahrenheit() - 32) * 5 / 9; }
}
console.log(new WeatherAdapter().celsius());`, output:'30',
    flow:['Application contract','Weather adapter','Vendor: 86°F','Application: 30°C'],
    mission:'Adapt a payment provider that returns status codes into your app’s success/failure result. Handle timeout separately from a confirmed decline.',
    hints:['Make units and error semantics explicit.','A timeout can mean unknown outcome; avoid blindly charging again.'],
    checks:['86°F converts to 30°C.','Provider errors map to documented application errors.','Unknown payment outcomes require reconciliation.'],
    question:'Adapter versus facade: what problem does each solve?',
    rubric:'Adapter translates an incompatible contract; facade provides a simpler entry point over a subsystem.',
    pitfall:'A useful adapter does more than rename a method when semantics or units differ.'
  },
  {
    id:'state', title:'State · valid transitions', group:'Patterns',
    explanation:'Model allowed transitions explicitly so behavior follows the current state. Small state machines can use a table; complex state-specific behavior may use separate State objects.',
    analogy:'A delivered parcel cannot become “not yet shipped” through an ordinary cancel action.',
    code:`type Status = "draft" | "paid" | "shipped";
const allowed: Record<Status, Status[]> = {
  draft: ["paid"], paid: ["shipped"], shipped: []
};
function transition(from: Status, to: Status): Status {
  if (!allowed[from].includes(to)) throw new Error("Invalid transition");
  return to;
}
console.log(transition("draft", "paid"));`, output:'paid; transition("draft", "shipped") throws.',
    flow:['Current state','Requested transition','Validate edge','Next state or error'],
    mission:'Model draft, paid, shipped and cancelled orders. Permit cancellation only before shipping and make repeated cancellation idempotent.',
    hints:['Draw the transition graph first.','Persist state changes atomically when concurrent requests are possible.'],
    checks:['Draft → shipped is rejected.','Paid → shipped succeeds.','Cancelling an already cancelled order keeps it cancelled.'],
    question:'How do you prevent two requests from applying conflicting state transitions?',
    rubric:'Explain atomic conditional updates or version checks, transactions, retries and idempotency.',
    pitfall:'An in-memory state machine does not prevent races across multiple servers.'
  }
];

export const oopCases = [
  {id:'case-checkout', title:'Checkout & payments', prompt:'Design checkout with card and wallet payments, coupons and order persistence. Handle a provider timeout without a duplicate charge.',
    nodes:['HTTP controller','CheckoutService','Payment contract','Provider adapter','Orders repository'],
    steps:['Validate the request and idempotency key.','Load order state; compute the amount on the server.','Reserve the payment attempt atomically.','Call the provider through a payment interface.','Persist confirmed outcome or reconcile unknown status.'],
    hints:['Inject PaymentGateway and OrderRepository.','A network timeout is not proof that payment failed.'],
    checks:['Class responsibilities and dependency direction','Sequence for success, decline and timeout','Atomic idempotency storage and concurrency strategy','OOP implementation compared with injected functions']},
  {id:'case-parking', title:'Parking lot · low-level design', prompt:'Design a parking lot with cars, bikes, spot allocation, tickets and hourly pricing. Two drivers may request the last spot at once.',
    nodes:['Entry request','AllocationService','Spot repository','Ticket','Pricing strategy'],
    steps:['Identify vehicle type and required spot capability.','Reserve a compatible free spot atomically.','Issue a ticket with entry time and spot ID.','On exit, calculate fee using an injected clock and pricing rule.','Close ticket and release spot with an explicit failure recovery plan.'],
    hints:['Prefer spot capabilities to a large vehicle inheritance tree.','Use integer money units and define partial-hour rounding.'],
    checks:['No double allocation under concurrent entry','Lost ticket and full-lot behavior','Deterministic pricing with a fake clock','Composition versus inheritance explanation']},
  {id:'case-learning', title:'Design your own Quest90', prompt:'Design lesson progress, immutable answer attempts, revision reminders and notifications. A second browser can save at the same time.',
    nodes:['Submit answer','LearningService','Attempt repository','Revision policy','Notification adapter'],
    steps:['Validate authenticated ownership and lesson ID.','Append an immutable attempt.','Update progress using a revision check.','Calculate the next review from the learner’s confidence.','Queue a reminder without blocking the answer save.'],
    hints:['Separate question content from learner attempts.','Keep timestamps and review policy injectable.'],
    checks:['Historical answers never get silently overwritten','Conflict behavior across two browsers','Reminder failures do not lose attempts','State diagram for learning, assisted and independent']}
];

export const walletExamples = {
  TypeScript:`class Wallet {
  #cents = 100;
  withdraw(amount: number) {
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > this.#cents)
      throw new Error("Invalid amount");
    this.#cents -= amount;
  }
  get balance() { return this.#cents; }
}
const w = new Wallet();
w.withdraw(30);
console.log(w.balance); // 70`,
  Python:`class Wallet:
    def __init__(self):
        self.__cents = 100

    def withdraw(self, amount):
        if type(amount) is not int or amount <= 0 or amount > self.__cents:
            raise ValueError("Invalid amount")
        self.__cents -= amount

    @property
    def balance(self):
        return self.__cents

w = Wallet()
w.withdraw(30)
print(w.balance)  # 70
# __cents uses name mangling, not enforced private access.`,
  'C#':`using System;

public sealed class Wallet {
    private int cents = 100;
    public int Balance => cents;
    public void Withdraw(int amount) {
        if (amount <= 0 || amount > cents)
            throw new ArgumentOutOfRangeException(nameof(amount));
        cents -= amount;
    }
}
public static class Program {
    public static void Main() {
        var wallet = new Wallet();
        wallet.Withdraw(30);
        Console.WriteLine(wallet.Balance); // 70
    }
}`
};
