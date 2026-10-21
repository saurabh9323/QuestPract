export type CitationScope={steps?:number[];nodes?:string[];items?:string[]};
export function checkCitations(text:string,scope:CitationScope){
  return text.split(/(\[(?:step|node|item)\s+[^\]\r\n]{1,100}\])/gi).filter(Boolean).map(text=>{
    const match=/^\[(step|node|item)\s+([^\]\r\n]+)\]$/i.exec(text);
    if(!match)return {text,kind:null,id:null,valid:false} as const;
    const kind=match[1].toLowerCase() as 'step'|'node'|'item',id=match[2];
    const valid=kind==='step'?/^\d+$/.test(id)&&(scope.steps||[]).includes(Number(id)):(kind==='node'?scope.nodes:scope.items)?.includes(id)===true;
    return {text,kind,id,valid};
  });
}
