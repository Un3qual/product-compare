import { useId } from "react";
import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router";

export type ProductDecisionCompareAction =
  | { kind: "add"; href: string }
  | { kind: "selected" }
  | { kind: "full" };

type ProductDecisionActionsProps = {
  browseHref: string;
  compareAction: ProductDecisionCompareAction;
  offerHref: string;
};

const styles = create({
  actions: {
    display: "grid",
    gap: "0.65rem",
  },
  actionList: {
    display: "grid",
    gap: "0.65rem",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
});

export function ProductDecisionActions({
  browseHref,
  compareAction,
  offerHref,
}: ProductDecisionActionsProps) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} {...props(styles.actions)}>
      <h2 id={titleId}>Next steps</h2>
      <ul {...props(styles.actionList)}>
        <CompareAction action={compareAction} />
        <li>
          <Link to={offerHref}>Review active offers</Link>
        </li>
        <li>
          <Link to={browseHref}>Browse products</Link>
        </li>
      </ul>
    </section>
  );
}

function CompareAction({ action }: { action: ProductDecisionCompareAction }) {
  switch (action.kind) {
    case "add":
      return (
        <li>
          <Link to={action.href}>Add this product to compare</Link>
        </li>
      );
    case "selected":
      return <li>This product is selected for comparison</li>;
    case "full":
      return <li>Compare selection full</li>;
    default:
      return unexpectedCompareAction(action);
  }
}

function unexpectedCompareAction(action: never): never {
  throw new TypeError(`Unexpected product decision compare action: ${JSON.stringify(action)}`);
}
