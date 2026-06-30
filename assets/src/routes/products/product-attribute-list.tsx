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
    <div>
      {groupedAttributes.map((group) => (
        <section key={group.label}>
          <h3>{group.label}</h3>
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
    <dl>
      {attributes.map((attribute) => (
        <div key={attribute.code}>
          <dt>{attribute.displayName}</dt>
          <dd>{attribute.valueText}</dd>
        </div>
      ))}
    </dl>
  );
}

function splitAttributesByGroupLabel(attributes: ReadonlyArray<ProductAttributeListItem>) {
  const groups = new Map<string, ProductAttributeListItem[]>();
  const ungroupedAttributes: ProductAttributeListItem[] = [];

  for (const attribute of attributes) {
    const label = normalizedGroupLabel(attribute.groupLabel);

    if (!label) {
      ungroupedAttributes.push(attribute);
      continue;
    }

    const groupAttributes = groups.get(label) ?? [];
    groupAttributes.push(attribute);
    groups.set(label, groupAttributes);
  }

  return {
    groupedAttributes: Array.from(groups, ([label, groupAttributes]) => ({
      label,
      attributes: groupAttributes
    })),
    ungroupedAttributes
  };
}

function normalizedGroupLabel(groupLabel: string | null | undefined) {
  const trimmedLabel = groupLabel?.trim();

  return trimmedLabel ? trimmedLabel : null;
}
