/**
 * @generated SignedSource<<27b1c9b06b6ba08512306523f0d8756f>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ProductCommunityPanel_reviews$data = {
  readonly id: string;
  readonly reviews: {
    readonly edges: ReadonlyArray<{
      readonly node: {
        readonly id: string;
        readonly " $fragmentSpreads": FragmentRefs<"ProductCommunityItems_review">;
      };
    }>;
  };
  readonly " $fragmentType": "ProductCommunityPanel_reviews";
};
export type ProductCommunityPanel_reviews$key = {
  readonly " $data"?: ProductCommunityPanel_reviews$data;
  readonly " $fragmentSpreads": FragmentRefs<"ProductCommunityPanel_reviews">;
};

import ProductCommunityReviewsPaginationQuery_graphql from './ProductCommunityReviewsPaginationQuery.graphql';

const node: ReaderFragment = (function(){
var v0 = [
  "reviews"
],
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
};
return {
  "argumentDefinitions": [
    {
      "defaultValue": null,
      "kind": "LocalArgument",
      "name": "reviewFirst"
    },
    {
      "defaultValue": null,
      "kind": "LocalArgument",
      "name": "reviewsAfter"
    }
  ],
  "kind": "Fragment",
  "metadata": {
    "connection": [
      {
        "count": "reviewFirst",
        "cursor": "reviewsAfter",
        "direction": "forward",
        "path": (v0/*:: as any*/)
      }
    ],
    "refetch": {
      "connection": {
        "forward": {
          "count": "reviewFirst",
          "cursor": "reviewsAfter"
        },
        "backward": null,
        "path": (v0/*:: as any*/)
      },
      "fragmentPathInResult": [
        "node"
      ],
      "operation": ProductCommunityReviewsPaginationQuery_graphql,
      "identifierInfo": {
        "identifierField": "id",
        "identifierQueryVariableName": "id"
      }
    }
  },
  "name": "ProductCommunityPanel_reviews",
  "selections": [
    {
      "alias": "reviews",
      "args": null,
      "concreteType": "ProductReviewConnection",
      "kind": "LinkedField",
      "name": "__ProductCommunityPanel_reviews_connection",
      "plural": false,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "ProductReviewEdge",
          "kind": "LinkedField",
          "name": "edges",
          "plural": true,
          "selections": [
            {
              "alias": null,
              "args": null,
              "concreteType": "ProductReview",
              "kind": "LinkedField",
              "name": "node",
              "plural": false,
              "selections": [
                (v1/*:: as any*/),
                {
                  "args": null,
                  "kind": "FragmentSpread",
                  "name": "ProductCommunityItems_review"
                },
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "__typename",
                  "storageKey": null
                }
              ],
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "cursor",
              "storageKey": null
            }
          ],
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "concreteType": "PageInfo",
          "kind": "LinkedField",
          "name": "pageInfo",
          "plural": false,
          "selections": [
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "endCursor",
              "storageKey": null
            },
            {
              "alias": null,
              "args": null,
              "kind": "ScalarField",
              "name": "hasNextPage",
              "storageKey": null
            }
          ],
          "storageKey": null
        }
      ],
      "storageKey": null
    },
    (v1/*:: as any*/)
  ],
  "type": "Product",
  "abstractKey": null
};
})();

(node as any).hash = "a35c4c07997ad17830ad0cccf40a3936";

export default node;
