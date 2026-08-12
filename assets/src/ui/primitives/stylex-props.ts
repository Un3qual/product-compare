import type { StyleXStyles } from "@stylexjs/stylex";

export type StyleXPrimitiveProps<Props> = Omit<Props, "className" | "style"> & {
  style?: StyleXStyles;
};
