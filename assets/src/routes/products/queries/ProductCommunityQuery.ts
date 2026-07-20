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
            moderationStatus
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
            moderationStatus
            viewerCanEdit
            viewerCanRemove
            acceptedAnswerId
            answers(first: $answerFirst) {
              edges {
                node {
                  id
                  body
                  authorLabel
                  moderationStatus
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
      viewerCommunitySubmissions {
        reviews {
          id
          rating
          title
          body
          verifiedPurchase
          authorLabel
          moderationStatus
          viewerCanEdit
          viewerCanRemove
        }
        questions {
          id
          title
          body
          authorLabel
          moderationStatus
          viewerCanEdit
          viewerCanRemove
        }
        answers {
          id
          body
          authorLabel
          moderationStatus
          viewerCanEdit
          viewerCanRemove
        }
      }
    }
  }
`;

export default productCommunityQuery;
