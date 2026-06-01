import { graphql } from "react-relay";

export default graphql`
  mutation RevokeApiTokenMutation($tokenId: ID!) {
    revokeApiToken(tokenId: $tokenId) {
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
