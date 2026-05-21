import { graphql } from "react-relay";

export const forgotPasswordMutation = graphql`
  mutation ForgotPasswordMutation($email: String!) {
    forgotPassword(email: $email) {
      ok
      errors {
        code
        field
        message
      }
    }
  }
`;
