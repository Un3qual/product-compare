import { graphql } from "react-relay";

export const createApiTokenMutation = graphql`
  mutation apiTokenMutationsCreateApiTokenMutation($label: String, $expiresAt: DateTime) {
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

export const revokeApiTokenMutation = graphql`
  mutation apiTokenMutationsRevokeApiTokenMutation($tokenId: ID!) {
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

export const rotateApiTokenMutation = graphql`
  mutation apiTokenMutationsRotateApiTokenMutation($tokenId: ID!, $label: String, $expiresAt: DateTime) {
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
