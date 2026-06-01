import { graphql } from "react-relay";

export default graphql`
  mutation CreateApiTokenMutation($label: String, $expiresAt: DateTime) {
    createApiToken(label: $label, expiresAt: $expiresAt) {
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
