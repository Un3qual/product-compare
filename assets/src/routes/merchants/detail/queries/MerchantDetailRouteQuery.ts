import { graphql } from "react-relay";

export default graphql`
  query MerchantDetailRouteQuery($slug: String!, $first: Int!, $after: String) {
    merchant(slug: $slug) {
      id
      name
      slug
      domain
      seo {
        title
        description
        canonicalPath
        indexable
        imageUrl
        structuredData
      }
      detailSummary {
        activeOfferCount
        distinctProductCount
        observedOfferCount
        eligibleOfferCount
        freshOfferCount
        agingOfferCount
        staleOfferCount
        unobservedOfferCount
        lastObservedAt
      }
      merchantProducts(first: $first, after: $after) {
        edges {
          node {
            id
            currency
            product {
              id
              name
              slug
            }
            latestPrice {
              id
              price
              shipping
              inStock
              observedAt
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
