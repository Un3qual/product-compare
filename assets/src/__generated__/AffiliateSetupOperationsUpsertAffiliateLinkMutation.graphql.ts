/**
 * @generated SignedSource<<e9bf41962b31481a69b0dd3002e5fdae>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type UpsertAffiliateLinkInput = {
  affiliateNetworkId?: string | null;
  affiliateUrl: string;
  lastVerifiedAt?: string | null;
  merchantProductId: string;
  originalUrl: string;
};
export type AffiliateSetupOperationsUpsertAffiliateLinkMutation$variables = {
  input: UpsertAffiliateLinkInput;
};
export type AffiliateSetupOperationsUpsertAffiliateLinkMutation$data = {
  readonly upsertAffiliateLink: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null;
      readonly message: string;
    }>;
    readonly link: {
      readonly affiliateNetworkId: string | null;
      readonly affiliateUrl: string;
      readonly id: string;
      readonly lastVerifiedAt: string | null;
      readonly merchantProductId: string;
      readonly originalUrl: string;
    } | null;
  } | null;
};
export type AffiliateSetupOperationsUpsertAffiliateLinkMutation = {
  response: AffiliateSetupOperationsUpsertAffiliateLinkMutation$data;
  variables: AffiliateSetupOperationsUpsertAffiliateLinkMutation$variables;
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
    "concreteType": "UpsertAffiliateLinkPayload",
    "kind": "LinkedField",
    "name": "upsertAffiliateLink",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "AffiliateLink",
        "kind": "LinkedField",
        "name": "link",
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
            "name": "merchantProductId",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "affiliateNetworkId",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "originalUrl",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "affiliateUrl",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "lastVerifiedAt",
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
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "AffiliateSetupOperationsUpsertAffiliateLinkMutation",
    "selections": (v1/*:: as any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*:: as any*/),
    "kind": "Operation",
    "name": "AffiliateSetupOperationsUpsertAffiliateLinkMutation",
    "selections": (v1/*:: as any*/)
  },
  "params": {
    "cacheID": "f59be7c2ae216cc7a8e33b2704b57ed7",
    "id": null,
    "metadata": {},
    "name": "AffiliateSetupOperationsUpsertAffiliateLinkMutation",
    "operationKind": "mutation",
    "text": "mutation AffiliateSetupOperationsUpsertAffiliateLinkMutation(\n  $input: UpsertAffiliateLinkInput!\n) {\n  upsertAffiliateLink(input: $input) {\n    link {\n      id\n      merchantProductId\n      affiliateNetworkId\n      originalUrl\n      affiliateUrl\n      lastVerifiedAt\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "38b90c62594b7a483fe99512a69da442";

export default node;
