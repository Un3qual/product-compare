import { graphql } from "react-relay";

export const createPriceWatchMutation = graphql`
  mutation productMutationsCreatePriceWatchMutation($input: CreatePriceWatchInput!) {
    createPriceWatch(input: $input) {
      watch {
        id
        productName
        ruleType
        currency
        targetAmount
        percentageDrop
        enabled
      }
      errors {
        code
        field
        message
      }
    }
  }
`;

export const answerProductQuestionMutation = graphql`
  mutation productMutationsAnswerProductQuestionMutation($input: AnswerProductQuestionInput!) {
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
  mutation productMutationsAskProductQuestionMutation($input: AskProductQuestionInput!) {
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
  mutation productMutationsSubmitProductReviewMutation($input: SubmitProductReviewInput!) {
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
  mutation productMutationsRemoveCommunityContentMutation($input: RemoveCommunityContentInput!) {
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
  mutation productMutationsUpdateProductAnswerMutation($input: UpdateProductAnswerInput!) {
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
  mutation productMutationsUpdateProductQuestionMutation($input: UpdateProductQuestionInput!) {
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
  mutation productMutationsUpdateProductReviewMutation($input: UpdateProductReviewInput!) {
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
