import Workspace from '@/components/QuestWorkspace';
import {workspaceStaticPaths,parseWorkspacePath} from '@/lib/workspace-routes';
import {notFound} from 'next/navigation';
export const dynamicParams=false;
export function generateStaticParams(){return workspaceStaticPaths.map(path=>({path}))}
export default async function Page({params}:{params:Promise<{path:string[]}>}){const {path}=await params;const initialPath='/'+path.join('/')+'/';if(!parseWorkspacePath(initialPath))notFound();return <Workspace initialPath={initialPath}/>}
