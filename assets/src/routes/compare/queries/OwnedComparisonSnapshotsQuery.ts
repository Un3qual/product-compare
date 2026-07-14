import { graphql } from "react-relay";

export const ownedComparisonSnapshotsQuery = graphql`
  query OwnedComparisonSnapshotsQuery($first: Int!, $after: String) {
    viewer {
      comparisonSnapshots(first: $first, after: $after) {
        edges {
          node {
            id
            title
            sharePath
          }
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  }
`;

export default ownedComparisonSnapshotsQuery;
