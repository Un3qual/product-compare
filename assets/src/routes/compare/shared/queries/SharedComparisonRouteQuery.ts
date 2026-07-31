import { graphql } from "react-relay";

export default graphql`
  query SharedComparisonRouteQuery($token: String!) {
    comparisonSnapshot(token: $token) {
      id
      title
      searchIndexable
      seo {
        title
        description
        canonicalPath
        indexable
        imageUrl
        structuredData
      }
      capturedAt
      disclaimer
      products {
        id
        name
        slug
        description
        modelNumber
        brandName
        attributes {
          claimId
          displayName
          valueText
          sourceType
          evidence {
            artifactId
            excerpt
            sourceName
            sourceDomain
            url
            fetchedAt
          }
        }
        offers {
          pricePointId
          merchantProductId
          merchantName
          merchantDomain
          currency
          itemPrice
          shipping
          landedPrice
          observedAt
          freshness
        }
      }
      recommendation {
        profile
        algorithmVersion
        evaluatedAt
        status
        winnerProductId
        currency
        missingInputs
        rankings {
          rank
          productId
          productName
          landedPrice
          currency
          pricePointId
          claimIds
          reasons
        }
      }
    }
  }
`;
