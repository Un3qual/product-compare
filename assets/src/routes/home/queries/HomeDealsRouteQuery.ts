import { graphql } from "react-relay";

const homeDealsRouteQuery = graphql`
  query HomeDealsRouteQuery($selectedSlugs: [String!]!) {
    homeDeals(selectedSlugs: $selectedSlugs) {
      new {
        product {
          id
          name
          slug
        }
        offer {
          merchantName
          currency
          landedPrice
          observedAt
        }
        reasons {
          code
          watchTarget
        }
      }
      trending {
        product {
          id
          name
          slug
        }
        offer {
          merchantName
          currency
          landedPrice
          observedAt
        }
        reasons {
          code
          watchTarget
        }
      }
      forYou {
        product {
          id
          name
          slug
        }
        offer {
          merchantName
          currency
          landedPrice
          observedAt
        }
        reasons {
          code
          watchTarget
        }
      }
    }
  }
`;

export default homeDealsRouteQuery;
