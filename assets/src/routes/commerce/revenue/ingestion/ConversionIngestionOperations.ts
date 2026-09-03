import { graphql } from "react-relay";

export const updateCJCommissionIngestionSettingsMutation = graphql`
  mutation UpdateCJCommissionIngestionSettingsMutation(
    $input: UpdateCJCommissionIngestionSettingsInput!
  ) {
    updateCjCommissionIngestionSettings(input: $input) {
      ingestion {
        settings {
          updatedAt
        }
      }
      errors {
        code
        field
        message
      }
    }
  }
`;

export const runCJCommissionIngestionNowMutation = graphql`
  mutation RunCJCommissionIngestionNowMutation {
    runCjCommissionIngestionNow {
      ingestion {
        activity {
          state
        }
      }
      errors {
        code
        field
        message
      }
    }
  }
`;
