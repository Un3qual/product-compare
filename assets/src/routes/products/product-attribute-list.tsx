export interface ProductAttributeListItem {
  code: string;
  displayName: string;
  valueText: string;
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
