export type LabControl = {
  name: string;
  label: string;
  initial: string;
  choices?: string[];
};

export type LabModel = {
  title: string;
  setup: string;
  controls: LabControl[];
  predictions: string[];
  debrief: string;
  simulate: (inputs: Record<string, string>) => LabReport;
};

export type LabReport = {
  outcome: string;
  metrics: Record<string, string | number>;
  trace: string[];
};

const choice = (name: string, label: string, choices: string[]): LabControl =>
  ({name, label, choices, initial: choices[0]});

const architecture: LabModel = {
  title: 'When the catalogue cache goes cold',
  setup: 'Model one second of catalogue reads. The database finishes up to 200 reads in that second. Excess admitted work queues for later. A gate can shed excess requests before they reach the database.',
  controls: [
    choice('traffic', 'Incoming reads per second', ['1000', '200', '2000']),
    choice('hits', 'Cache hit rate', ['0%', '90%', '100%']),
    choice('gate', 'Database admission policy', ['Forward all misses', 'Admit up to 200 misses'])
  ],
  predictions: ['All reads finish', 'Requests queue', 'Requests are shed'],
  debrief: 'What protects the database, and what will the user see when the gate is full?',
  simulate({traffic, hits, gate}) {
    const incoming = Number(traffic);
    const servedByCache = incoming * parseInt(hits, 10) / 100;
    const misses = incoming - servedByCache;
    const admitted = gate === 'Forward all misses' ? misses : Math.min(misses, 200);
    const completed = Math.min(admitted, 200);
    const queued = admitted - completed;
    const shed = misses - admitted;
    return {
      outcome: queued ? 'Requests queue' : shed ? 'Requests are shed' : 'All reads finish',
      metrics: {'Reads completed': servedByCache + completed, 'Queued': queued, 'Shed': shed},
      trace: [
        `The cache serves ${servedByCache} of ${incoming} reads. ${misses} miss.`,
        `The admission policy sends ${admitted} misses to the database and sheds ${shed}.`,
        `The database finishes ${completed} reads this second. ${queued} remain in the queue.`
      ]
    };
  }
};

const genAI: LabModel = {
  title: 'Can this handbook answer be grounded?',
  setup: 'A contractor asks how many leave days they can carry forward. A fixed ranking puts a private staff memo first, an obsolete contractor policy second, and the current contractor policy third when it exists. The two-slot prompt is filled in rank order. This is a retrieval and response policy simulation.',
  controls: [
    choice('index', 'Indexed contractor evidence', ['Current policy present', 'Current policy missing']),
    choice('scope', 'Scope before prompt assembly', ['Contractor documents only', 'All documents']),
    choice('rule', 'Response policy', ['Require current contractor policy', 'Quote first passage'])
  ],
  predictions: ['Current answer with citation', 'Abstain', 'Unsupported answer', 'Private passage exposed'],
  debrief: 'Where should access, version and factual support each be checked?',
  simulate({index, scope, rule}) {
    const passages = [
      {id: 'staff-private', days: 12},
      {id: 'contract-v1', days: 8},
      ...(index === 'Current policy present' ? [{id: 'contract-v2', days: 5}] : [])
    ];
    const allowed = scope === 'All documents' ? passages : passages.filter(p => p.id !== 'staff-private');
    const prompt = allowed.slice(0, 2);
    const answer = rule === 'Quote first passage' ? prompt[0] : prompt.find(p => p.id === 'contract-v2');
    const leak = prompt.some(p => p.id === 'staff-private');
    const response = answer ? `${answer.days} days [${answer.id}]` : 'Insufficient evidence';
    return {
      outcome: leak ? 'Private passage exposed' : !answer ? 'Abstain' :
        answer.id === 'contract-v2' ? 'Current answer with citation' : 'Unsupported answer',
      metrics: {'Passages in prompt': prompt.length, 'Response': response, 'Private passages in prompt': Number(leak)},
      trace: [
        `Ranked sources: ${passages.map(p => p.id).join(' → ')}.`,
        `After scope filtering, the first two eligible slots hold: ${prompt.map(p => p.id).join(', ')}.`,
        `The response rule returns “${response}”. ${leak ? 'The prompt already contains the private staff memo.' : 'Only contractor sources reached the prompt.'}`
      ]
    };
  }
};

const database: LabModel = {
  title: 'Reprint last month’s order',
  setup: 'Order O9 bought product P1 at 500 minor currency units per item. The invoice is reprinted after a catalogue update. A live lookup reads only active products. The order line itself is retained in every run.',
  controls: [
    choice('quantity', 'Purchased quantity', ['2', '1', '5']),
    choice('pricing', 'Invoice price source', ['Active catalogue lookup', 'Snapshot on order line']),
    choice('change', 'Catalogue event', ['Price rises to 750', 'Product is discontinued', 'No price change'])
  ],
  predictions: ['Original total retained', 'Invoice total changed', 'Invoice unavailable'],
  debrief: 'Which facts must the order own so that its invoice remains reproducible?',
  simulate({quantity, pricing, change}) {
    const units = Number(quantity);
    const current = change === 'Product is discontinued' ? null : change === 'Price rises to 750' ? 750 : 500;
    const invoicePrice = pricing === 'Snapshot on order line' ? 500 : current;
    const total = invoicePrice === null ? null : units * invoicePrice;
    return {
      outcome: total === null ? 'Invoice unavailable' : total === units * 500 ? 'Original total retained' : 'Invoice total changed',
      metrics: {'Purchase total (minor units)': units * 500, 'Reprint total (minor units)': total ?? 'Unavailable'},
      trace: [
        `O9 commits ${units} × 500 = ${units * 500}. ${pricing === 'Snapshot on order line' ? 'The line stores its purchase-time unit price.' : 'The line stores quantity and product ID only.'}`,
        current === null ? 'P1 is inactive and absent from the active-products lookup.' : `P1 is active at ${current} minor units per item.`,
        total === null ? 'The active lookup returned no price. The invoice cannot calculate a line total.' :
          `Using the selected price source, the reprint computes ${units} × ${invoicePrice} = ${total}.`
      ]
    };
  }
};

const api: LabModel = {
  title: 'Retry an order across two replicas',
  setup: 'A places order O1 for owner U with key R1. Its reply is lost. Replica B handles a second delivery from U. A shared record reserves (owner, key) and commits the order with its request fingerprint. Replica-local records are independent.',
  controls: [
    choice('identity', 'Idempotency record', ['Replica-local', 'Shared and atomic']),
    choice('retry', 'Second delivery', ['Same key and body', 'Same key, changed body', 'New key, same body']),
    choice('timing', 'When B receives the request', ['After A commits', 'While A is committing'])
  ],
  predictions: ['Return O1', 'Reject conflicting body', 'Create O2'],
  debrief: 'Which object must survive across replicas, and when can B safely return a result?',
  simulate({identity, retry, timing}) {
    const shared = identity === 'Shared and atomic';
    const sameKey = retry !== 'New key, same body';
    const sameBody = retry !== 'Same key, changed body';
    const matched = shared && sameKey;
    const waits = matched && timing === 'While A is committing';
    const outcome = !matched ? 'Create O2' : sameBody ? 'Return O1' : 'Reject conflicting body';
    const trace = [
      `A reserves U/R1 ${shared ? 'in shared storage' : 'on replica A'} for fingerprint F1.`,
      timing === 'After A commits' ? 'A commits O1 and the client loses the reply before B receives the retry.' :
        `B receives the retry before A commits. ${waits ? 'B waits on A’s reservation.' : 'B has no matching reservation to wait on.'} A commits O1 and its reply is lost.`,
      `B looks up U/${sameKey ? 'R1' : 'R2'} for fingerprint ${sameBody ? 'F1' : 'F2'}. ${matched ? 'The committed record identifies O1.' : 'B sees no record for that key.'}`,
      outcome === 'Create O2' ? 'B commits order O2, leaving two orders.' :
        outcome === 'Return O1' ? 'Fingerprints match. B replays O1 without a second write.' : 'Fingerprints differ. B returns a conflict without altering O1.'
    ];
    return {outcome, metrics: {'Committed orders': matched ? 1 : 2, 'B waited for A': waits ? 'Yes' : 'No'}, trace};
  }
};

export function readLabArray(raw: string): number[] {
  const help = 'Use a JSON array with up to 12 safe integers, for example [4, 7, 4].';
  let data: unknown;
  try { data = raw.length <= 240 && JSON.parse(raw); }
  catch { throw new Error(help); }
  if (!Array.isArray(data) || data.length > 12 || !data.every(Number.isSafeInteger)) throw new Error(help);
  return data;
}

const algorithms: LabModel = {
  title: 'Find a duplicate on a work budget',
  setup: 'One unit buys one pair comparison or one set-membership check. Each algorithm returns as soon as it finds a duplicate. Insertion uses memory but costs no units in this model. Units count selected operations, not wall-clock time.',
  controls: [
    {name: 'values', label: 'Integer array (up to 12 values)', initial: '[4, 7, 2, 9, 2]'},
    choice('strategy', 'Detector', ['Compare pairs', 'Scan with a set']),
    choice('budget', 'Work budget (units)', ['6', '0', '1', '12', '66'])
  ],
  predictions: ['Duplicate found', 'All values distinct', 'Budget exhausted'],
  debrief: 'Try moving the repeated value or removing it. Which operation counts change?',
  simulate({values, strategy, budget}) {
    const nums = readLabArray(values);
    const limit = Number(budget);
    const seen = new Set<number>();
    const trace: string[] = [];
    let work = 0;
    function report(outcome: string, last: string): LabReport {
      return {outcome, metrics: {'Units used': work, 'Budget': limit, 'Set entries': seen.size}, trace: [...trace, last]};
    }
    if (strategy === 'Scan with a set') {
      for (const [i, value] of nums.entries()) {
        if (work === limit) return report('Budget exhausted', `Stopped before checking index ${i}. The remaining input is unresolved.`);
        work++;
        if (seen.has(value)) return report('Duplicate found', `At index ${i}, ${value} is already in the set.`);
        seen.add(value);
        trace.push(`Index ${i}: ${value} was absent. Store it (${seen.size} entries).`);
      }
    } else {
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
          if (work === limit) return report('Budget exhausted', `Stopped before comparing indices ${i} and ${j}. Unchecked pairs remain.`);
          work++;
          if (nums[i] === nums[j]) return report('Duplicate found', `Indices ${i} and ${j} both contain ${nums[i]}.`);
          trace.push(`Indices ${i}, ${j}: ${nums[i]} differs from ${nums[j]}.`);
        }
      }
    }
    return report('All values distinct', 'The detector finished every required check without finding a match.');
  }
};

const lld: LabModel = {
  title: 'Guard a reservation at its expiry boundary',
  setup: 'At t=0 a seat enters Held. Its deadline is t=30, and the cleanup sweep runs at t=60. Payment should sell a seat only while the hold is valid. All commands below belong to the same hold and are processed in time order.',
  controls: [
    choice('payment', 'Payment arrives', ['At t=30', 'At t=29', 'At t=31']),
    choice('guard', 'Policy inside pay()', ['Check Held state only', 'Check Held state and deadline']),
    choice('cancel', 'Earlier command', ['None', 'Cancel at t=15'])
  ],
  predictions: ['Valid sale', 'Expired hold sold', 'Payment refused'],
  debrief: 'Which transition owns the deadline check, even if the cleanup job runs late?',
  simulate({payment, guard, cancel}) {
    const at = Number(payment.slice(-2));
    const held = cancel === 'None';
    const expired = at >= 30;
    const checksTime = guard === 'Check Held state and deadline';
    const sold = held && (!checksTime || !expired);
    const finalState = sold ? 'Sold' : held ? 'Expired' : 'Cancelled';
    return {
      outcome: !sold ? 'Payment refused' : expired ? 'Expired hold sold' : 'Valid sale',
      metrics: {'State after pay()': finalState, 'Charges': Number(sold), 'Hold deadline': 't=30'},
      trace: [
        't=0 · hold() sets state to Held and records deadline 30.',
        held ? 'No cancellation arrives. The sweep has not yet run.' : 't=15 · cancel() moves Held → Cancelled.',
        `t=${at} · pay() sees ${held ? 'Held' : 'Cancelled'}. ${checksTime ? `The guard also requires ${at} < 30.` : 'The guard reads only the stored state.'}`,
        sold ? `The object moves Held → Sold and charges once. ${expired ? 'The sale violates the deadline.' : 'The hold is still valid.'}` :
          `Payment is refused. The state is ${finalState} and no charge is made.`
      ]
    };
  }
};

const models: Record<string, LabModel> = {Architecture: architecture, GenAI: genAI, Database: database, API: api, Algorithms: algorithms, LLD: lld};

export function labForTrack(track: string): LabModel | undefined {
  return Object.hasOwn(models, track) ? models[track] : undefined;
}

export function failureRecord(recordId: string) {
  return `${recordId}-failure-lab`;
}

export function normalizeLabInputs(model: LabModel, value: unknown): Record<string,string> {
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Experiment inputs must be an object.');
  const inputs=value as Record<string,unknown>,normalized:Record<string,string>={};
  for (const {name, label, choices} of model.controls) {
    const input=inputs[name];
    if (typeof input !== 'string' || input.length>240 || (choices && !choices.includes(input))) {
      throw new Error(`Choose a valid value for ${label.toLowerCase()}.`);
    }
    normalized[name]=input;
  }
  return normalized;
}

export function runFailureLab(model: LabModel, inputs: unknown): LabReport {
  return model.simulate(normalizeLabInputs(model, inputs));
}
