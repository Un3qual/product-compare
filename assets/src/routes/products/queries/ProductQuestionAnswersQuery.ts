import { graphql } from "react-relay";

export const productQuestionAnswersQuery = graphql`
  query ProductQuestionAnswersQuery($id: ID!, $first: Int!, $after: String) {
    productQuestion(id: $id) {
      id
      answers(first: $first, after: $after) {
        edges {
          node {
            id
            body
            authorLabel
          }
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  }
`;

export default productQuestionAnswersQuery;
