import { graphql } from "react-relay";

export const loginMutation = graphql`
  mutation LoginMutation($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      viewer {
        id
        email
        isOperator
      }
      errors {
        code
        field
        message
      }
    }
  }
`;
