import { graphql } from "react-relay";

export const productCommunityQuery = graphql`
  query ProductCommunityQuery(
    $slug: String!
    $reviewFirst: Int!
    $reviewsAfter: String
    $questionFirst: Int!
    $questionsAfter: String
    $answerFirst: Int!
  ) {
    product(slug: $slug) {
      id
      reviewSummary {
        count
        averageRating
      }
      reviews(first: $reviewFirst, after: $reviewsAfter) {
        edges {
          node {
            id
            rating
            title
            body
            verifiedPurchase
            authorLabel
            viewerCanEdit
            viewerCanRemove
          }
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
      questions(first: $questionFirst, after: $questionsAfter) {
        edges {
          node {
            id
            title
            body
            authorLabel
            viewerCanEdit
            viewerCanRemove
            acceptedAnswerId
            answers(first: $answerFirst) {
              edges {
                node {
                  id
                  body
                  authorLabel
                  viewerCanEdit
                  viewerCanRemove
                }
              }
              pageInfo {
                endCursor
                hasNextPage
              }
            }
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

export default productCommunityQuery;
