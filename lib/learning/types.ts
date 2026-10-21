import type {LabModule} from '../playground/types';

export const domains=['dsa','system-design','react','sql'] as const;
export type Domain=typeof domains[number];
export const palettes={
  dsa:['start','end','process','decision','loop','io','call','data-op'],
  'system-design':['client','gateway','service','database','cache','queue','worker','external-api'],
  react:['component','state','event','effect','api-call'],
  sql:['table','filter','join','group','result']
} as const;
export type Link={kind:'question'|'dsa-path'|'dojo'|'module'|'lesson';id:string;label:string};
export type FlowNode={id:string;type:string;label:string;x:number;y:number;note:string;costNote:string;lines:number[];tradeoff?:{why:string;alternative:string;breaksWhen:string}};
export type FlowEdge={id:string;from:string;to:string;label:string;condition:string;mode:'sync'|'async'|'control'};
export type Flow={id:string;title:string;domain:Domain;nodes:FlowNode[];edges:FlowEdge[];tags:string[];links:Link[];versions:{id:string;at:string;note:string}[];createdAt:string;updatedAt:string};
export type Stroke={id:string;tool:'pen'|'highlighter'|'eraser'|'line'|'arrow'|'rectangle'|'ellipse'|'diamond'|'text';color:string;width:number;points:[number,number,number,number][];t:number;text:string};
export type StrokeDocument={id:string;title:string;host:Link;strokes:Stroke[]};
export type Card={id:string;title:string;topic:string;kind:'cloze'|'next-step'|'pattern'|'bug';prompt:string;answer:string;source:Link;evidence:{origin:'trace'|'test'|'self'|'ai-draft';excerpt:string;step?:number};status:'draft'};
export type SessionPlan={id:string;title:string;minutes:30|60|90;items:{id:string;source:Link;minutes:number;reason:string}[];status:'draft'};
export type Documents={flow:Flow;module:LabModule;stroke:StrokeDocument;card:Card;session:SessionPlan};
export type DocumentKind=keyof Documents;
export type LearningDocument={ [K in DocumentKind]:{schemaVersion:1;kind:K;origin:'manual'|'ai';status:'draft';data:Documents[K]} }[DocumentKind];
export type LearningBackup={format:'quest90-learning';schemaVersion:1;exportedAt:string;documents:LearningDocument[]};
