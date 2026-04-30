import { graphql } from "react-relay";

export const productDetailRouteQuery = graphql`
  query ProductDetailRouteQuery($slug: String!) {
    product(slug: $slug) {
      id
      name
      slug
      description
      brand {
        id
        name
      }
    }
  }
`;
