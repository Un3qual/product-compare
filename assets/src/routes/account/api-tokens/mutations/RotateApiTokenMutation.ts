import { graphql } from "react-relay";

export default graphql`
  mutation RotateApiTokenMutation($tokenId: ID!, $label: String, $expiresAt: DateTime) {
    rotateApiToken(tokenId: $tokenId, label: $label, expiresAt: $expiresAt) {
      plainTextToken
      apiToken {
        id
        label
        tokenPrefix
        lastUsedAt
        expiresAt
        revokedAt
        insertedAt
      }
      errors {
        code
        message
        field
      }
    }
  }
`;
