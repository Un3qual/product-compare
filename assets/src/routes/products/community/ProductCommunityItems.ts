import { graphql } from "react-relay";

export const reviewFragment = graphql`
  fragment ProductCommunityItems_review on ProductReview {
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
`;

export const questionFragment = graphql`
  fragment ProductCommunityItems_question on ProductQuestion {
    id
    title
    body
    authorLabel
    moderationStatus
    viewerCanEdit
    viewerCanRemove
  }
`;

export const answerFragment = graphql`
  fragment ProductCommunityItems_answer on ProductAnswer {
    id
    body
    authorLabel
    moderationStatus
    viewerCanEdit
    viewerCanRemove
  }
`;
