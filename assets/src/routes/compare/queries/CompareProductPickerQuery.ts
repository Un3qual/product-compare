import { graphql } from "react-relay";

export const compareProductPickerQuery = graphql`
  query CompareProductPickerQuery($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          name
          slug
          brand {
            id
            name
          }
        }
      }
    }
  }
`;
