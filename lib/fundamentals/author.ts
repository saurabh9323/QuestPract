import type {FundamentalConcept} from './types';
export function concept(id:string,title:string,category:FundamentalConcept['category'],definition:string,why:string,example:string,code:string,output:string,execution:string,pitfall:string,exercise:string):FundamentalConcept{
 return {id,title,category,definition,why,example,code,output,execution,pitfall,exercise};
}
