import { graphql } from "react-relay";

export default graphql`
  query MerchantFeedCandidatesRouteQuery(
    $first: Int
    $after: String
    $reviewStatus: MerchantFeedCandidateReviewStatus
    $sort: MerchantFeedCandidateSort
  ) {
    merchantFeedCandidates(
      first: $first
      after: $after
      reviewStatus: $reviewStatus
      sort: $sort
    ) {
      edges {
        cursor
        node {
          id
          provider
          providerFeedId
          advertiserName
          advertiserCountry
          sourceFeedType
          currency
          language
          feedName
          productCount
          reviewStatus
          reviewNote
          reviewedAt
          providerLastUpdatedAt
          lastSeenAt
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;
