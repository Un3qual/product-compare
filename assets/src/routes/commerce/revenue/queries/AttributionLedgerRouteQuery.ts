import { graphql } from "react-relay";

export default graphql`
  query AttributionLedgerRouteQuery($input: RevenueSummaryInput, $first: Int!, $after: String) {
    ...AttributionLedger_connection @arguments(input: $input, first: $first, after: $after)
  }
`;
