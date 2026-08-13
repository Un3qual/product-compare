import { graphql } from "react-relay";

export const productCommunityOperationsQuery = graphql`
  query ProductCommunityOperationsQuery(
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
            ...ProductCommunityItems_review
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
            ...ProductCommunityItems_question
            acceptedAnswerId
            answers(first: $answerFirst) {
              edges {
                node {
                  id
                  ...ProductCommunityItems_answer
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
          ...ProductCommunityItems_review
        }
        questions {
          id
          ...ProductCommunityItems_question
        }
        answers {
          id
          ...ProductCommunityItems_answer
        }
      }
    }
  }
`;

export const answerProductQuestionMutation = graphql`
  mutation ProductCommunityOperationsAnswerProductQuestionMutation(
    $input: AnswerProductQuestionInput!
  ) {
    answerProductQuestion(input: $input) {
      answer {
        id
        moderationStatus
      }
      errors {
        code
        field
        message
      }
    }
  }
`;

export const askProductQuestionMutation = graphql`
  mutation ProductCommunityOperationsAskProductQuestionMutation($input: AskProductQuestionInput!) {
    askProductQuestion(input: $input) {
      question {
        id
        moderationStatus
      }
      errors {
        code
        field
        message
      }
    }
  }
`;

export const submitProductReviewMutation = graphql`
  mutation ProductCommunityOperationsSubmitProductReviewMutation(
    $input: SubmitProductReviewInput!
  ) {
    submitProductReview(input: $input) {
      review {
        id
        moderationStatus
      }
      errors {
        code
        field
        message
      }
    }
  }
`;

export const removeCommunityContentMutation = graphql`
  mutation ProductCommunityOperationsRemoveCommunityContentMutation(
    $input: RemoveCommunityContentInput!
  ) {
    removeCommunityContent(input: $input) {
      removedContentId
      errors {
        code
        field
        message
      }
    }
  }
`;

export const updateProductAnswerMutation = graphql`
  mutation ProductCommunityOperationsUpdateProductAnswerMutation(
    $input: UpdateProductAnswerInput!
  ) {
    updateProductAnswer(input: $input) {
      answer {
        id
        body
        moderationStatus
      }
      errors {
        code
        field
        message
      }
    }
  }
`;

export const updateProductQuestionMutation = graphql`
  mutation ProductCommunityOperationsUpdateProductQuestionMutation(
    $input: UpdateProductQuestionInput!
  ) {
    updateProductQuestion(input: $input) {
      question {
        id
        title
        body
        moderationStatus
      }
      errors {
        code
        field
        message
      }
    }
  }
`;

export const updateProductReviewMutation = graphql`
  mutation ProductCommunityOperationsUpdateProductReviewMutation(
    $input: UpdateProductReviewInput!
  ) {
    updateProductReview(input: $input) {
      review {
        id
        rating
        title
        body
        moderationStatus
      }
      errors {
        code
        field
        message
      }
    }
  }
`;
