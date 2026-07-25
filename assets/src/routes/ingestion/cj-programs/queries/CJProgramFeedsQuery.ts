import { graphql } from "react-relay";

export default graphql`
  query CJProgramFeedsQuery($id: ID!, $first: Int!, $after: String) {
    cjProgram(id: $id) {
      feeds(first: $first, after: $after) {
        edges {
          node {
            id
            providerFeedId
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
  }
`;
