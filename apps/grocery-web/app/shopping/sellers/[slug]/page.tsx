import { redirect } from "next/navigation";
export default async function LegacyGrocerySellerRoute({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; redirect(`/sellers/${encodeURIComponent(slug)}`); }
