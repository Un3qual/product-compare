export interface ProductAttributeListItem {
  attributeId?: string;
  code: string;
  displayName: string;
  valueText: string;
  sortOrder?: number | null;
  groupLabel?: string | null;
  isRequired?: boolean;
  numericValue?: string | null;
  booleanValue?: boolean | null;
  enumOptionId?: string | null;
  unitSymbol?: string | null;
}

export function ProductAttributeList({
  attributes,
  emptyMessage
}: {
  attributes: ReadonlyArray<ProductAttributeListItem>;
  emptyMessage: string;
}) {
  if (attributes.length === 0) {
    return <p>{emptyMessage}</p>;
  }

  const { groupedAttributes, ungroupedAttributes } = splitAttributesByGroupLabel(attributes);

  if (groupedAttributes.length === 0) {
    return <AttributeDefinitionList attributes={attributes} />;
  }

  return (
    <div {...stylex.props(styles.groups)}>
      {groupedAttributes.map((group) => (
        <section key={group.label} {...stylex.props(styles.group)}>
          <h3 {...stylex.props(styles.groupTitle)}>{group.label}</h3>
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
  attributes
}: {
  attributes: ReadonlyArray<ProductAttributeListItem>;
}) {
  return (
    <dl {...stylex.props(styles.list)}>
      {attributes.map((attribute) => (
        <div key={attribute.code} {...stylex.props(styles.row)}>
          <dt {...stylex.props(styles.term)}>{attribute.displayName}</dt>
          <dd {...stylex.props(styles.value)}>{attribute.valueText}</dd>
        </div>
      ))}
    </dl>
  );
}

function splitAttributesByGroupLabel(attributes: ReadonlyArray<ProductAttributeListItem>) {
  const groups = new Map<
    string,
    {
      label: string;
      attributes: ProductAttributeListItem[];
    }
  >();
  const ungroupedAttributes: ProductAttributeListItem[] = [];

  for (const attribute of attributes) {
    const label = normalizedGroupLabel(attribute.groupLabel);

    if (!label) {
      ungroupedAttributes.push(attribute);
      continue;
    }

    const groupKey = normalizedGroupLabelKey(label);
    const group = groups.get(groupKey);

    if (group) {
      group.attributes.push(attribute);
    } else {
      groups.set(groupKey, {
        label,
        attributes: [attribute]
      });
    }
  }

  return {
    groupedAttributes: Array.from(groups.values()),
    ungroupedAttributes
  };
}

function normalizedGroupLabel(groupLabel: string | null | undefined) {
  const trimmedLabel = groupLabel?.trim();

  return trimmedLabel ? trimmedLabel : null;
}

function normalizedGroupLabelKey(groupLabel: string) {
  return groupLabel.toLowerCase();
}
import * as stylex from "@stylexjs/stylex";
import { tokens } from "../../ui/theme/tokens.stylex";

const styles = stylex.create({
  groups: {
    display: "grid",
    gap: "1.5rem"
  },
  group: {
    display: "grid",
    gap: "0.75rem"
  },
  groupTitle: {
    color: tokens.textSecondary,
    fontSize: "0.85rem",
    letterSpacing: "0.06em",
    margin: 0,
    textTransform: "uppercase"
  },
  list: {
    borderBlockStartColor: tokens.borderQuiet,
    borderBlockStartStyle: "solid",
    borderBlockStartWidth: "1px",
    margin: 0
  },
  row: {
    borderBlockEndColor: tokens.borderQuiet,
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
    display: "grid",
    gap: "0.75rem",
    gridTemplateColumns: "minmax(10rem, 0.8fr) minmax(0, 1.2fr)",
    paddingBlock: "0.75rem"
  },
  term: {
    color: tokens.textSecondary,
    fontWeight: 600
  },
  value: {
    margin: 0
  }
});
