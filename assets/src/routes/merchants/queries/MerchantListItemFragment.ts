import { graphql } from "react-relay";

export default graphql`
  fragment MerchantListItemFragment on Merchant {
    id
    name
    domain
    slug
  }
`;
