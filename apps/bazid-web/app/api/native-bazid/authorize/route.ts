import { proxyBazId } from "../../../../lib/native-api-proxy";
export const dynamic = "force-dynamic";
export async function POST(request: Request) { return proxyBazId(request, "/v1/bazid/oauth/authorize"); }
