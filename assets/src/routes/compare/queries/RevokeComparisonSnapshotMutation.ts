import { graphql } from "react-relay";

export default graphql`
  mutation RevokeComparisonSnapshotMutation($snapshotId: ID!) {
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
