import { graphql } from "react-relay";

export default graphql`
  mutation RemoveCommunityContentMutation($input: RemoveCommunityContentInput!) {
    removeCommunityContent(input: $input) {
      removedContentId
      errors { code field message }
    }
  }
`;
