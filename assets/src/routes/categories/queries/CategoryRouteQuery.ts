import { graphql } from "react-relay";

export default graphql`
  query CategoryRouteQuery($slug: String!, $first: Int!, $after: String) {
    category(slug: $slug) {
      id
      name
      slug
      description
      qualifiedProductCount
      indexable
      seo {
        title
        description
        canonicalPath
        indexable
        imageUrl
        structuredData
      }
      products(first: $first, after: $after) {
        edges {
          node {
            id
            name
            slug
            description
            brand {
              id
              name
            }
            currentAttributes {
              attributeId
              displayName
              valueText
              sortOrder
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;
