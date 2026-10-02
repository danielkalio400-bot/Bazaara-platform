import { proxyBazId } from "../../../../../lib/native-api-proxy";
export const dynamic = "force-dynamic";
export async function DELETE(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await context.params;
  return proxyBazId(request, `/v1/bazid/sessions/${encodeURIComponent(sessionId)}`);
}
