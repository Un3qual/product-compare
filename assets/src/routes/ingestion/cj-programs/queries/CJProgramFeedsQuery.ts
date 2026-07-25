import { graphql } from "react-relay";

export default graphql`
  query CJProgramFeedsQuery($id: ID!, $first: Int!, $after: String) {
    cjProgram(id: $id) {
      id
      advertiserId
      advertiserName
      stage
      note
      lastChanged
      feedCount
      warningCodes
      feeds(first: $first, after: $after) {
        edges {
          cursor
          node {
            id
            provider
            providerFeedId
            advertiserId
            advertiserName
            advertiserCountry
            sourceFeedType
            currency
            language
            feedName
            productCount
            providerLastUpdatedAt
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
  }
`;
