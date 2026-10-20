import ArrayRenderer,{type RendererProps} from './ArrayRenderer';
export const rendererRegistry = {
  array:{label:'Array & pointers',matches:(p:RendererProps)=>Object.values(p.event?.snapshot||{}).some(Array.isArray),Component:ArrayRenderer},
  variables:{label:'Variables only',matches:()=>true,Component:()=> <p>Inspect every recorded value in the before/after panel below.</p>}
};
export type RendererId=keyof typeof rendererRegistry;
export function detectRenderer(props:RendererProps):RendererId{
  return (Object.keys(rendererRegistry) as RendererId[]).find(id=>rendererRegistry[id].matches(props))||'variables';
}
