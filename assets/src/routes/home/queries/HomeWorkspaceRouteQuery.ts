import { graphql } from "react-relay";

const homeWorkspaceRouteQuery = graphql`
  query HomeWorkspaceRouteQuery($selectedSlugs: [String!]!) {
    homeWorkspace(selectedSlugs: $selectedSlugs) {
      categories {
        id
        name
        slug
        description
        qualifiedProductCount
      }
      selectedProducts {
        id
        name
        slug
      }
      products {
        id
        name
        slug
        highlights {
          label
          value
        }
        offer {
          merchantProductId
          merchantName
          currency
          landedPrice
          activeOfferCount
          priceSignal
          observedAt
        }
      }
    }
  }
`;

export default homeWorkspaceRouteQuery;
