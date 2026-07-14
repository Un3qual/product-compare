import { graphql } from "react-relay";

export const compareRecommendationQuery = graphql`
  query CompareRecommendationQuery(
    $slugs: [String!]!
    $profile: RecommendationProfile!
  ) {
    comparisonRecommendation(slugs: $slugs, profile: $profile) {
      profile
      algorithmVersion
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
`;

export default compareRecommendationQuery;
