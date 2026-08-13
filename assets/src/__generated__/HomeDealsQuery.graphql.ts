/**
 * @generated SignedSource<<654a20790cad2e79d6452584a13a04d8>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type HomeDealsQuery$variables = {
  first: number;
  selectedSlugs: ReadonlyArray<string>;
};
export type HomeDealsQuery$data = {
  readonly homeDeals: {
    readonly forYou: {
      readonly edges: ReadonlyArray<{
        readonly cursor: string;
        readonly " $fragmentSpreads": FragmentRefs<"HomeDeals_deal">;
      }>;
    };
    readonly new: {
      readonly edges: ReadonlyArray<{
        readonly cursor: string;
        readonly " $fragmentSpreads": FragmentRefs<"HomeDeals_deal">;
      }>;
    };
    readonly trending: {
      readonly edges: ReadonlyArray<{
        readonly cursor: string;
        readonly " $fragmentSpreads": FragmentRefs<"HomeDeals_deal">;
      }>;
    };
  };
};
export type HomeDealsQuery = {
  response: HomeDealsQuery$data;
  variables: HomeDealsQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "first"
},
v1 = {
  "defaultValue": null,
  "kind": "LocalArgument",
  "name": "selectedSlugs"
},
v2 = [
  {
    "kind": "Variable",
    "name": "selectedSlugs",
    "variableName": "selectedSlugs"
  }
],
v3 = [
  {
    "kind": "Variable",
    "name": "first",
    "variableName": "first"
  }
],
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "cursor",
  "storageKey": null
},
v5 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "HomeDealsEdge",
    "kind": "LinkedField",
    "name": "edges",
    "plural": true,
    "selections": [
      (v4/*:: as any*/),
      {
        "args": null,
        "kind": "FragmentSpread",
        "name": "HomeDeals_deal"
      }
    ],
    "storageKey": null
  }
],
v6 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "HomeDealsEdge",
    "kind": "LinkedField",
    "name": "edges",
    "plural": true,
    "selections": [
      (v4/*:: as any*/),
      {
        "alias": null,
        "args": null,
        "concreteType": "Product",
        "kind": "LinkedField",
        "name": "node",
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
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [
      (v0/*:: as any*/),
      (v1/*:: as any*/)
    ],
    "kind": "Fragment",
    "metadata": null,
    "name": "HomeDealsQuery",
    "selections": [
      {
        "alias": null,
        "args": (v2/*:: as any*/),
        "concreteType": "HomeDeals",
        "kind": "LinkedField",
        "name": "homeDeals",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": (v3/*:: as any*/),
            "concreteType": "HomeDealsConnection",
            "kind": "LinkedField",
            "name": "new",
            "plural": false,
            "selections": (v5/*:: as any*/),
            "storageKey": null
          },
          {
            "alias": null,
            "args": (v3/*:: as any*/),
            "concreteType": "HomeDealsConnection",
            "kind": "LinkedField",
            "name": "trending",
            "plural": false,
            "selections": (v5/*:: as any*/),
            "storageKey": null
          },
          {
            "alias": null,
            "args": (v3/*:: as any*/),
            "concreteType": "HomeDealsConnection",
            "kind": "LinkedField",
            "name": "forYou",
            "plural": false,
            "selections": (v5/*:: as any*/),
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ],
    "type": "RootQueryType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [
      (v1/*:: as any*/),
      (v0/*:: as any*/)
    ],
    "kind": "Operation",
    "name": "HomeDealsQuery",
    "selections": [
      {
        "alias": null,
        "args": (v2/*:: as any*/),
        "concreteType": "HomeDeals",
        "kind": "LinkedField",
        "name": "homeDeals",
        "plural": false,
        "selections": [
          {
            "alias": null,
            "args": (v3/*:: as any*/),
            "concreteType": "HomeDealsConnection",
            "kind": "LinkedField",
            "name": "new",
            "plural": false,
            "selections": (v6/*:: as any*/),
            "storageKey": null
          },
          {
            "alias": null,
            "args": (v3/*:: as any*/),
            "concreteType": "HomeDealsConnection",
            "kind": "LinkedField",
            "name": "trending",
            "plural": false,
            "selections": (v6/*:: as any*/),
            "storageKey": null
          },
          {
            "alias": null,
            "args": (v3/*:: as any*/),
            "concreteType": "HomeDealsConnection",
            "kind": "LinkedField",
            "name": "forYou",
            "plural": false,
            "selections": (v6/*:: as any*/),
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "088a369c3835829c24ccaa8a31d69707",
    "id": null,
    "metadata": {},
    "name": "HomeDealsQuery",
    "operationKind": "query",
    "text": "query HomeDealsQuery(\n  $selectedSlugs: [String!]!\n  $first: Int!\n) {\n  homeDeals(selectedSlugs: $selectedSlugs) {\n    new(first: $first) {\n      edges {\n        cursor\n        ...HomeDeals_deal\n      }\n    }\n    trending(first: $first) {\n      edges {\n        cursor\n        ...HomeDeals_deal\n      }\n    }\n    forYou(first: $first) {\n      edges {\n        cursor\n        ...HomeDeals_deal\n      }\n    }\n  }\n}\n\nfragment HomeDeals_deal on HomeDealsEdge {\n  node {\n    id\n    name\n    slug\n  }\n  offer {\n    merchantName\n    currency\n    landedPrice\n    observedAt\n  }\n  reasons {\n    code\n    watchTarget\n  }\n}\n"
  }
};
})();

(node as any).hash = "510aa2ca82d1e6ecb1b38c4c19e7ccdc";

export default node;
