import { graphql } from "react-relay";

export const verifyEmailMutation = graphql`
  mutation VerifyEmailMutation($token: String!) {
    verifyEmail(token: $token) {
      ok
      errors {
        code
        field
        message
      }
    }
  }
`;
