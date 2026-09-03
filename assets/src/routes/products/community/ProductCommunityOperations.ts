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
      ...ProductCommunityPanel_reviews
        @arguments(reviewFirst: $reviewFirst, reviewsAfter: $reviewsAfter)
      ...ProductCommunityPanel_questions
        @arguments(
          answerFirst: $answerFirst
          questionFirst: $questionFirst
          questionsAfter: $questionsAfter
        )
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

export const productCommunityReviewsFragment = graphql`
  fragment ProductCommunityPanel_reviews on Product
  @argumentDefinitions(reviewFirst: { type: "Int!" }, reviewsAfter: { type: "String" })
  @refetchable(queryName: "ProductCommunityReviewsPaginationQuery") {
    reviews(first: $reviewFirst, after: $reviewsAfter)
      @connection(key: "ProductCommunityPanel_reviews") {
      edges {
        node {
          id
          ...ProductCommunityItems_review
        }
      }
    }
  }
`;

export const productCommunityQuestionsFragment = graphql`
  fragment ProductCommunityPanel_questions on Product
  @argumentDefinitions(
    answerFirst: { type: "Int!" }
    questionFirst: { type: "Int!" }
    questionsAfter: { type: "String" }
  )
  @refetchable(queryName: "ProductCommunityQuestionsPaginationQuery") {
    questions(first: $questionFirst, after: $questionsAfter)
      @connection(key: "ProductCommunityPanel_questions") {
      edges {
        node {
          id
          ...ProductCommunityItems_question
          ...CommunityQuestionAnswers_question @arguments(answerFirst: $answerFirst)
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
