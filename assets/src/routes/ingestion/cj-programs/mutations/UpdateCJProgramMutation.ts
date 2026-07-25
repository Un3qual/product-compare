import { graphql } from "react-relay";

export default graphql`
  mutation UpdateCJProgramMutation($input: UpdateCjProgramInput!) {
    updateCjProgram(input: $input) {
      errors {
        code
        field
        message
      }
    }
  }
`;
