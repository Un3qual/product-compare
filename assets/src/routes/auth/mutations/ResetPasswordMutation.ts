import { graphql } from "react-relay";

export const resetPasswordMutation = graphql`
  mutation ResetPasswordMutation($token: String!, $password: String!) {
    resetPassword(token: $token, password: $password) {
      ok
      errors {
        code
        field
        message
      }
    }
  }
`;
