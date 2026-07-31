import { graphql } from "react-relay";

export const apiTokenOperationsQuery = graphql`
  query ApiTokenOperationsQuery($first: Int!, $after: String, $status: ApiTokenStatusFilter) {
    myApiTokens(first: $first, after: $after, status: $status) {
      edges {
        cursor
        node {
          id
          label
          tokenPrefix
          lastUsedAt
          expiresAt
          revokedAt
          insertedAt
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const createApiTokenMutation = graphql`
  mutation ApiTokenOperationsCreateApiTokenMutation($label: String, $expiresAt: DateTime) {
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
  mutation ApiTokenOperationsRevokeApiTokenMutation($tokenId: ID!) {
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
  mutation ApiTokenOperationsRotateApiTokenMutation(
    $tokenId: ID!
    $label: String
    $expiresAt: DateTime
  ) {
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
