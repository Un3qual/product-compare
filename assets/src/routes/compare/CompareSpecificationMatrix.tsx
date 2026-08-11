import {
  Root as ScrollAreaRoot,
  Scrollbar as ScrollAreaScrollbar,
  Thumb as ScrollAreaThumb,
  Viewport as ScrollAreaViewport,
} from "@radix-ui/react-scroll-area";
import { create, props } from "@stylexjs/stylex";
import { tokens } from "../../ui/theme/tokens.stylex";
import type { CompareProductSummary, CompareSpecMode } from "./compare-route-data";
import {
  buildSpecificationMatrixRows,
  type SpecificationMatrixRow,
} from "./specification-matrix-data";

const SPECIFICATION_MATRIX_TITLES: Record<CompareSpecMode, string> = {
  all: "All specifications",
  differences: "Different specifications",
  shared: "Shared specifications",
};
const EMPTY_SPECIFICATION_MATRIX_MESSAGES: Record<CompareSpecMode, string> = {
  all: "No specifications are available for these products yet.",
  differences: "No specification differences across these products yet.",
  shared: "No shared specifications across these products yet.",
};

const styles = create({
  tableWorkspace: {
    overflow: "hidden",
    paddingBlockEnd: "0.35rem",
  },
  tableViewport: {
    width: "100%",
  },
  tableScrollbar: {
    backgroundColor: tokens.surfaceMuted,
    display: "flex",
    height: "0.65rem",
    padding: "0.15rem",
    userSelect: "none",
  },
  tableThumb: {
    backgroundColor: tokens.borderEmphasized,
    borderRadius: "999px",
    flex: 1,
  },
  table: {
    borderCollapse: "collapse",
    minWidth: "48rem",
    width: "100%",
  },
});

export function CompareSpecificationMatrix({
  products,
  specMode,
}: {
  products: CompareProductSummary[];
  specMode: CompareSpecMode;
}) {
  if (products.length < 2) {
    return null;
  }

  const rows = buildSpecificationMatrixRows(products, specMode);
  const title = specificationMatrixTitle(specMode);

  return (
    <section aria-label="Specification comparison">
      <h2>{title}</h2>
      <ScrollAreaRoot type="auto" {...props(styles.tableWorkspace)}>
        <ScrollAreaViewport {...props(styles.tableViewport)}>
          {rows.length === 0 ? (
            <p>{emptySpecificationMatrixMessage(specMode)}</p>
          ) : (
            <SpecificationTable products={products} rows={rows} title={title} />
          )}
        </ScrollAreaViewport>
        <ScrollAreaScrollbar orientation="horizontal" {...props(styles.tableScrollbar)}>
          <ScrollAreaThumb {...props(styles.tableThumb)} />
        </ScrollAreaScrollbar>
      </ScrollAreaRoot>
    </section>
  );
}

function SpecificationTable({
  products,
  rows,
  title,
}: {
  products: CompareProductSummary[];
  rows: SpecificationMatrixRow[];
  title: string;
}) {
  return (
    <table aria-label={title} {...props(styles.table)}>
      <thead>
        <tr>
          <th scope="col">Specification</th>
          {products.map((product) => (
            <th key={product.id} scope="col">
              {product.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.code}>
            <th scope="row">{row.displayName}</th>
            {row.values.map((value, index) => (
              <td key={`${row.code}-${products[index]?.id ?? index}`}>{value}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function specificationMatrixTitle(specMode: CompareSpecMode) {
  return SPECIFICATION_MATRIX_TITLES[specMode] ?? SPECIFICATION_MATRIX_TITLES.shared;
}

function emptySpecificationMatrixMessage(specMode: CompareSpecMode) {
  return (
    EMPTY_SPECIFICATION_MATRIX_MESSAGES[specMode] ?? EMPTY_SPECIFICATION_MATRIX_MESSAGES.shared
  );
}
