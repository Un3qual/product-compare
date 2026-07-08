import { graphql } from "react-relay";

export const trackCommerceClickMutation = graphql`
  mutation TrackCommerceClickMutation($input: TrackCommerceClickInput!) {
    trackCommerceClick(input: $input) {
      redirectPath
      errors {
        code
        field
        message
      }
    }
  }
`;
