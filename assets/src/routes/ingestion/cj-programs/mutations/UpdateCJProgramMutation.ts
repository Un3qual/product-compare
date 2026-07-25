import { graphql } from "react-relay";

export default graphql`
  mutation UpdateCJProgramMutation($input: UpdateCjProgramInput!) {
    updateCjProgram(input: $input) {
      program {
        id
        stage
        note
        lastChanged
        warningCodes
      }
      errors {
        code
        field
        message
      }
    }
  }
`;
