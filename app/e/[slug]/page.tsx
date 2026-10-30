import ExperienceViewer from './viewer';
export const dynamic='force-dynamic';
export default async function ExperiencePage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 return <ExperienceViewer slug={slug}/>;
}
