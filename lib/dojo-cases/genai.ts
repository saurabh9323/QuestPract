import type {DojoChallenge} from './types';

export const genaiCases: DojoChallenge[] = [
  {
    "id": "grounded-handbook",
    "track": "GenAI",
    "level": "Easy",
    "title": "Answers with evidence",
    "brief": "Design an assistant that answers employee handbook questions with source citations. It must decline unsupported questions.",
    "input": "Question: How many days can I carry forward? Documents include a versioned leave policy.",
    "output": "A grounded answer with document and section references, or an explicit insufficient-evidence response.",
    "concept": "RAG retrieves relevant evidence at query time. Retrieval is separate from generating an answer; neither similarity nor fluent language proves a claim.",
    "components": [
      "Question",
      "Retriever",
      "Document store",
      "Prompt builder",
      "Model",
      "Citation check"
    ],
    "flow": [
      "Question → Retriever: query and authorized document scope",
      "Document store → Retriever: permitted passages and source IDs",
      "Retriever → Prompt builder: ranked evidence",
      "Prompt builder → Model: question plus evidence",
      "Model → Citation check: answer and cited source IDs"
    ],
    "checks": [
      "Document access is checked before evidence is returned.",
      "Evidence is tied to a version and a source.",
      "Missing evidence has an explicit response.",
      "Citations are checked against retrieved passages."
    ],
    "hint": "Trace the evidence as well as the question. Where does every factual claim get its support?",
    "solution": "Keep ingestion and serving separate. Retrieve only authorized passages, assemble a bounded context, ask for evidence-linked claims and validate references. Evaluate factual support and retrieval quality on representative questions; citation presence alone is not proof.",
    "failure": "A retrieved passage contains instructions telling the assistant to ignore its rules. Treat document content as untrusted evidence, not authority.",
    "tradeoff": "Retrieving more passages may improve evidence coverage but increases context cost and distractors. Compare supported answers and abstentions on the same questions before increasing the retrieval limit."
  },
  {
    "id": "document-ingestion",
    "track": "GenAI",
    "level": "Easy",
    "title": "Build a searchable document pipeline",
    "brief": "Index policy documents that change weekly. Explain how replacements become searchable without silently mixing versions.",
    "input": "Document D7 version 3; paragraphs, headings, tenant and access metadata.",
    "output": "Searchable chunks with source, version and permissions.",
    "concept": "Chunking determines retrieval units. Embeddings encode text for similarity search; metadata preserves ownership and provenance.",
    "components": [
      "Loader",
      "Chunker",
      "Embedding service",
      "Vector index"
    ],
    "flow": [
      "Loader → Chunker: parsed text plus metadata",
      "Chunker → Embedding service: bounded chunks",
      "Embedding service → Vector index: vectors, text and source/version metadata"
    ],
    "checks": [
      "Chunk boundaries preserve meaningful context.",
      "Embedding version is recorded.",
      "Access metadata travels with every chunk.",
      "Replacement and deletion remove stale searchable content."
    ],
    "hint": "A vector without its source version and access rules is not enough.",
    "solution": "Use deterministic chunk identities within each document version. Batch embedding requests with bounded retries. Publish a completed version, then retire old chunks. Queries must enforce permissions independently of similarity ranking.",
    "failure": "Embedding fails halfway through a document. Avoid making a partial replacement look like a complete version.",
    "tradeoff": "Smaller chunks make precise matches easier but can separate a rule from its exceptions. Larger overlapping chunks preserve context while increasing embedding cost and repeated evidence."
  },
  {
    "id": "bounded-memory",
    "track": "GenAI",
    "level": "Medium",
    "title": "Conversation memory with a budget",
    "brief": "A tutor must retain important learner context while bounding the prompt size and allowing a fresh conversation.",
    "input": "Conversation with 30 turns, learner preferences and a new question.",
    "output": "A bounded prompt containing the new question, relevant recent context and clearly labelled summary.",
    "concept": "A model only sees the context supplied to a request. Summaries compress information and may omit or distort details.",
    "components": [
      "History",
      "Context selector",
      "Summary",
      "Prompt builder",
      "Model"
    ],
    "flow": [
      "History → Context selector: saved turns",
      "Summary → Prompt builder: labelled compressed context",
      "Context selector → Prompt builder: relevant recent turns",
      "Prompt builder → Model: budgeted prompt"
    ],
    "checks": [
      "The current question is preserved.",
      "Context selection stays within a stated budget.",
      "Summary is distinguished from original messages.",
      "Users can reset or correct remembered information."
    ],
    "hint": "Define what gets dropped first and how a user knows what was retained.",
    "solution": "Reserve room for instructions, the current question and output. Include bounded recent turns and a revisable summary of older material. Preserve complete history separately from the inference prompt and handle context overflow explicitly.",
    "failure": "The summary incorrectly says the user has mastered recursion. Let the learner correct it instead of treating it as permanent truth.",
    "tradeoff": "Summaries save prompt tokens but lose detail and can preserve errors. A recent-turn window keeps original wording while consuming budget that could hold older relevant facts."
  },
  {
    "id": "tool-approval",
    "track": "GenAI",
    "level": "Hard",
    "title": "An assistant that drafts before acting",
    "brief": "Design a tool-using assistant that prepares calendar changes and asks the user to approve the exact change before creating an event.",
    "input": "Schedule a study session on Friday at 6 PM; timezone and duration may be missing.",
    "output": "Clarification or a reviewable event proposal, then one confirmed event.",
    "concept": "Tool calls are structured requests to application code. Authorization, validation and idempotency belong in that code, not only in a prompt.",
    "components": [
      "Model",
      "Tool validator",
      "Approval",
      "Calendar adapter",
      "Audit log"
    ],
    "flow": [
      "Model → Tool validator: proposed event arguments",
      "Tool validator → Approval: validated proposal",
      "Approval → Calendar adapter: authorized immutable proposal",
      "Calendar adapter → Audit log: outcome and operation ID"
    ],
    "checks": [
      "Ambiguous timezones and dates are clarified.",
      "Approval applies to the exact proposal.",
      "Repeated delivery does not duplicate events.",
      "Tool permissions and server validation are enforced."
    ],
    "hint": "Separate proposing an action from permission to execute it.",
    "solution": "Validate schema and ownership server-side. Bind explicit approval to the exact parameters and operation ID. Execute with scoped credentials, persist the outcome and return it on retries. Re-approval is required after material changes.",
    "failure": "The provider creates the event but the response times out. Reconcile using operation identity before creating another event.",
    "tradeoff": "Approving the exact event adds a user step and may slow routine scheduling, but it makes the authorized action reviewable. Reusable approval scopes need narrower limits and a clear expiry."
  },
  {
    id: 'rag-release-evaluation', track: 'GenAI', level: 'Medium', title: 'Measure a retrieval change before release',
    brief: 'A policy assistant switches from paragraph chunks to overlapping sections. Design a comparison that distinguishes retrieval improvements from unsupported answers and prevents tuning on the final test set.',
    input: 'A held-out set of 80 answerable questions, 20 unanswerable questions and 10 forbidden-document probes; each answerable row names the required evidence IDs. Baseline retrieval finds all required evidence for 60 of the 80 answerable rows.',
    output: 'A baseline complete-evidence rate of 75% for answerable rows, plus separate support, abstention, permission, latency and token-cost results for both chunking strategies.',
    concept: 'Retrieval evaluation asks whether needed evidence was found; answer evaluation asks whether claims follow from evidence. A single aggregate score can hide access violations or confident unsupported answers.',
    components: ['Frozen evaluation rows', 'Baseline pipeline', 'Candidate pipeline', 'Evidence scorer', 'Answer review', 'Release gate'],
    flow: ['Frozen evaluation rows → Baseline pipeline: identical questions and document snapshot', 'Frozen evaluation rows → Candidate pipeline: same queries with only chunking changed', 'Baseline pipeline → Evidence scorer: retrieved source IDs and stage timings', 'Candidate pipeline → Answer review: answers, cited passages and token use', 'Evidence scorer → Release gate: paired results with failures grouped by cause'],
    checks: ['The 75% baseline uses 60 / 80 answerable questions, not all 110 rows.', 'Forbidden documents never enter retrieved context, even if the final answer declines.', 'Unsupported claims and correct abstentions are measured separately.', 'Tuning examples are separate from the frozen release set; latency and cost limits are explicit.'],
    hint: 'An answer can sound correct while retrieval missed a required exception. Score the evidence before asking a judge about the answer.',
    solution: 'Freeze document versions, question labels and scoring rules. Run paired baseline and candidate requests, recording retrieved IDs, claims, abstentions and latency. Check authorization before generation. Review disagreements and sample model-judge decisions manually. Report per-category changes and confidence in small samples; require no access failures and agreed quality, latency and cost bounds before release.',
    failure: 'The candidate improves answerable questions but starts inventing answers for 8 of the 20 unanswerable rows. An overall accuracy average must not conceal the abstention regression.',
    tradeoff: 'Human claim review gives stronger evidence about ambiguous answers but costs time. Automated scorers scale cheaply and consistently while needing calibration, spot checks and separate hard gates for permission failures.'
  }
];
