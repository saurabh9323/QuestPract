import type {ReadingLesson} from '../commute-guides';

// Each lesson follows one mechanism from a concrete need to observable state.
// The learning-path UI supplies Understand / Trace / Build / Explain anchors.
export const backendPathLessons: ReadingLesson[] = [
  {
    id: 'guide-path-dotnet',
    title: '.NET: follow one scoped service through two requests',
    category: 'Learning path', topic: '.NET', format: 'Visual guide', minutes: 9,
    explanation: 'Dependency injection separates using an object from deciding when to construct it. A scoped registration reuses one instance within a scope. ASP.NET Core normally creates a scope for each HTTP request; a console application must create scopes explicitly. Transient means a new instance on resolution, while singleton means reuse across that container. Choose a lifetime by the state and collaborators the service owns, not by which registration is shortest.',
    useWhen: 'Use a request scope for collaborators that must share one unit of work during a request, such as an EF Core DbContext. The sample uses an empty RequestBasket as an identity marker; a real shopping cart needs durable storage tied to the customer.',
    example: 'A hotel receptionist creates one work folder for an arrival. The identity check and room assignment refer to that same folder; the next arrival receives another. A scope is like the folder boundary. The analogy stops at persistence: disposing a service is not saving a customer record, and a new HTTP request from the same customer still gets a new scope.',
    code: `// C# console example; install Microsoft.Extensions.DependencyInjection.
using Microsoft.Extensions.DependencyInjection;

var services = new ServiceCollection();
services.AddScoped<RequestBasket>();
using var provider = services.BuildServiceProvider(validateScopes: true);
using var requestA = provider.CreateScope();
var a1 = requestA.ServiceProvider.GetRequiredService<RequestBasket>();
var a2 = requestA.ServiceProvider.GetRequiredService<RequestBasket>();
using var requestB = provider.CreateScope();
var b = requestB.ServiceProvider.GetRequiredService<RequestBasket>();
Console.WriteLine(ReferenceEquals(a1, a2));
Console.WriteLine(ReferenceEquals(a1, b));

public sealed class RequestBasket { }`,
    output: 'Expected console output:\nTrue\nFalse\nThe explicit scopes model two request scopes; no HTTP server runs here.',
    steps: [
      {title: 'Register the lifetime', detail: 'Registration describes how the container will resolve RequestBasket; it does not create a customer cart.', state: 'Container rule: RequestBasket → scoped', line: 5},
      {title: 'Open request A', detail: 'The first resolution in scope A creates its instance.', state: 'Scope A → basket A1', line: 8},
      {title: 'Resolve again', detail: 'A second collaborator in the same scope receives the existing reference.', state: 'a1 === a2\nScope A → basket A1', line: 9},
      {title: 'Open request B', detail: 'A different scope has its own instance even while A remains alive.', state: 'Scope A → basket A1\nScope B → basket B1\na1 !== b', line: 11},
      {title: 'End the scopes', detail: 'The using declarations end their scopes; disposable services owned by those scopes would be disposed. This empty marker has no disposal work.', state: 'B closes → A closes → provider closes\nNo persistent cart was written'},
    ],
    pitfall: 'Injecting a scoped service into a singleton can retain request state beyond its intended lifetime. A background worker should create and dispose an explicit scope for each unit of work. Sharing a scope also does not make its objects safe for concurrent use.',
    interview: 'I start with ownership: which operations should share this object, and when should its resources be released? For a request unit of work I choose scoped, verify both same-scope reuse and cross-scope separation, and avoid capturing it in a singleton.',
    recall: 'Will two requests from the same signed-in customer receive the same scoped RequestBasket?',
    answer: 'Normally no. The boundary is the request scope, not customer identity. Store long-lived cart data separately and load it through each request’s collaborators.',
    questions: [
      {question: 'What changes if the sample uses AddTransient?', answer: 'Each of the three resolutions creates a different RequestBasket, so both printed comparisons become False.'},
      {question: 'What changes if it uses AddSingleton?', answer: 'All three resolutions use the container’s same instance, so both comparisons become True. Mutable per-customer data would then need a different design.'},
    ],
    exercise: {task: 'Run the identity experiment for scoped, transient and singleton registrations, then sketch the lifetime of a request-scoped database collaborator.', acceptance: ['Record the two booleans for all three registrations and explain each result.', 'Draw two request boundaries and identify which object is shared inside each.', 'Explain where durable customer state belongs and how a background worker obtains a scope.']},
    resource: 'https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/service-lifetimes',
  },
  {
    id: 'guide-path-flask',
    title: 'Flask: keep request data inside its context',
    category: 'Learning path', topic: 'Flask', format: 'Visual guide', minutes: 9,
    explanation: 'Flask’s request object is a context-local proxy: its target belongs to the active request, rather than being one shared request object for the process. Flask pushes the relevant contexts while dispatching a request and pops them afterward. The g namespace belongs to the application context; during ordinary HTTP handling that context has the request’s lifetime. It is useful for temporary request work, not cross-request storage.',
    useWhen: 'Use a request hook to obtain small request-specific values that several functions need, or to lazily attach a database connection with matching teardown. Pass plain values explicitly to work that must continue after the request.',
    example: 'A clinic receptionist puts a visitor’s preferred language on that visit’s clipboard. The doctor reads the active clipboard; the next visitor gets another. The limit: g is not a permanent patient file. Explicitly pushing a longer-lived application context can also make g live longer than this ordinary request example.',
    code: `# Python; Flask installed. These are test-client requests, not a live server.
from flask import Flask, g, request

app = Flask(__name__)

@app.before_request
def choose_language():
    g.language = request.args.get("language", "en")

@app.get("/greeting")
def greeting():
    return {"language": g.language}

@app.teardown_appcontext
def release_visit(error):
    g.pop("language", None)

client = app.test_client()
print(client.get("/greeting?language=hi").get_json())
print(client.get("/greeting").get_json())`,
    output: "Expected Python output:\n{'language': 'hi'}\n{'language': 'en'}\nThe second request uses its own default; it does not inherit hi.",
    steps: [
      {title: 'Receive the first visit', detail: 'The test client dispatches a request and Flask establishes its contexts.', state: 'Request A: /greeting?language=hi\nrequest proxy → A', line: 19},
      {title: 'Prepare local data', detail: 'The before-request hook reads A’s query string and assigns this context’s language.', state: 'A application context: g.language = hi', line: 8},
      {title: 'Build the response', detail: 'The view reads the prepared value and Flask turns the returned dictionary into JSON.', state: 'Response A: {"language":"hi"}', line: 12},
      {title: 'Tear down', detail: 'The teardown safely removes the optional value as the application context ends. It also tolerates failure before setup completed.', state: 'A context closes\nTemporary language released', line: 16},
      {title: 'Handle another visit', detail: 'B has no query parameter, so its hook selects en.', state: 'Request B → new ordinary request context\nResponse B: {"language":"en"}', line: 20},
    ],
    pitfall: 'A module-level mutable dictionary is shared process state, so it can leak one request’s values into another. A background thread cannot assume the original request proxy still points to a usable context. Teardown must tolerate partially completed setup.',
    interview: 'I distinguish a context-local proxy from a global variable. I keep temporary request dependencies within their context, write tolerant cleanup, and send explicit immutable identifiers to background jobs.',
    recall: 'Why should a queued job receive a language string instead of importing request and reading its query later?',
    answer: 'The original request may have ended, and the job has no corresponding active request context. A copied, validated language string makes the job’s input explicit.',
    questions: [
      {question: 'Does g keep a user signed in across requests?', answer: 'No. It is temporary context storage. Authentication and session persistence require their own mechanism.'},
      {question: 'Does app.test_request_context() automatically run before_request hooks?', answer: 'No. Pushing a context alone is not full request dispatch. This sample uses the test client so dispatch and hooks run.'},
    ],
    exercise: {task: 'Extend the local example with an allowed set of language codes and a helper that reads the prepared language.', acceptance: ['A hi request followed by an omitted language returns hi then en.', 'An unsupported language receives a defined response without leaving state for the next request.', 'Explain the request → hook → view → teardown sequence and why a module global is unsuitable.']},
    resource: 'https://flask.palletsprojects.com/en/stable/reqcontext/',
  },
  {
    id: 'guide-path-fastapi',
    title: 'FastAPI: overlap waiting without blocking the event loop',
    category: 'Learning path', topic: 'FastAPI', format: 'Visual guide', minutes: 10,
    explanation: 'An async route can suspend while awaiting an operation that supports asynchronous waiting. That leaves the event loop able to progress other ready work. Calling two independent operations and scheduling them with asyncio.gather lets their waits overlap. It does not put ordinary Python computation on two CPU cores, and writing async def around a blocking call does not make that call cooperative.',
    useWhen: 'Use this structure when one response needs independent results from async-capable database or HTTP clients. If one lookup needs the other lookup’s result, keep that dependency sequential. FastAPI runs plain def routes and dependencies in a thread pool; ordinary helper functions called directly do not receive that automatic treatment.',
    example: 'A travel desk requests train availability and weather, then waits for both before preparing a trip summary. It can accept another visitor while providers work. The limit: filling out a large calculation by hand still occupies the clerk; waiting cooperatively does not accelerate CPU work. The sample simulates two I/O waits and performs no external requests.',
    code: `# Python; FastAPI installed. Serve with an ASGI server.
import asyncio
from fastapi import FastAPI

app = FastAPI()

async def read_stub(value):
    await asyncio.sleep(0.01)  # Simulated nonblocking I/O.
    return value

@app.get("/trip")
async def trip():
    train, weather = await asyncio.gather(
        read_stub("available"),
        read_stub("clear"),
    )
    return {"train": train, "weather": weather}`,
    output: 'Expected HTTP result for GET /trip:\n200 {"train":"available","weather":"clear"}\nTiming is not measured here; completion order is not promised.',
    steps: [
      {title: 'Enter the route', detail: 'An ASGI request reaches the async trip handler.', state: 'Request A: needs train + weather\nBoth results absent', line: 12},
      {title: 'Schedule independent work', detail: 'gather schedules both coroutines and awaits their results in input order.', state: 'Train task: started\nWeather task: started\nA: waiting for both', line: 13},
      {title: 'Yield during I/O', detail: 'Each sleep is a stand-in for an awaitable I/O wait. Ready work from another request can progress.', state: 'Train: suspended\nWeather: suspended\nEvent loop: available for ready work', line: 8},
      {title: 'Collect completed results', detail: 'Once both tasks finish, gather supplies train first and weather second regardless of which finished first.', state: 'train = available\nweather = clear\nA: ready to resume', line: 13},
      {title: 'Return the combined view', detail: 'The handler constructs one response from the two results.', state: 'A → HTTP 200\n{"train":"available","weather":"clear"}', line: 17},
    ],
    pitfall: 'time.sleep(), a synchronous network client, or a heavy loop inside this route blocks its executing thread. Production fan-out also needs deadlines and a deliberate partial-failure policy; gather alone does not define either.',
    interview: 'I look for independent I/O waits, choose an async-capable client and await it, and bound the fan-out. I separately plan CPU work and failure handling instead of assuming async makes every operation faster.',
    recall: 'If weather requires the station returned by the train lookup, can these exact calls remain independent?',
    answer: 'No. Await the station first, then request its weather. Only work whose inputs are already known can safely start together.',
    questions: [
      {question: 'Will replacing asyncio.sleep with time.sleep preserve concurrency here?', answer: 'No. time.sleep blocks the event-loop thread instead of suspending the coroutine.'},
      {question: 'If weather finishes first, is weather assigned to train?', answer: 'No. gather returns results in the order of its input awaitables, not completion order.'},
    ],
    exercise: {task: 'Run the simulated endpoint, give the two stubs different delays, and design a deadline response for one unavailable provider.', acceptance: ['The named fields remain correct when the completion order changes.', 'Explain where the route yields and why a normal CPU loop would still block.', 'Specify whether a provider timeout fails the whole response or returns an explicit partial result; do not silently invent missing data.']},
    resource: 'https://fastapi.tiangolo.com/async/',
  },
  {
    id: 'guide-path-django',
    title: 'Django: announce a booking only after commit',
    category: 'Learning path', topic: 'Django', format: 'Visual guide', minutes: 10,
    explanation: 'transaction.atomic groups database work so an exception can roll it back. An external action performed inside the block, such as sending an email, cannot be recalled by that database rollback. Register an on_commit callback to defer the action until the enclosing transaction successfully commits. An inner atomic block completing is not necessarily the final commit: an outer transaction can still roll back.',
    useWhen: 'Use on_commit for actions such as invalidating a cache or asking a worker to process a record that must already exist. When losing the handoff after a process crash is unacceptable, persist an outbox record in the transaction and deliver it with a retrying worker.',
    example: 'A venue clerk records a reservation before telling the guest it is confirmed. Writing the name in pencil and immediately sending a message would be misleading if the clerk must erase the reservation. The limit: on_commit is an in-process callback, not a durable delivery service; a crash after commit can still prevent the message.',
    code: `# Django project example, outside any enclosing transaction.
# Assumes a migrated Booking model with a unique reference field;
# B-42 and B-43 do not already exist. Run with normal autocommit.
from django.db import transaction
from bookings.models import Booking

def confirm(reference, fail=False):
    with transaction.atomic():
        Booking.objects.create(reference=reference)
        transaction.on_commit(lambda: print("notify", reference))
        if fail:
            raise ValueError("reservation rejected")

confirm("B-42")
try:
    confirm("B-43", fail=True)
except ValueError:
    print("rolled back B-43")`,
    output: 'Expected console output under the stated setup:\nnotify B-42\nrolled back B-43\nDatabase afterward: B-42 exists; B-43 does not. No real notification is sent.',
    steps: [
      {title: 'Open the reservation transaction', detail: 'The successful call inserts B-42 inside the atomic block.', state: 'B-42: uncommitted\nCallback queue: empty', line: 9},
      {title: 'Register the announcement', detail: 'Registration stores a callable; it does not execute print yet.', state: 'B-42: uncommitted\nCallback queue: notify B-42', line: 10},
      {title: 'Commit, then announce', detail: 'The outermost block succeeds. The callback runs after the commit.', state: 'B-42: committed\nConsole: notify B-42', line: 14},
      {title: 'Fail another reservation', detail: 'B-43 raises inside its atomic block, so the row and its registered callback are discarded.', state: 'B-43: rolled back\nnotify B-43: discarded', line: 12},
      {title: 'Handle the failure outside', detail: 'The exception is handled after leaving the transaction boundary.', state: 'Database: [B-42]\nConsole adds: rolled back B-43', line: 18},
    ],
    pitfall: 'A callback exception occurs after the database commit and cannot undo it. Also, Django TestCase normally rolls back its wrapping transaction, so use captureOnCommitCallbacks or an appropriate transaction test when testing the callback behavior.',
    interview: 'I distinguish database atomicity from external delivery. on_commit prevents announcing a rolled-back row. For durable delivery I need a stored event and retry strategy, because a callback alone leaves a crash window after commit.',
    recall: 'Does an email failure in an on_commit callback remove the booking row?',
    answer: 'No. The transaction has already committed. Report or retry the external failure separately; durable handoff needs persistent state.',
    questions: [
      {question: 'When does on_commit run if no transaction is open and autocommit is enabled?', answer: 'It runs immediately, so callers must understand the surrounding transaction boundary.'},
      {question: 'What if confirm runs inside another atomic block that later fails?', answer: 'The callback waits for the outer transaction’s successful commit. If that transaction rolls back, the booking changes and callback are discarded.'},
    ],
    exercise: {task: 'Implement the Booking example in a local Django project, capturing notifications with a fake sender.', acceptance: ['A committed booking triggers exactly one fake call in the single-call experiment.', 'A deliberately rolled-back booking triggers no fake call and leaves no row.', 'Explain why the experiment does not prove durable or exactly-once notification delivery.']},
    resource: 'https://docs.djangoproject.com/en/5.2/topics/db/transactions/#performing-actions-after-commit',
  },
  {
    id: 'guide-path-express',
    title: 'Express: make every middleware branch finish or continue',
    category: 'Learning path', topic: 'Express', format: 'Visual guide', minutes: 9,
    explanation: 'Express processes matching middleware in registration order. A middleware can prepare data, end the response, or pass control onward with next(). The body parser must run before middleware that reads parsed JSON. A validation failure should end that branch; a valid request should continue exactly once. Sending a response does not itself return from your JavaScript function.',
    useWhen: 'Use an ordered middleware chain to separate input parsing, validation and endpoint work. Keep the distinction between parsing valid JSON and accepting valid application data: a JSON number is syntactically valid but is not a valid profile object here.',
    example: 'A print shop receives an order, checks that the name field is usable, and only then prepares a preview. A rejected form leaves the queue with an explanation. The limit: Express does not automatically enforce the handoff rule for you; forgetting next() can leave the client waiting, while continuing after a response can trigger another write.',
    code: `// Node.js ESM; Express installed. This endpoint previews, not persists.
import express from 'express';
const app = express();
app.use(express.json());

app.post('/profile-preview', (req, res, next) => {
  const name = req.body?.name;
  if (typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'name required' });
  }
  res.locals.name = name.trim();
  next();
}, (req, res) => {
  res.json({ preview: res.locals.name });
});

app.listen(3000);`,
    output: 'Expected HTTP examples with Content-Type: application/json:\nPOST /profile-preview {"name":"  Asha  "} → 200 {"preview":"Asha"}\nPOST /profile-preview {"name":"  "} → 400 {"error":"name required"}\nNo database write occurs.',
    steps: [
      {title: 'Parse the body', detail: 'The JSON middleware runs before the matching route handlers.', state: 'Incoming JSON → req.body = {name: "  Asha  "}', line: 4},
      {title: 'Validate shape and meaning', detail: 'The first route handler checks the value’s type and rejects a blank trimmed name.', state: 'name: string\ntrimmed name: nonempty', line: 8},
      {title: 'Stop the invalid branch', detail: 'For a blank or missing name, return sends the 400 response and exits this handler without next().', state: 'Invalid → HTTP 400 → branch complete', line: 9},
      {title: 'Continue the valid branch', detail: 'The normalized value is stored on the response-local object before passing control.', state: 'Valid → res.locals.name = Asha → next handler', line: 12},
      {title: 'Complete the preview', detail: 'The last handler produces the successful response and does not continue into another handler.', state: 'HTTP 200\n{"preview":"Asha"}', line: 14},
    ],
    pitfall: 'Calling next() after sending the 400 response lets later handlers try to respond again. A parser error also differs from this validation error: malformed JSON fails before the route and should be handled through Express’s error-handling path.',
    interview: 'I trace the chain in order and label each branch as respond, continue, or forward an error. Parsing goes before validation, and every validation rejection returns immediately so downstream work cannot run.',
    recall: 'What happens if the valid branch removes next() but sends no response?',
    answer: 'The next handler is not reached and this chain has not completed the response. The client remains waiting until some other mechanism ends the request or times it out.',
    questions: [
      {question: 'Is return the same as next()?', answer: 'No. return exits the current JavaScript function. next() asks Express to continue dispatching. In the invalid branch, returning the response call prevents further execution.'},
      {question: 'Why use res.locals instead of a shared module variable for the normalized name?', answer: 'res.locals belongs to this response cycle. A module variable would be shared between requests and could mix users’ values.'},
    ],
    exercise: {task: 'Add an optional short biography to the preview while preserving the explicit stop-or-continue branches.', acceptance: ['Valid names are trimmed and receive one 200 response.', 'Missing, non-string and whitespace-only names receive one 400 response.', 'A counter in the final handler stays unchanged for rejected requests, and each accepted request advances it once.']},
    resource: 'https://expressjs.com/en/guide/using-middleware/',
  },
  {
    id: 'guide-path-nodejs',
    title: 'Node.js: let a slow destination control stream flow',
    category: 'Learning path', topic: 'Node.js', format: 'Visual guide', minutes: 10,
    explanation: 'A producer can supply chunks faster than a destination consumes them. Backpressure communicates when the writable side has enough buffered work so upstream flow can pause and later resume. In manual writing, write() returning false means stop adding chunks until drain; it does not mean the chunk was rejected. pipeline connects streams while coordinating this flow and propagating failures.',
    useWhen: 'Use streams for exports, file copies and transformations where loading the complete payload would be wasteful. Backpressure helps only if upstream production and custom transforms respect it; retaining every processed chunk in another array would still grow memory.',
    example: 'A parcel conveyor pauses when the packing station’s waiting area fills and resumes as parcels leave. It keeps throughput limited by the packer instead of creating a growing pile. The limit: highWaterMark is a buffering threshold, not a strict whole-process memory cap, and a stream chunk is not necessarily one business record.',
    code: `// Node.js ESM example; only built-in modules are required.
import { Readable, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const source = Readable.from(['A', 'B', 'C'], { objectMode: true });
const sink = new Writable({
  objectMode: true,
  highWaterMark: 1,
  write(value, encoding, done) {
    setTimeout(() => {
      console.log('received', value);
      done();
    }, 10); // Simulated slow destination, not a performance measurement.
  }
});
await pipeline(source, sink);
console.log('finished');`,
    output: 'Expected console output:\nreceived A\nreceived B\nreceived C\nfinished\nObject mode preserves these sample values as separate chunks.',
    steps: [
      {title: 'Connect the streams', detail: 'pipeline starts feeding the readable into the writable.', state: 'Source: A, B, C\nSink: empty\nThreshold: 1 object', line: 16},
      {title: 'Accept A and signal pressure', detail: 'The sink accepts A. With its threshold reached and the asynchronous write unfinished, upstream delivery pauses.', state: 'Sink: A in flight\nFurther delivery: paused\nSource may already have buffered values', line: 9},
      {title: 'Finish A', detail: 'The custom writer reports completion by calling done once. The stream can signal that it is ready for more.', state: 'Console: received A\nSink: ready to continue', line: 12},
      {title: 'Repeat for B and C', detail: 'The same flow control repeats without starting all destination writes at once.', state: 'B accepted → completed\nC accepted → completed', line: 9},
      {title: 'Resolve the pipeline', detail: 'The awaited pipeline completes after the successful destination finish, then the final log runs.', state: 'All sample chunks processed\nConsole: finished', line: 17},
    ],
    pitfall: 'A data listener that calls sink.write(chunk) unconditionally ignores the false return signal. A custom writer must call its completion callback exactly once, with an error on failure. Do not report success before that callback represents actual completion.',
    interview: 'I identify the faster producer and slower consumer, preserve backpressure through each transform, and await pipeline so errors and completion reach the caller. I avoid treating a buffering threshold as a guaranteed memory limit.',
    recall: 'Should you send the same chunk again because write(chunk) returned false?',
    answer: 'No. The chunk was accepted into the stream’s work. Wait for readiness before sending the next chunk; resending the current one would duplicate data.',
    questions: [
      {question: 'What unit does highWaterMark use in this example?', answer: 'Objects, because objectMode is true. Byte-oriented streams use a different unit, so the value cannot be compared directly across the two modes.'},
      {question: 'What if the writer never calls done?', answer: 'That write never reports completion, so the pipeline cannot make normal progress to a successful finish.'},
    ],
    exercise: {task: 'Replace the three tokens with a generator producing many records and make the sink count them without retaining them.', acceptance: ['The final count equals the generated record count after the pipeline completes.', 'A deliberately injected sink error rejects the awaited pipeline and prevents the success message.', 'Explain why collecting all records into an array would defeat the memory goal even with a pipeline.']},
    resource: 'https://nodejs.org/learn/modules/backpressuring-in-streams',
  },
  {
    id: 'guide-path-bun',
    title: 'Bun: read an HTTP body once and reuse its value',
    category: 'Learning path', topic: 'Bun', format: 'Visual guide', minutes: 8,
    explanation: 'Bun.serve receives a web-standard Request and expects a Response or a promise for one. The request body is a consumable stream. Awaiting request.text() reads it and marks the body used; a second read of the same body is not a fresh copy. Parse or read once, then pass the resulting value to later work. Routing must also distinguish the URL path from the HTTP method.',
    useWhen: 'Use this boundary when building a small Bun HTTP service or porting code built around Request and Response. Decide who owns reading the body before adding logging, validation and handler functions that might otherwise all try to consume it.',
    example: 'A clerk opens one sealed envelope, copies its text onto a work sheet, and uses that sheet for both checking and replying. A second clerk cannot independently open the same sealed envelope again. The limit: Request.clone() can create another body branch before consumption, but duplicating streams can buffer data and is not a substitute for a body-size policy.',
    code: `// Bun runtime example. Save as server.ts and run: bun server.ts
Bun.serve({
  port: 3000,
  async fetch(request) {
    const path = new URL(request.url).pathname;
    if (path !== '/echo') return new Response('Not found', { status: 404 });
    if (request.method !== 'POST') {
      return new Response('Use POST', { status: 405, headers: { Allow: 'POST' } });
    }
    const beforeRead = request.bodyUsed;
    const text = await request.text();
    return Response.json({ beforeRead, afterRead: request.bodyUsed, echo: text });
  }
});`,
    output: 'Expected HTTP examples:\nPOST /echo with the text body hello → 200 {"beforeRead":false,"afterRead":true,"echo":"hello"}\nGET /echo → 405 with Allow: POST\nGET /missing → 404\nNo requests are made by starting the server alone.',
    steps: [
      {title: 'Accept a Request', detail: 'The fetch handler receives the incoming request; the sample POST body has not been consumed.', state: 'POST /echo\nbodyUsed = false\nBody stream: hello', line: 4},
      {title: 'Match the boundary', detail: 'The path selects the endpoint and the method check permits POST.', state: '/echo matches\nPOST allowed\nOther paths → 404; other methods here → 405', line: 7},
      {title: 'Consume once', detail: 'Await text() to obtain the complete sample body as a string.', state: 'Body stream → text = hello\nbodyUsed = true', line: 11},
      {title: 'Reuse the string', detail: 'The response builder uses the stored string instead of attempting a second body read.', state: 'text remains available\nOriginal body is already consumed', line: 12},
      {title: 'Return the response', detail: 'Bun sends the JSON Response to the caller. Returning a value here is what completes the successful request.', state: 'HTTP 200\necho = hello; afterRead = true', line: 12},
    ],
    pitfall: 'A logging helper that calls request.text() before the handler can consume its input. Avoid returning sensitive bodies in real services, enforce an appropriate size limit, and distinguish Bun-specific APIs from portable web APIs when moving runtimes.',
    interview: 'I treat the body as a stream with one owner. That owner reads and validates it, then passes the value onward. I explicitly match path and method and return a Response on every branch.',
    recall: 'Can the handler call await request.json() after the shown await request.text() to parse the same request?',
    answer: 'No. The body has been consumed. If the contract is JSON, either call json once initially or parse the already-read text with JSON.parse and handle invalid JSON.',
    questions: [
      {question: 'Why not compare request.url directly with /echo?', answer: 'request.url is an absolute URL. Parsing it and checking pathname separates the path from its origin and query string.'},
      {question: 'Does TypeScript’s annotation prove that incoming text has the intended shape?', answer: 'No. Runtime input must be validated after reading or parsing; TypeScript types do not validate an HTTP body.'},
    ],
    exercise: {task: 'Change /echo into a JSON message preview that reads its body once and validates a nonempty message string.', acceptance: ['Valid JSON produces a 200 preview after one body read.', 'Malformed JSON and a missing or blank message receive explicitly chosen client-error responses.', 'An unsupported method gets 405 with Allow: POST, and an unknown path gets 404.']},
    resource: 'https://bun.sh/docs/runtime/http/server',
  },
  {
    id: 'guide-path-sql',
    title: 'SQL: reserve the final item with one guarded update',
    category: 'Learning path', topic: 'SQL', format: 'Visual guide', minutes: 11,
    explanation: 'A read followed by an unconditional write leaves a gap: two buyers can both read stock = 1 and both decide to reserve it. Put the availability condition into the UPDATE itself, then inspect the affected rows. This lesson assumes PostgreSQL Read Committed and one inventory row per SKU. When concurrent updates target that row, the waiting updater rechecks its condition against the committed row version before applying its change.',
    useWhen: 'Use a guarded update for a single-row invariant such as stock staying nonnegative or a counter staying within a limit. If accepting a reservation also inserts an order, include those database changes in the same transaction and define request retry behavior separately.',
    example: 'A library has one remaining copy. Checking the shelf earlier is only information; handing over the book and marking it unavailable must be one controlled action. The limit: this statement protects one inventory row, not an entire shopping basket, payment, or repeated submission of the same order.',
    code: `-- PostgreSQL: sequential illustration of two reservation attempts.
-- Run in a fresh SQL session; this temporary table is session-local.
CREATE TEMP TABLE lesson_inventory (
  sku text PRIMARY KEY,
  stock integer NOT NULL CHECK (stock >= 0)
);
INSERT INTO lesson_inventory VALUES ('BOOK-1', 1);

UPDATE lesson_inventory SET stock = stock - 1
WHERE sku = 'BOOK-1' AND stock > 0
RETURNING stock;

UPDATE lesson_inventory SET stock = stock - 1
WHERE sku = 'BOOK-1' AND stock > 0
RETURNING stock;

SELECT stock FROM lesson_inventory WHERE sku = 'BOOK-1';`,
    output: 'Expected result sets, omitting client-specific command tags:\nFirst UPDATE → one row: stock = 0\nSecond UPDATE → zero rows\nFinal SELECT → one row: stock = 0\nThis sequential sample is not a concurrent database test.',
    steps: [
      {title: 'Start with one copy', detail: 'For this concurrency trace, imagine a shared table and two separate PostgreSQL sessions at Read Committed.', state: 'Committed stock = 1\nBuyer A: ready\nBuyer B: ready'},
      {title: 'A updates first', detail: 'A’s guarded update qualifies and holds the row change in its transaction.', state: 'A transaction: stock 1 → 0\nA: not yet committed', line: 9},
      {title: 'B waits on the row', detail: 'B attempts the same update while A is still modifying it; B cannot blindly apply an earlier stock value.', state: 'A owns row update\nB: waiting for A to finish', line: 13},
      {title: 'A commits; B rechecks', detail: 'After A commits, B sees the updated target row and its stock > 0 predicate no longer matches.', state: 'Committed stock = 0\nB condition: 0 > 0 → false\nB affected rows = 0', line: 14},
      {title: 'Interpret the outcome', detail: 'A may proceed with its successful reservation transaction. B reports unavailable rather than claiming success.', state: 'A: one reservation\nB: unavailable\nFinal stock = 0'},
    ],
    pitfall: 'A successful SQL command can affect zero rows; that is a business outcome to check. The guard also does not make retries idempotent: if stock were 5, repeating a successful request could decrement twice without a separate reservation key.',
    interview: 'I state the database and isolation assumptions, move the invariant into the write predicate, and inspect RETURNING or the affected-row count. I then discuss multi-row work and duplicate requests as additional requirements.',
    recall: 'Why is SELECT stock followed by SET stock = previouslyReadStock - 1 unsafe on its own?',
    answer: 'The read value may become stale before the write. Two callers can both accept the same last unit; the later write does not prove that its own reservation was still valid.',
    questions: [
      {question: 'What if A rolls back while B is waiting?', answer: 'Under the stated PostgreSQL behavior, B can continue against the original available row and may successfully decrement it.'},
      {question: 'Can both sessions share the temporary table in the sample?', answer: 'No. A real two-session experiment needs a shared disposable test table. The temporary table deliberately demonstrates only sequential outcomes.'},
    ],
    exercise: {task: 'In a disposable PostgreSQL database, create a shared inventory table and use two sessions to reproduce the wait-and-recheck trace.', acceptance: ['Pause A before commit and observe B waiting on the same row.', 'After A commits, B returns zero rows and final stock is 0.', 'Repeat with A rolling back and explain why B can succeed; state how a reservation key would address duplicate requests.']},
    resource: 'https://www.postgresql.org/docs/current/transaction-iso.html#XACT-READ-COMMITTED',
  },
  {
    id: 'guide-path-nosql',
    title: 'NoSQL with MongoDB: reject a stale document edit',
    category: 'Learning path', topic: 'NoSQL', format: 'Visual guide', minutes: 10,
    explanation: 'NoSQL is a family of database models, not one consistency contract. Here the concrete system is MongoDB, the data fits in one document, and writes use acknowledged results. An update that filters by both identity and the expected version expresses compare-and-set: change this document only if it is still the version the editor read. Increment the version in that same atomic document update and inspect matchedCount.',
    useWhen: 'Use optimistic concurrency for a profile, draft or configuration document that users may edit independently. A conflict should trigger a reload, comparison or deliberate merge; do not silently repeat a stale replacement. Separate documents require a separate atomicity decision.',
    example: 'Two editors photocopy revision 3 of a notice. The desk accepts the first corrected copy and stamps the master revision 4. The second editor must compare with revision 4 before submitting again. The limit: a version number detects a conflict but cannot decide which wording is correct or merge the edits by itself.',
    code: `// mongosh example; use a disposable collection with no _id "N-7".
db.lesson_notes.insertOne({ _id: "N-7", version: 3, title: "Draft" });
const first = db.lesson_notes.updateOne(
  { _id: "N-7", version: 3 },
  { $set: { title: "Review ready" }, $inc: { version: 1 } }
);
const second = db.lesson_notes.updateOne(
  { _id: "N-7", version: 3 },
  { $set: { title: "Publish now" }, $inc: { version: 1 } }
);
print(first.matchedCount, second.matchedCount);
printjson(db.lesson_notes.findOne({ _id: "N-7" }));`,
    output: 'Expected values after this ordered example:\nfirst.matchedCount = 1\nsecond.matchedCount = 0\nDocument: { _id: "N-7", version: 4, title: "Review ready" }\nShell formatting may differ; simultaneous writers do not have a guaranteed winner.',
    steps: [
      {title: 'Read the same revision', detail: 'In the editing scenario, both clients initially saw version 3.', state: 'Stored document: N-7, version 3, Draft\nEditor A expects 3\nEditor B expects 3'},
      {title: 'Submit A’s condition', detail: 'The identity and expected version both match, so the server can apply A’s document update.', state: 'Filter: N-7 AND version = 3\nMatch: yes', line: 4},
      {title: 'Advance the version atomically', detail: 'A changes the title and increments the version in the same document operation.', state: 'N-7 → version 4, Review ready\nA matchedCount = 1', line: 5},
      {title: 'Reject B’s stale edit', detail: 'The old version condition no longer matches; B does not overwrite A.', state: 'B expects version 3\nStored version 4\nB matchedCount = 0', line: 8},
      {title: 'Resolve with current information', detail: 'The application reads version 4 and asks the editor to reconcile. A later update must include the freshly chosen expected version.', state: 'Conflict → reload → compare → explicit new edit\nNo automatic overwrite'},
    ],
    pitfall: 'Filtering only by _id while setting a title lets a later writer overwrite an earlier edit. updateMany is not one atomic change across every matching document. This version check also does not itself establish replica freshness or the durability level of the acknowledgment.',
    interview: 'I name MongoDB and the single-document boundary before describing guarantees. I include the expected version in the write, increment it atomically, and treat a zero-match result as a conflict or missing record that needs application handling.',
    recall: 'Would the conflict check still work if both updates filtered only by _id?',
    answer: 'No. Both could match the document and the later title could replace the earlier title. The expected version must be part of the filter and changed by the update.',
    questions: [
      {question: 'Does matchedCount = 0 always prove another editor changed the document?', answer: 'No. The document might also be absent. It means the complete filter did not match; the application can read current state to distinguish relevant cases.'},
      {question: 'Should the client automatically retry with version 4 and the old entire document?', answer: 'No. That could deliberately overwrite the accepted edit. Reload and reconcile, then submit a new intended update with its expected version.'},
    ],
    exercise: {task: 'Build a local edit endpoint returning a defined conflict response when the expected version no longer matches.', acceptance: ['Two updates based on version 3 cannot both succeed; the accepted update advances the version to 4.', 'The rejected update leaves the accepted title unchanged.', 'Explain conflict recovery and distinguish this document guarantee from a multi-document transaction.']},
    resource: 'https://www.mongodb.com/docs/manual/core/write-operations-atomicity/',
  },
  {
    id: 'guide-path-system-design',
    title: 'System design: keep an order and its event together with an outbox',
    category: 'Learning path', topic: 'System design', format: 'Design answer', minutes: 12,
    explanation: 'Saving an order and publishing an event are two writes to different systems. If the process crashes between them, one can succeed without the other. A transactional outbox stores the order and an event record in the same database transaction. A separate relay publishes committed outbox records and retries unfinished delivery. A crash after publish but before marking delivery can still cause duplicate events, so the consumer needs an idempotent processing boundary.',
    useWhen: 'Use an outbox when an accepted database change must eventually produce an integration event and a broker call cannot join that database transaction. Define delivery delay, retry policy and monitoring; this design does not make downstream state immediately current.',
    example: 'A warehouse clerk files an order and a dispatch slip together in the same durable folder. A runner carries copies of pending slips to packing. If the runner forgets to mark one delivered, packing may see it twice. The limit: the analogy only works if order plus slip are committed together, and deduplication must protect the actual consumer-side database effect.',
    code: `DESIGN PSEUDOCODE — not an executable SQL script

producer transaction:
  insert order O-42
  insert outbox event E-42 { type: "OrderAccepted", order: "O-42" }
  commit both

relay:
  event = claim a pending outbox event with a retryable lease
  publish(event.id, event.payload)
  mark event delivered after the broker acknowledges

consumer transaction:
  inserted = insert processed_event(E-42) if absent
             // unique event-id constraint, transactional conflict handling
  if inserted:
    insert shipment row for O-42
  commit marker and shipment together`,
    output: 'Illustrative failure trace:\nOrder O-42 + outbox E-42 commit.\nRelay publishes E-42, then crashes before marking delivery.\nA retry publishes E-42 again.\nConsumer commits one processed marker and one shipment row; the duplicate adds neither.\nThis is not a claim of exactly-once broker delivery or physical shipping.',
    steps: [
      {title: 'Commit the intent', detail: 'One producer transaction makes both records durable, or neither record exists after rollback.', state: 'Order O-42: accepted\nOutbox E-42: pending\nBroker: empty', line: 5},
      {title: 'Publish the event', detail: 'The relay claims a record, publishes its stable event ID, and receives an acknowledgment.', state: 'Broker: E-42 accepted\nOutbox E-42: not yet marked delivered', line: 9},
      {title: 'Crash in the gap', detail: 'The relay stops before its delivery marker commits. The broker cannot be un-published by rolling back local state.', state: 'Broker retains E-42\nOutbox delivery status: pending or lease awaiting expiry'},
      {title: 'Retry with the same identity', detail: 'A recovered worker can reclaim the unfinished event and publish it again.', state: 'Broker deliveries: E-42, E-42\nStable event identity is preserved'},
      {title: 'Apply the consumer effect once', detail: 'A unique processed-event marker and the shipment row are committed in one consumer database transaction. A duplicate cannot insert a second marker.', state: 'processed_event: {E-42}\nShipment rows for this event: 1\nDuplicate: acknowledged without another row', line: 16},
    ],
    pitfall: 'Marking delivered before publish risks losing the event; publishing before marking can duplicate it. A deduplication marker committed separately from the consumer effect creates another crash gap. External carrier calls need their own idempotency strategy, and ordered events need an explicit sequencing policy.',
    interview: 'I draw the two-write failure window first. The outbox moves durable intent into the order’s transaction, while the relay handles eventual delivery. I preserve a stable event ID and atomically combine consumer deduplication with its database effect; I do not promise exactly-once transport.',
    recall: 'Why is publishing the event inside an ordinary database transaction insufficient?',
    answer: 'The broker is not automatically part of that transaction. A database rollback cannot retract a published event, and a process crash after committing the database can still prevent a later publish.',
    questions: [
      {question: 'Does an accepted order require the shipment row to exist immediately?', answer: 'Not in this asynchronous design. The product contract must allow a pending state and define an acceptable delay or recovery process.'},
      {question: 'What should operations monitor beyond the API success rate?', answer: 'Pending-event age and count, relay failures and retry volume, consumer lag, and events that repeatedly fail. A healthy order API can hide a stalled delivery path.'},
    ],
    exercise: {task: 'Model the producer, relay and consumer with local storage and inject a relay crash immediately after publishing.', acceptance: ['A failed producer transaction leaves neither an order nor an outbox record.', 'Restarting the relay eventually republishes unfinished work with the same event ID.', 'Delivering the same event twice creates one consumer shipment row, and the explanation identifies the remaining delay and external-side-effect limits.']},
    resource: 'https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html',
  },
];
