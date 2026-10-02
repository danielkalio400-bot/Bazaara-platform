import { Suspense } from "react";
import { BazAiWebAssistant } from "../../components/bazai-web-assistant";
export default function BazAiPage(){return <Suspense fallback={<main style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#05110E",color:"#F4FBF7"}}>Loading Grocery AI…</main>}><BazAiWebAssistant/></Suspense>}
