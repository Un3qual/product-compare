import { graphql } from "react-relay";

export default graphql`
  mutation AskProductQuestionMutation($input: AskProductQuestionInput!) {
    askProductQuestion(input: $input) {
      question { id moderationStatus }
      errors { code field message }
    }
  }
`;
