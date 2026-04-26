import { graphql } from "react-relay";

export const productOffersRouteQuery = graphql`
  query ProductOffersRouteQuery($productId: ID!, $first: Int!) {
    merchantProducts(input: { productId: $productId, activeOnly: true, first: $first }) {
      edges {
        node {
          id
          url
          currency
          merchant {
            id
            name
          }
          latestPrice {
            id
            price
          }
        }
      }
    }
  }
`;
