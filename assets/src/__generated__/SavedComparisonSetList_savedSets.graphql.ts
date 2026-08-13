/**
 * @generated SignedSource<<d669ab374ecde06861c0e0c4ac24076a>>
 * @lightSyntaxTransform
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type SavedComparisonSetList_savedSets$data = {
  readonly edges: ReadonlyArray<{
    readonly node: {
      readonly id: string;
      readonly items: ReadonlyArray<{
        readonly position: number;
        readonly product: {
          readonly name: string;
          readonly slug: string;
        };
      }>;
      readonly name: string;
    };
  }>;
  readonly " $fragmentType": "SavedComparisonSetList_savedSets";
};
export type SavedComparisonSetList_savedSets$key = {
  readonly " $data"?: SavedComparisonSetList_savedSets$data;
  readonly " $fragmentSpreads": FragmentRefs<"SavedComparisonSetList_savedSets">;
};

const node: ReaderFragment = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
};
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "SavedComparisonSetList_savedSets",
  "selections": [
    {
      "alias": null,
      "args": null,
      "concreteType": "SavedComparisonSetEdge",
      "kind": "LinkedField",
      "name": "edges",
      "plural": true,
      "selections": [
        {
          "alias": null,
          "args": null,
          "concreteType": "SavedComparisonSet",
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
            (v0/*:: as any*/),
            {
              "alias": null,
              "args": null,
              "concreteType": "SavedComparisonItem",
              "kind": "LinkedField",
              "name": "items",
              "plural": true,
              "selections": [
                {
                  "alias": null,
                  "args": null,
                  "kind": "ScalarField",
                  "name": "position",
                  "storageKey": null
                },
                {
                  "alias": null,
                  "args": null,
                  "concreteType": "Product",
                  "kind": "LinkedField",
                  "name": "product",
                  "plural": false,
                  "selections": [
                    (v0/*:: as any*/),
                    {
                      "alias": null,
                      "args": null,
                      "kind": "ScalarField",
                      "name": "slug",
                      "storageKey": null
                    }
                  ],
                  "storageKey": null
                }
              ],
              "storageKey": null
            }
          ],
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "SavedComparisonSetConnection",
  "abstractKey": null
};
})();

(node as any).hash = "d3343a1e549805bebc48e58762be28c5";

export default node;
