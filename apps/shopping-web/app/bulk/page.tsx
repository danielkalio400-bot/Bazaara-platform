import { redirect } from "next/navigation";

/** Legacy links remain safe, but Shopping is retail-only. */
export default function LegacyBulkRedirect() { redirect("/shopping"); }
