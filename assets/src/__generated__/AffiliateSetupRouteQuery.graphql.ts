/**
 * @generated SignedSource<<3aa6413a09d31d5de8917706622ff483>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from "relay-runtime";
import { FragmentRefs } from "relay-runtime";
export type AffiliateSetupRouteQuery$variables = {
  after?: string | null | undefined;
  first: number;
};
export type AffiliateSetupRouteQuery$data = {
  readonly merchants:
    | {
        readonly edges: ReadonlyArray<{
          readonly cursor: string;
          readonly node: {
            readonly domain: string;
            readonly id: string;
            readonly name: string;
            readonly " $fragmentSpreads": FragmentRefs<"MerchantDirectoryView_item">;
          };
        }>;
        readonly pageInfo: {
          readonly endCursor: string | null | undefined;
          readonly hasNextPage: boolean;
          readonly hasPreviousPage: boolean;
          readonly startCursor: string | null | undefined;
        };
      }
    | null
    | undefined;
};
export type AffiliateSetupRouteQuery = {
  response: AffiliateSetupRouteQuery$data;
  variables: AffiliateSetupRouteQuery$variables;
};

const node: ConcreteRequest = (function () {
  var v0 = {
      defaultValue: null,
      kind: "LocalArgument",
      name: "after",
    },
    v1 = {
      defaultValue: null,
      kind: "LocalArgument",
      name: "first",
    },
    v2 = [
      {
        kind: "Variable",
        name: "after",
        variableName: "after",
      },
      {
        kind: "Variable",
        name: "first",
        variableName: "first",
      },
    ],
    v3 = {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "cursor",
      storageKey: null,
    },
    v4 = {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "id",
      storageKey: null,
    },
    v5 = {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "name",
      storageKey: null,
    },
    v6 = {
      alias: null,
      args: null,
      kind: "ScalarField",
      name: "domain",
      storageKey: null,
    },
    v7 = {
      alias: null,
      args: null,
      concreteType: "PageInfo",
      kind: "LinkedField",
      name: "pageInfo",
      plural: false,
      selections: [
        {
          alias: null,
          args: null,
          kind: "ScalarField",
          name: "hasNextPage",
          storageKey: null,
        },
        {
          alias: null,
          args: null,
          kind: "ScalarField",
          name: "hasPreviousPage",
          storageKey: null,
        },
        {
          alias: null,
          args: null,
          kind: "ScalarField",
          name: "startCursor",
          storageKey: null,
        },
        {
          alias: null,
          args: null,
          kind: "ScalarField",
          name: "endCursor",
          storageKey: null,
        },
      ],
      storageKey: null,
    };
  return {
    fragment: {
      argumentDefinitions: [v0 /*: any*/, v1 /*: any*/],
      kind: "Fragment",
      metadata: null,
      name: "AffiliateSetupRouteQuery",
      selections: [
        {
          alias: null,
          args: v2 /*: any*/,
          concreteType: "MerchantConnection",
          kind: "LinkedField",
          name: "merchants",
          plural: false,
          selections: [
            {
              alias: null,
              args: null,
              concreteType: "MerchantEdge",
              kind: "LinkedField",
              name: "edges",
              plural: true,
              selections: [
                v3 /*: any*/,
                {
                  alias: null,
                  args: null,
                  concreteType: "Merchant",
                  kind: "LinkedField",
                  name: "node",
                  plural: false,
                  selections: [
                    v4 /*: any*/,
                    v5 /*: any*/,
                    v6 /*: any*/,
                    {
                      args: null,
                      kind: "FragmentSpread",
                      name: "MerchantDirectoryView_item",
                    },
                  ],
                  storageKey: null,
                },
              ],
              storageKey: null,
            },
            v7 /*: any*/,
          ],
          storageKey: null,
        },
      ],
      type: "RootQueryType",
      abstractKey: null,
    },
    kind: "Request",
    operation: {
      argumentDefinitions: [v1 /*: any*/, v0 /*: any*/],
      kind: "Operation",
      name: "AffiliateSetupRouteQuery",
      selections: [
        {
          alias: null,
          args: v2 /*: any*/,
          concreteType: "MerchantConnection",
          kind: "LinkedField",
          name: "merchants",
          plural: false,
          selections: [
            {
              alias: null,
              args: null,
              concreteType: "MerchantEdge",
              kind: "LinkedField",
              name: "edges",
              plural: true,
              selections: [
                v3 /*: any*/,
                {
                  alias: null,
                  args: null,
                  concreteType: "Merchant",
                  kind: "LinkedField",
                  name: "node",
                  plural: false,
                  selections: [
                    v4 /*: any*/,
                    v5 /*: any*/,
                    v6 /*: any*/,
                    {
                      alias: null,
                      args: null,
                      kind: "ScalarField",
                      name: "slug",
                      storageKey: null,
                    },
                  ],
                  storageKey: null,
                },
              ],
              storageKey: null,
            },
            v7 /*: any*/,
          ],
          storageKey: null,
        },
      ],
    },
    params: {
      cacheID: "d7e7ad0856c15b53584d85381070d0b2",
      id: null,
      metadata: {},
      name: "AffiliateSetupRouteQuery",
      operationKind: "query",
      text: "query AffiliateSetupRouteQuery(\n  $first: Int!\n  $after: String\n) {\n  merchants(first: $first, after: $after) {\n    edges {\n      cursor\n      node {\n        id\n        name\n        domain\n        ...MerchantDirectoryView_item\n      }\n    }\n    pageInfo {\n      hasNextPage\n      hasPreviousPage\n      startCursor\n      endCursor\n    }\n  }\n}\n\nfragment MerchantDirectoryView_item on Merchant {\n  id\n  name\n  domain\n  slug\n}\n",
    },
  };
})();

(node as any).hash = "0cb82e1b3805c2d1cb161733e22695a4";

export default node;
