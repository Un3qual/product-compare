import { graphql } from "react-relay";

export default graphql`
  query ApiTokensRouteQuery(
    $first: Int!
    $after: String
    $status: ApiTokenStatusFilter
  ) {
    myApiTokens(first: $first, after: $after, status: $status) {
      edges {
        cursor
        node {
          id
          label
          tokenPrefix
          lastUsedAt
          expiresAt
          revokedAt
          insertedAt
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
