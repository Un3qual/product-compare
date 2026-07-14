import { graphql } from "react-relay";

export default graphql`
  mutation PublishComparisonSnapshotMutation($input: PublishComparisonSnapshotInput!) {
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
