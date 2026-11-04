import { BidComparisonPage } from "@/features/bids/bid-comparison-page";

export const instant = false;

export default async function CompareBidsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BidComparisonPage id={id} />;
}
