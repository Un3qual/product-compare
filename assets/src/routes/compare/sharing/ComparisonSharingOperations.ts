import { graphql } from "react-relay";

export const comparisonSharingOperationsQuery = graphql`
  query ComparisonSharingOperationsQuery($first: Int!, $after: String) {
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

export const publishComparisonSnapshotMutation = graphql`
  mutation ComparisonSharingOperationsPublishComparisonSnapshotMutation(
    $input: PublishComparisonSnapshotInput!
  ) {
    publishComparisonSnapshot(input: $input) {
      snapshot {
        id
        title
        searchIndexable
        capturedAt
      }
      sharePath
      errors {
        code
        field
        message
      }
    }
  }
`;

export const revokeComparisonSnapshotMutation = graphql`
  mutation ComparisonSharingOperationsRevokeComparisonSnapshotMutation($snapshotId: ID!) {
    revokeComparisonSnapshot(snapshotId: $snapshotId) {
      revokedSnapshotId
      errors {
        code
        field
        message
      }
    }
  }
`;
