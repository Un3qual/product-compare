/**
 * @generated SignedSource<<c4c5f52c97e9eb1f70a36017cdc9ef16>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type MerchantFeedCandidateReviewStatus = "DISMISSED" | "PENDING" | "SHORTLISTED" | "%future added value";
export type ReviewMerchantFeedCandidateInput = {
  id: string;
  note?: string | null | undefined;
  status: MerchantFeedCandidateReviewStatus;
};
export type ReviewMerchantFeedCandidateMutation$variables = {
  input: ReviewMerchantFeedCandidateInput;
};
export type ReviewMerchantFeedCandidateMutation$data = {
  readonly reviewMerchantFeedCandidate: {
    readonly candidate: {
      readonly id: string;
      readonly reviewNote: string | null | undefined;
      readonly reviewStatus: MerchantFeedCandidateReviewStatus;
      readonly reviewedAt: any | null | undefined;
    } | null | undefined;
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null | undefined;
      readonly message: string;
    }>;
  };
};
export type ReviewMerchantFeedCandidateMutation = {
  response: ReviewMerchantFeedCandidateMutation$data;
  variables: ReviewMerchantFeedCandidateMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "input"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "ReviewMerchantFeedCandidatePayload",
    "kind": "LinkedField",
    "name": "reviewMerchantFeedCandidate",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "MerchantFeedCandidate",
        "kind": "LinkedField",
        "name": "candidate",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "id",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "reviewStatus",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "reviewNote",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "reviewedAt",
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "MutationError",
        "kind": "LinkedField",
        "name": "errors",
        "plural": true,
        "selections": [
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "code",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "field",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "message",
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "ReviewMerchantFeedCandidateMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "ReviewMerchantFeedCandidateMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "c47f9eb57890b2430c9010fc40a0e118",
    "id": null,
    "metadata": {},
    "name": "ReviewMerchantFeedCandidateMutation",
    "operationKind": "mutation",
    "text": "mutation ReviewMerchantFeedCandidateMutation(\n  $input: ReviewMerchantFeedCandidateInput!\n) {\n  reviewMerchantFeedCandidate(input: $input) {\n    candidate {\n      id\n      reviewStatus\n      reviewNote\n      reviewedAt\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "fd604445072f88eaa60961950fe54c48";

export default node;
