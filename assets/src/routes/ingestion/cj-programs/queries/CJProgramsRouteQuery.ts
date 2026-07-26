import { graphql } from "react-relay";

export default graphql`
  query CJProgramsRouteQuery(
    $first: Int!
    $after: String
    $stage: CJProgramStage
    $sort: CJProgramSort!
    $unmatchedFirst: Int!
    $unmatchedAfter: String
  ) {
    cjProgramStageCounts {
      new
      considering
      selected
      applied
      accepted
      notPursuing
      declined
    }
    cjPrograms(first: $first, after: $after, stage: $stage, sort: $sort) {
      edges {
        node {
          id
          advertiserId
          advertiserName
          stage
          note
          lastChanged
          feedCount
          warningCodes
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        endCursor
      }
    }
    unmatchedCjFeeds(first: $unmatchedFirst, after: $unmatchedAfter) {
      edges {
        node {
          id
          providerFeedId
          advertiserName
          advertiserCountry
          sourceFeedType
          currency
          language
          feedName
          productCount
          lastSeenAt
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        endCursor
      }
    }
  }
`;
