import { graphql } from "react-relay";

export const logoutMutation = graphql`
  mutation LogoutMutation {
    logout {
      ok
      errors {
        code
        field
        message
      }
    }
  }
`;
