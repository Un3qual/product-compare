/**
 * @generated SignedSource<<5cb07366dd3e9413da187c8799afb8f5>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CommunityContentType = "ANSWER" | "QUESTION" | "REVIEW" | "%future added value";
export type RemoveCommunityContentInput = {
  contentId: string;
  contentType: CommunityContentType;
};
export type ProductCommunityItemsRemoveCommunityContentMutation$variables = {
  input: RemoveCommunityContentInput;
};
export type ProductCommunityItemsRemoveCommunityContentMutation$data = {
  readonly removeCommunityContent: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null | undefined;
      readonly message: string;
    }>;
    readonly removedContentId: string | null | undefined;
  };
};
export type ProductCommunityItemsRemoveCommunityContentMutation = {
  response: ProductCommunityItemsRemoveCommunityContentMutation$data;
  variables: ProductCommunityItemsRemoveCommunityContentMutation$variables;
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
    "concreteType": "RemoveCommunityContentPayload",
    "kind": "LinkedField",
    "name": "removeCommunityContent",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "removedContentId",
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
    "name": "ProductCommunityItemsRemoveCommunityContentMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "ProductCommunityItemsRemoveCommunityContentMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "d0f4ec15feae3e57550a633bc1f5e2b4",
    "id": null,
    "metadata": {},
    "name": "ProductCommunityItemsRemoveCommunityContentMutation",
    "operationKind": "mutation",
    "text": "mutation ProductCommunityItemsRemoveCommunityContentMutation(\n  $input: RemoveCommunityContentInput!\n) {\n  removeCommunityContent(input: $input) {\n    removedContentId\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "27f8b70370e9afb3e0b62078fa77ecc1";

export default node;
