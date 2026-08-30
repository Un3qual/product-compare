import { graphql } from "react-relay";

export const comparisonSharingSnapshotsFragment = graphql`
  fragment ComparisonSharingOperations_snapshots on RootQueryType
  @argumentDefinitions(first: { type: "Int!" }, after: { type: "String" })
  @refetchable(queryName: "ComparisonSharingSnapshotsPaginationQuery") {
    viewer {
      comparisonSnapshots(first: $first, after: $after)
        @connection(key: "ComparisonSharingOperations_comparisonSnapshots") {
        edges {
          node {
            id
            title
            sharePath
          }
        }
      }
    }
  }
`;

export const comparisonSharingOperationsQuery = graphql`
  query ComparisonSharingOperationsQuery($first: Int!, $after: String) {
    ...ComparisonSharingOperations_snapshots @arguments(first: $first, after: $after)
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
