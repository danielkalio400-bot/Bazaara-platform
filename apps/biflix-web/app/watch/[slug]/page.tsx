import { notFound } from "next/navigation";
import { titleBySlug } from "../../lib/catalog";
import LocalPlayer from "../../components/LocalPlayer";
export default async function WatchPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const title=titleBySlug(slug);if(!title)notFound();return <LocalPlayer title={title}/>}
