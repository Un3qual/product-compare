/**
 * @generated SignedSource<<21bdbd2bd57c0291e9545aa1ec1ad2f9>>
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
export type PriceWatchControlCreatePriceWatchMutation$variables = {
  input: CreatePriceWatchInput;
};
export type PriceWatchControlCreatePriceWatchMutation$data = {
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
export type PriceWatchControlCreatePriceWatchMutation = {
  response: PriceWatchControlCreatePriceWatchMutation$data;
  variables: PriceWatchControlCreatePriceWatchMutation$variables;
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
    "name": "PriceWatchControlCreatePriceWatchMutation",
    "selections": (v1/*: any*/),
    "type": "RootMutationType",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "PriceWatchControlCreatePriceWatchMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "4ca6eb525fbad7d400da0dddaadd7c1f",
    "id": null,
    "metadata": {},
    "name": "PriceWatchControlCreatePriceWatchMutation",
    "operationKind": "mutation",
    "text": "mutation PriceWatchControlCreatePriceWatchMutation(\n  $input: CreatePriceWatchInput!\n) {\n  createPriceWatch(input: $input) {\n    watch {\n      id\n      productName\n      ruleType\n      currency\n      targetAmount\n      percentageDrop\n      enabled\n    }\n    errors {\n      code\n      field\n      message\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "d8ccc28636b6b21750cd6d8234aef0c0";

export default node;
