import { graphql } from "react-relay";

export const productFilterMetadataQuery = graphql`
  query ProductFilterMetadataQuery($filters: ProductFiltersInput) {
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
