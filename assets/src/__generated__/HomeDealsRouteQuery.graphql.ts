/**
 * @generated SignedSource<<f7f34b7c8259684d000216e8e6c29091>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type HomeDealReasonCode = "CURRENT_COMPARISON" | "NEW_OFFER" | "SAVED_COMPARISON" | "TRENDING_BELOW_MEDIAN" | "WATCH_TARGET" | "%future added value";
export type HomeDealsRouteQuery$variables = {
  selectedSlugs: ReadonlyArray<string>;
};
export type HomeDealsRouteQuery$data = {
  readonly homeDeals: {
    readonly forYou: ReadonlyArray<{
      readonly offer: {
        readonly currency: string;
        readonly landedPrice: any;
        readonly merchantName: string;
        readonly observedAt: any;
      };
      readonly product: {
        readonly id: string;
        readonly name: string;
        readonly slug: string;
      };
      readonly reasons: ReadonlyArray<{
        readonly code: HomeDealReasonCode;
        readonly watchTarget: any | null | undefined;
      }>;
    }>;
    readonly new: ReadonlyArray<{
      readonly offer: {
        readonly currency: string;
        readonly landedPrice: any;
        readonly merchantName: string;
        readonly observedAt: any;
      };
      readonly product: {
        readonly id: string;
        readonly name: string;
        readonly slug: string;
      };
      readonly reasons: ReadonlyArray<{
        readonly code: HomeDealReasonCode;
        readonly watchTarget: any | null | undefined;
      }>;
    }>;
    readonly trending: ReadonlyArray<{
      readonly offer: {
        readonly currency: string;
        readonly landedPrice: any;
        readonly merchantName: string;
        readonly observedAt: any;
      };
      readonly product: {
        readonly id: string;
        readonly name: string;
        readonly slug: string;
      };
      readonly reasons: ReadonlyArray<{
        readonly code: HomeDealReasonCode;
        readonly watchTarget: any | null | undefined;
      }>;
    }>;
  };
};
export type HomeDealsRouteQuery = {
  response: HomeDealsRouteQuery$data;
  variables: HomeDealsRouteQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "selectedSlugs"
  }
],
v1 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "Product",
    "kind": "LinkedField",
    "name": "product",
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
        "name": "name",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "slug",
        "storageKey": null
      }
    ],
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "concreteType": "HomeOfferSummary",
    "kind": "LinkedField",
    "name": "offer",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "merchantName",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "currency",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "landedPrice",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "observedAt",
        "storageKey": null
      }
    ],
    "storageKey": null
  },
  {
    "alias": null,
    "args": null,
    "concreteType": "HomeDealReason",
    "kind": "LinkedField",
    "name": "reasons",
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
        "name": "watchTarget",
        "storageKey": null
      }
    ],
    "storageKey": null
  }
],
v2 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "selectedSlugs",
        "variableName": "selectedSlugs"
      }
    ],
    "concreteType": "HomeDeals",
    "kind": "LinkedField",
    "name": "homeDeals",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "HomeDeal",
        "kind": "LinkedField",
        "name": "new",
        "plural": true,
        "selections": (v1/*: any*/),
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "HomeDeal",
        "kind": "LinkedField",
        "name": "trending",
        "plural": true,
        "selections": (v1/*: any*/),
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "HomeDeal",
        "kind": "LinkedField",
        "name": "forYou",
        "plural": true,
        "selections": (v1/*: any*/),
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
    "name": "HomeDealsRouteQuery",
    "selections": (v2/*: any*/),
    "type": "RootQueryType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "HomeDealsRouteQuery",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "1395381ec2032c525b6256d5c8e09b4a",
    "id": null,
    "metadata": {},
    "name": "HomeDealsRouteQuery",
    "operationKind": "query",
    "text": "query HomeDealsRouteQuery(\n  $selectedSlugs: [String!]!\n) {\n  homeDeals(selectedSlugs: $selectedSlugs) {\n    new {\n      product {\n        id\n        name\n        slug\n      }\n      offer {\n        merchantName\n        currency\n        landedPrice\n        observedAt\n      }\n      reasons {\n        code\n        watchTarget\n      }\n    }\n    trending {\n      product {\n        id\n        name\n        slug\n      }\n      offer {\n        merchantName\n        currency\n        landedPrice\n        observedAt\n      }\n      reasons {\n        code\n        watchTarget\n      }\n    }\n    forYou {\n      product {\n        id\n        name\n        slug\n      }\n      offer {\n        merchantName\n        currency\n        landedPrice\n        observedAt\n      }\n      reasons {\n        code\n        watchTarget\n      }\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "b36402beadd1c8e2feb0059d989f4716";

export default node;
