/**
 * @generated SignedSource<<1e799ad67b08d1a7ab8a7f3c6000c4f9>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type PriceWatchRuleType = "BACK_IN_STOCK" | "NEWLY_AVAILABLE" | "PERCENTAGE_DROP" | "TARGET_PRICE" | "%future added value";
export type CreatePriceWatchInput = {
  cooldownSeconds?: number | null | undefined;
  currency: string;
  merchantProductId?: string | null | undefined;
  percentageDrop?: any | null | undefined;
  productId: string;
  ruleType: PriceWatchRuleType;
  targetAmount?: any | null | undefined;
};
export type productMutationsCreatePriceWatchMutation$variables = {
  input: CreatePriceWatchInput;
};
export type productMutationsCreatePriceWatchMutation$data = {
  readonly createPriceWatch: {
    readonly errors: ReadonlyArray<{
      readonly code: string;
      readonly field: string | null | undefined;
      readonly message: string;
    }>;
    readonly watch: {
      readonly currency: string;
      readonly enabled: boolean;
      readonly id: string;
      readonly percentageDrop: any | null | undefined;
      readonly productName: string;
      readonly ruleType: PriceWatchRuleType;
      readonly targetAmount: any | null | undefined;
    } | null | undefined;
  };
};
export type productMutationsCreatePriceWatchMutation = {
  response: productMutationsCreatePriceWatchMutation$data;
  variables: productMutationsCreatePriceWatchMutation$variables;
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
    "concreteType": "PriceWatchPayload",
    "kind": "LinkedField",
    "name": "createPriceWatch",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "PriceWatch",
        "kind": "LinkedField",
        "name": "watch",
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
            "name": "productName",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "ruleType",
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
            "name": "targetAmount",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "percentageDrop",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "enabled",
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
    "name": "productMutationsCreatePriceWatchMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "productMutationsCreatePriceWatchMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "e57542f9c9adfb2bd07c86b721e25ea8",
    "id": null,
    "metadata": {},
    "name": "productMutationsCreatePriceWatchMutation",
    "operationKind": "mutation",
    "text": "mutation productMutationsCreatePriceWatchMutation(\n  $input: CreatePriceWatchInput!\n) {\n  createPriceWatch(input: $input) {\n    watch {\n      id\n      productName\n      ruleType\n      currency\n      targetAmount\n      percentageDrop\n      enabled\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "b72d24592fd4a1db78a07c072a40efc6";

export default node;
