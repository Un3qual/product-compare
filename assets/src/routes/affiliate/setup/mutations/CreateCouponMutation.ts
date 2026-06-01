import { graphql } from "react-relay";

export default graphql`
  mutation CreateCouponMutation($input: CreateCouponInput!) {
    createCoupon(input: $input) {
      coupon {
        id
        merchantId
        affiliateNetworkId
        code
        discountType
        discountValue
        currency
        validFrom
        validTo
      }
      errors {
        code
        field
        message
      }
    }
  }
`;
