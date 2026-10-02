import { proxyBazId } from "../../../../lib/native-api-proxy";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { return proxyBazId(request, "/v1/bazid/me"); }
export async function PATCH(request: Request) { return proxyBazId(request, "/v1/bazid/me"); }
