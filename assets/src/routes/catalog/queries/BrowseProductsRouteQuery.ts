import { graphql } from "react-relay";

export const browseProductsRouteQuery = graphql`
  query BrowseProductsRouteQuery($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          name
          slug
          brand {
            name
          }
        }
      }
    }
  }
`;
