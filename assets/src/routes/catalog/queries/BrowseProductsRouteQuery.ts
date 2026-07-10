import { graphql } from "react-relay";

export const browseProductsRouteQuery = graphql`
  query BrowseProductsRouteQuery(
    $first: Int!
    $after: String
    $filters: ProductFiltersInput
  ) {
    products(first: $first, after: $after, filters: $filters) {
      edges {
        cursor
        node {
          id
          name
          slug
          brand {
            id
            name
          }
          currentAttributes {
            code
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
    productFilterMetadata(filters: $filters) {
      resultCount
      typeOptions {
        id
        label
        count
        selected
        disabled
      }
      useCaseOptions {
        id
        label
        count
        selected
        disabled
      }
      numericFilters {
        attributeId
        code
        displayName
        unitSymbol
        min
        max
        selectedMin
        selectedMax
      }
      booleanFilters {
        attributeId
        code
        displayName
        trueCount
        falseCount
        selectedValue
      }
      enumFilters {
        attributeId
        code
        displayName
        options {
          id
          label
          count
          selected
          disabled
        }
      }
    }
  }
`;
