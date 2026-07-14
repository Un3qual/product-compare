import { graphql } from "react-relay";

export const rootViewerRouteQuery = graphql`
  query RootViewerRouteQuery {
    viewer {
      id
      email
      isOperator
    }
  }
`;
