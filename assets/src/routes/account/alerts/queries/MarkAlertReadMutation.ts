import { graphql } from "react-relay";

export default graphql`
  mutation MarkAlertReadMutation($id: ID!) {
    markAlertRead(id: $id) {
      event {
        id
        readAt
      }
      errors {
        code
        field
        message
      }
    }
  }
`;
