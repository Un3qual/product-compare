import { graphql } from "react-relay";

export default graphql`
  query AffiliateSetupRouteQuery($first: Int, $after: String) {
    merchants(first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          name
          domain
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;
