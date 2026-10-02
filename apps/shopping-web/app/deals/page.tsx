import type { Metadata } from "next";
import { DealRadarClient } from "./deal-radar-client";

export const metadata: Metadata = {
  title: "Deal Radar | Shopping",
  description: "Find current discounted Shopping listings by seller verification, actual stock and your budget.",
};
export default function DealRadarPage() { return <DealRadarClient />; }
