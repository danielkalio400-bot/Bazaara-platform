import { redirect } from "next/navigation";
const BAZID = process.env.NEXT_PUBLIC_BAZID_BASE_URL ?? "http://localhost:3004";
export default function LegacyBazIdRoute() { redirect(`${BAZID}/bazid/sign-in`); }
