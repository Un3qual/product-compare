import { graphql } from "react-relay";

export default graphql`
  query RevenueSummaryRouteQuery(
    $input: RevenueSummaryInput
    $ledgerFirst: Int!
    $ledgerAfter: String
  ) {
    revenueSummary(input: $input) {
      filters {
        currency
        from
        merchantId
        network
        productId
        to
      }
      metrics {
        averagePaidPrice
        clicks
        commissionRevenue
        conversions
        currency
        grossOrderValue
      }
    }
    ...AttributionLedger_connection
      @arguments(input: $input, first: $ledgerFirst, after: $ledgerAfter)
  }
`;
