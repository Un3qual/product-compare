import { graphql } from "react-relay";

export default graphql`
  query RevenueSummaryRouteQuery($input: RevenueSummaryInput) {
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
  }
`;
