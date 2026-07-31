import { graphql } from "react-relay";

export default graphql`
  query MerchantDirectoryRouteQuery($first: Int!, $after: String) {
    merchants(first: $first, after: $after) {
      edges {
        cursor
        node {
          ...MerchantListItemFragment @relay(mask: false)
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
