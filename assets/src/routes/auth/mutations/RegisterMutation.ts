import { graphql } from "react-relay";

export const registerMutation = graphql`
  mutation RegisterMutation($email: String!, $password: String!) {
    register(email: $email, password: $password) {
      viewer {
        id
        email
      }
      errors {
        code
        field
        message
      }
    }
  }
`;
