import { graphql } from "react-relay";

export const createSavedComparisonSetMutation = graphql`
  mutation compareMutationsCreateSavedComparisonSetMutation($input: CreateSavedComparisonSetInput!) {
    createSavedComparisonSet(input: $input) {
      savedComparisonSet {
        id
      }
      errors {
        code
        field
        message
      }
    }
  }
`;

export const deleteSavedComparisonSetMutation = graphql`
  mutation compareMutationsDeleteSavedComparisonSetMutation($savedComparisonSetId: ID!) {
    deleteSavedComparisonSet(savedComparisonSetId: $savedComparisonSetId) {
      savedComparisonSet {
        id
      }
      errors {
        code
        field
        message
      }
    }
  }
`;

export const publishComparisonSnapshotMutation = graphql`
  mutation compareMutationsPublishComparisonSnapshotMutation($input: PublishComparisonSnapshotInput!) {
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
  mutation compareMutationsRevokeComparisonSnapshotMutation($snapshotId: ID!) {
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
