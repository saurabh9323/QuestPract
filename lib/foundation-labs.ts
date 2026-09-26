export type CommandLesson={command:string;meaning:string;use:string;output:string};
export const commandLessons:CommandLesson[]=[
 {command:'pwd',meaning:'Print working directory',use:'Check where relative paths start.',output:'/home/learner/app'},
 {command:'ls',meaning:'List visible entries',use:'See files and directories.',output:'README.md  app.log  logs  server.js'},
 {command:'ls -la',meaning:'Include hidden entries and metadata',use:'Inspect ownership and permission bits.',output:'drwxr-xr-x learner learner logs\n-rw-r--r-- learner learner README.md\n-rw-r----- learner learner app.log\n-rw-r--r-- learner learner server.js\n-rw------- learner learner .env.example'},
 {command:'cd logs',meaning:'Change current directory',use:'Navigate using a relative path.',output:''},
 {command:'cd ..',meaning:'Go to the parent directory',use:'Move up one directory.',output:''},
 {command:'cat README.md',meaning:'Print a small file',use:'Read setup instructions.',output:'Quest90 sample service\nStart with: node server.js\nThe example server listens on port 3000.'},
 {command:'head -n 2 app.log',meaning:'Show the first two lines',use:'Inspect the beginning of a file.',output:'INFO boot\nINFO listening port=3000'},
 {command:'tail -n 2 app.log',meaning:'Show the last two lines',use:'Inspect recent entries.',output:'ERROR database timeout\nINFO retry succeeded'},
 {command:'grep ERROR app.log',meaning:'Select matching lines',use:'Find logged error events.',output:'ERROR database timeout'},
 {command:'grep ERROR app.log | wc -l',meaning:'Filter, then count matching lines',use:'Compose tools with a pipe.',output:'1'},
 {command:'wc -l app.log',meaning:'Count newline-terminated lines',use:'Measure a text file’s length.',output:'4 app.log'},
 {command:'find . -name "*.log"',meaning:'Find paths by name',use:'Locate log files under the current directory.',output:'./app.log'},
 {command:'whoami',meaning:'Display the effective username',use:'Understand the active identity.',output:'learner'},
 {command:'uname -s',meaning:'Display the kernel name',use:'Identify the kernel family.',output:'Linux'},
 {command:'cat /etc/os-release',meaning:'Read distribution metadata',use:'Identify the distribution before selecting package commands.',output:'NAME="Quest90 teaching fixture"\nID=quest90\n# Fictional sample, not your machine.'},
 {command:'ps -ef',meaning:'Inspect processes',use:'Look for a running service and its parent.',output:'UID       PID PPID CMD\nlearner   100    1 node server.js'},
 {command:'top',meaning:'Interactive resource monitor',use:'Observe CPU and memory use over time.',output:'Static teaching snapshot: node server.js CPU=3% MEM=2%\nReal top refreshes interactively; this preview does not.'},
 {command:'free -h',meaning:'Summarize memory',use:'Inspect memory pressure and available memory.',output:'Sample: Mem total=8Gi used=3Gi available=5Gi'},
 {command:'df -h',meaning:'Summarize filesystem space',use:'Look for a full filesystem.',output:'Filesystem Size Used Avail Use% Mounted on\n/dev/mock    40G  12G   28G  30% /'},
 {command:'ss -ltn',meaning:'List listening TCP sockets numerically',use:'Check whether a TCP service is listening.',output:'LISTEN 0 128 127.0.0.1:3000 0.0.0.0:*'},
 {command:'curl -I https://example.com',meaning:'Request HTTP response headers using HEAD',use:'Inspect headers/status without a response body.',output:'Illustrative response only; no network request was made.\nHTTP/2 200\ncontent-type: text/html'},
 {command:'journalctl -u myapp',meaning:'Read a systemd service journal',use:'Inspect service logs on systems that use systemd.',output:'Preview: myapp started\nRequires a matching systemd service on a real machine.'},
 {command:'chmod u+x deploy.sh',meaning:'Add owner execute permission',use:'Make a script executable for its owner.',output:'Preview only: owner execute permission would be added; no file changed.'},
 {command:'mkdir notes',meaning:'Create a directory',use:'Organize files.',output:'Preview only: would create notes; fixture unchanged.'},
 {command:'cp README.md notes.md',meaning:'Copy a file',use:'Create a separate copy.',output:'Preview only: would copy README.md; fixture unchanged.'},
 {command:'mv notes.md archive.md',meaning:'Move or rename a path',use:'Reorganize files; destination may be overwritten.',output:'Preview only: would rename notes.md if it existed; fixture unchanged.'},
 {command:'rm notes.md',meaning:'Remove a file',use:'Remove a known disposable file; normal rm has no recycle-bin guarantee.',output:'Preview only: would remove notes.md if it existed; fixture unchanged.'},
 {command:'sudo -l',meaning:'List permitted sudo commands',use:'Inspect configured elevation permissions.',output:'Preview only: permissions depend on system policy; this lab grants no privileges.'},
 {command:'docker ps',meaning:'List running Docker containers',use:'Inspect container status when Docker is available.',output:'Preview only: sample container quest90-demo, status Up.\nNo Docker daemon was contacted.'},
 {command:'git status --short',meaning:'Summarize repository changes',use:'Review your working tree before committing.',output:'Preview only: M server.js\nNo repository was inspected.'},
];
const dirs=['/home/learner','/home/learner/app','/home/learner/app/logs'];
export function previewCommand(raw:string,cwd:string):{cwd:string;output:string}{
 const cmd=raw.trim().replace(/\s+/g,' ');if(!dirs.includes(cwd))cwd='/home/learner/app';
 if(cmd.startsWith('cd ')){const path=cmd.slice(3);const target=path==='..'?cwd.slice(0,cwd.lastIndexOf('/')):path.startsWith('/')?path:`${cwd}/${path}`;return dirs.includes(target)?{cwd:target,output:`Now in ${target}`}:{cwd,output:'That directory is not in this fixture. Try cd /home/learner/app.'}}
 if(cmd==='pwd')return {cwd,output:cwd};
 if(cmd==='ls'||cmd==='ls -la'){if(cwd==='/home/learner')return {cwd,output:'app'};if(cwd.endsWith('/logs'))return {cwd,output:'(empty fixture directory)'}}
 const entry=commandLessons.find(c=>c.command===cmd);
 if(!entry)return {cwd,output:'Not supported by this command preview. Choose a listed command; no shell or process is executed.'};
 if(cwd!=='/home/learner/app'&&/(README\.md|app\.log|find \.)/.test(cmd))return {cwd,output:'Sample files are in /home/learner/app. Navigate there first.'};
 return {cwd,output:entry.output};
}

export type SampleOrder={id:number;userId:number;code:string;quantity:number};
export const initialOrders:SampleOrder[]=[{id:1,userId:1,code:'BOOK-A',quantity:2},{id:2,userId:2,code:'BOOK-B',quantity:1}];
export const constraintDDL=`CREATE TABLE learner (id integer PRIMARY KEY, name text NOT NULL);
CREATE TABLE sample_order (
 id integer PRIMARY KEY,
 user_id integer NOT NULL REFERENCES learner(id),
 code text NOT NULL UNIQUE,
 quantity integer NOT NULL CHECK (quantity > 0)
);
INSERT INTO learner VALUES (1, 'Asha'), (2, 'Ravi');
INSERT INTO sample_order VALUES (1,1,'BOOK-A',2), (2,2,'BOOK-B',1);`;
export type ConstraintGate={name:string;pass:boolean;detail:string};
export function inspectOrder(draft:Record<string,string>,rows:SampleOrder[]):{gates:ConstraintGate[];row:SampleOrder|null}{
 const integer=(s:string)=>/^[+-]?\d+$/.test(s.trim())&&Number(s)>=-2147483648&&Number(s)<=2147483647;
 const nonnull=['id','userId','code','quantity'].every(k=>draft[k]?.trim());
 // Empty fields represent SQL NULL in this teaching form; nonempty code is preserved exactly.
 const typed=nonnull&&['id','userId','quantity'].every(k=>integer(draft[k]));
 const id=Number(draft.id),userId=Number(draft.userId),quantity=Number(draft.quantity),code=draft.code??'';
 const gates:ConstraintGate[]=[
 {name:'Required values',pass:!!nonnull,detail:'Blank fields stand for NULL in this form. All four columns are required.'},
 {name:'Integer types',pass:!!typed,detail:'id, user_id and quantity must fit PostgreSQL signed 32-bit integer.'},
 {name:'Primary key',pass:!!typed&&!rows.some(r=>r.id===id),detail:'The id must not already identify another row.'},
 {name:'Foreign key',pass:!!typed&&[1,2].includes(userId),detail:'The sample learner table contains IDs 1 and 2.'},
 {name:'Unique code',pass:!!typed&&!rows.some(r=>r.code===code),detail:'The exact code must be unused; this model uses case-sensitive equality.'},
 {name:'Positive quantity',pass:!!typed&&quantity>0,detail:'CHECK (quantity > 0) rejects zero and negative quantities.'},
 ];return {gates,row:gates.every(g=>g.pass)?{id,userId,quantity,code}:null};
}
export function computeModel(jobs:number,independent:boolean,overhead:number){
 if(!Number.isInteger(jobs)||jobs<1||jobs>64||!Number.isInteger(overhead)||overhead<0||overhead>10)throw Error('Use 1–64 jobs and 0–10 setup units.');
 const cpuWidth=independent?4:1,gpuWidth=independent?16:1;
 return {cpuWidth,gpuWidth,cpuTime:Math.ceil(jobs/cpuWidth),gpuTime:overhead+Math.ceil(jobs/gpuWidth)};
}

export const architectureCases=[
 {id:'booking',name:'Seat booking',requirement:'One confirmed booking per seat. Requests can be retried.',hld:[['Client','Send seat, user session, and a stable request key.'],['Booking API','Authorize the user and validate the command.'],['PostgreSQL','Reserve atomically and enforce uniqueness under concurrency.'],['Outbox + worker','Deliver the confirmation asynchronously with retry handling.']],lld:[['reserve(command)','Validate IDs and required fields; derive the user from the session.'],['Repository transaction','Claim the request key and attempt the unique seat reservation.'],['Result contract','Return confirmed, unavailable, or pending/retryable failure.'],['Replay','A duplicate request returns its established outcome.']],code:'reserve({seatId, userId, requestKey})\n→ Confirmed(bookingId) | Unavailable | Pending\n\nUnique keys: (event_id, seat_id), (user_id, request_key)\nState: available → held → confirmed\nTimeout rule: lookup request status before repeating effects.'},
 {id:'chat',name:'Chat messages',requirement:'Persist messages and allow reconnection without losing acknowledged messages.',hld:[['Client','Connect and authenticate; assign a client message ID.'],['WebSocket gateway','Route authorized messages and manage connection lifecycle.'],['Message service + database','Persist messages and deduplicate the client message ID.'],['Recipients','Deliver events; reconnect with a cursor to fetch missed messages.']],lld:[['sendMessage(command)','Validate room membership and message length.'],['Store message','Persist with a unique sender/client-message key.'],['Acknowledge','Return the durable message ID after the persistence boundary.'],['Resume(afterId)','Read authorized messages after the stored cursor.']],code:'sendMessage(roomId, clientMessageId, text) → messageId\nresume(roomId, afterMessageId) → messages[]\n\nDeduplicate: UNIQUE(sender_id, client_message_id)\nAck means persisted, not necessarily read by recipient.\nBound payloads and buffer sizes.'},
 {id:'shortener',name:'URL shortener',requirement:'Create stable short links and redirect read-heavy traffic.',hld:[['Client','Submit an allowed destination URL.'],['Link API','Validate the destination and allocate an unused code.'],['Database + optional cache','Persist code→destination; cache hot lookups if justified.'],['Redirect handler','Look up the code and return the chosen redirect response.']],lld:[['createLink(url)','Parse the URL, enforce supported protocols and size limits.'],['Allocate code','Generate a candidate and retry on a unique-key collision.'],['resolve(code)','Return found, expired or missing without assuming cache truth.'],['Redirect response','Select permanent/temporary redirect semantics and handle disabled links.']],code:'createLink(destination) → code\nresolve(code) → Found(url) | Expired | Missing\n\nlinks(code PRIMARY KEY, destination, expires_at)\nCollision: retry bounded allocation; never overwrite a mapping.\nCache policy: expiry + invalidation for disabled links.'},
] as const;
export const radarReviewed='2026-09-26';
export const techRadar=[
 {id:'typescript',name:'TypeScript + full-stack fundamentals',evidence:'GitHub Octoverse 2025 reported TypeScript leading by monthly contributors in August 2025.',source:'https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/',period:'GitHub activity, 2025',mission:'Implement a typed API contract, validate runtime input, and explain where TypeScript cannot replace validation.'},
 {id:'python',name:'Python + applied AI',evidence:'The 2025 Stack Overflow survey reported growth in Python adoption among respondents.',source:'https://survey.stackoverflow.co/2025/technology',period:'Developer survey, 2025',mission:'Build a small Python endpoint and a retrieval experiment; measure failures as well as successful answers.'},
 {id:'postgres',name:'PostgreSQL and data modeling',evidence:'PostgreSQL led the survey’s desired and admired database measures in 2025.',source:'https://survey.stackoverflow.co/2025/technology',period:'Developer survey, 2025',mission:'Model users and attempts with keys, constraints and an index matched to a real query.'},
 {id:'containers',name:'Docker and delivery skills',evidence:'Docker was widely used among respondents in the 2025 technology survey.',source:'https://survey.stackoverflow.co/2025/technology',period:'Developer survey, 2025',mission:'Containerize one service, document configuration and persistence, and sketch its deployment/rollback flow.'},
 {id:'ai-review',name:'AI-assisted coding with verification',evidence:'The 2025 AI survey shows substantial usage alongside concerns about accuracy and trust.',source:'https://survey.stackoverflow.co/2025/ai',period:'Developer survey, 2025',mission:'Review an AI suggestion: explain it, inspect edge cases, and reject unsupported assumptions before merging.'},
];
