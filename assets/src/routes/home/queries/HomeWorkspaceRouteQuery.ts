import { graphql } from "react-relay";

const homeWorkspaceRouteQuery = graphql`
  query HomeWorkspaceRouteQuery($selectedSlugs: [String!]!) {
    homeWorkspace(selectedSlugs: $selectedSlugs) {
      categories {
        taxonId
        name
        slug
        description
      }
      selectedProducts {
        id
        name
        slug
      }
      products {
        product {
          id
          name
          slug
        }
        highlights {
          label
          value
        }
        offer {
          merchantName
          currency
          landedPrice
          priceSignal
          observedAt
        }
      }
    }
  }
`;

export default homeWorkspaceRouteQuery;
