/**
 * @generated SignedSource<<1d19572d636d814bce410e6e43df6865>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type UpsertAffiliateLinkInput = {
  affiliateNetworkId?: string | null | undefined;
  affiliateUrl: string;
  lastVerifiedAt?: any | null | undefined;
  merchantProductId: string;
  originalUrl: string;
};
export type UpsertAffiliateLinkMutation$variables = {
  input: UpsertAffiliateLinkInput;
};
export type UpsertAffiliateLinkMutation$data = {
  readonly upsertAffiliateLink: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null | undefined;
      readonly message: string;
    }>;
    readonly link: {
      readonly affiliateNetworkId: string | null | undefined;
      readonly affiliateUrl: string;
      readonly id: string;
      readonly lastVerifiedAt: any | null | undefined;
      readonly merchantProductId: string;
      readonly originalUrl: string;
    } | null | undefined;
  } | null | undefined;
};
export type UpsertAffiliateLinkMutation = {
  response: UpsertAffiliateLinkMutation$data;
  variables: UpsertAffiliateLinkMutation$variables;
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
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "UpsertAffiliateLinkMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "UpsertAffiliateLinkMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "8a1436bca6bc7b07f4d007702f76600c",
    "id": null,
    "metadata": {},
    "name": "UpsertAffiliateLinkMutation",
    "operationKind": "mutation",
    "text": "mutation UpsertAffiliateLinkMutation(\n  $input: UpsertAffiliateLinkInput!\n) {\n  upsertAffiliateLink(input: $input) {\n    link {\n      id\n      merchantProductId\n      affiliateNetworkId\n      originalUrl\n      affiliateUrl\n      lastVerifiedAt\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "3778b8ef472a3805cf812f648211a5b4";

export default node;
