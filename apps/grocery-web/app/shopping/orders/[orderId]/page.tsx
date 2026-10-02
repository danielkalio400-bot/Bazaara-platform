import { redirect } from "next/navigation";
export default async function LegacyGroceryOrderRoute({ params }: { params: Promise<{ orderId: string }> }) { const { orderId } = await params; redirect(`/orders/${encodeURIComponent(orderId)}`); }
