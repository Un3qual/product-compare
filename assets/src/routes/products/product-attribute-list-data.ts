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

export function buildProductAttributeListData(attributes: ReadonlyArray<ProductAttributeListItem>) {
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

    const groupKey = label.toLowerCase();
    const group = groups.get(groupKey);

    if (group) {
      group.attributes.push(attribute);
    } else {
      groups.set(groupKey, {
        label,
        attributes: [attribute],
      });
    }
  }

  return {
    groupedAttributes: Array.from(groups.values()),
    ungroupedAttributes,
  };
}

function normalizedGroupLabel(groupLabel: string | null | undefined) {
  const trimmedLabel = groupLabel?.trim();

  return trimmedLabel ? trimmedLabel : null;
}
