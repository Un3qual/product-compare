import { SummaryStrip } from "$ui/components/data/SummaryStrip";
import { buildRevenueSummaryMetrics } from "./revenue-summary-data";

export function RevenueMetrics({
  metrics,
}: {
  metrics: ReturnType<typeof buildRevenueSummaryMetrics>;
}) {
  return <SummaryStrip items={metrics} label="Summary" />;
}
