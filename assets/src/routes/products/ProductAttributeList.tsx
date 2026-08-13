import { create, props } from "@stylexjs/stylex";
import { tokens } from "$ui/theme/tokens.stylex";
import { groupProductSpecifications, type ProductSpecification } from "./specifications";

const styles = create({
  groups: {
    display: "grid",
    gap: "1.5rem",
  },
  group: {
    display: "grid",
    gap: "0.75rem",
  },
  groupTitle: {
    color: tokens.textSecondary,
    fontSize: "0.85rem",
    letterSpacing: "0.06em",
    margin: 0,
    textTransform: "uppercase",
  },
  list: {
    borderBlockStartColor: tokens.borderQuiet,
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "1px",
    margin: 0,
  },
  row: {
    borderBlockEndColor: tokens.borderQuiet,
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
    display: "grid",
    gap: "0.75rem",
    gridTemplateColumns: "minmax(10rem, 0.8fr) minmax(0, 1.2fr)",
    paddingBlock: "0.75rem",
  },
  term: {
    color: tokens.textSecondary,
    fontWeight: 600,
  },
  value: {
    margin: 0,
  },
});

export function ProductAttributeList({
  attributes,
  emptyMessage,
}: {
  attributes: ReadonlyArray<ProductSpecification>;
  emptyMessage: string;
}) {
  if (attributes.length === 0) {
    return <p>{emptyMessage}</p>;
  }

  const { groupedAttributes, ungroupedAttributes } = groupProductSpecifications(attributes);

  if (groupedAttributes.length === 0) {
    return <AttributeDefinitionList attributes={attributes} />;
  }

  return (
    <div {...props(styles.groups)}>
      {groupedAttributes.map((group) => (
        <section key={group.label} {...props(styles.group)}>
          <h3 {...props(styles.groupTitle)}>{group.label}</h3>
          <AttributeDefinitionList attributes={group.attributes} />
        </section>
      ))}
      {ungroupedAttributes.length > 0 ? (
        <AttributeDefinitionList attributes={ungroupedAttributes} />
      ) : null}
    </div>
  );
}

function AttributeDefinitionList({
  attributes,
}: {
  attributes: ReadonlyArray<ProductSpecification>;
}) {
  return (
    <dl {...props(styles.list)}>
      {attributes.map((attribute) => (
        <div key={attribute.code} {...props(styles.row)}>
          <dt {...props(styles.term)}>{attribute.displayName}</dt>
          <dd {...props(styles.value)}>{attribute.valueText}</dd>
        </div>
      ))}
    </dl>
  );
}
