import * as stylex from "@stylexjs/stylex";
import { StatusBadge } from "../../src/ui/components/status/StatusBadge";
import { Button, Input, Table } from "../../src/ui/primitives/index";

const styles = stylex.create({
  root: {
    backgroundColor: "rebeccapurple",
  },
});

test("styled primitives accept compiled StyleX rules", () => {
  expect(<Button style={styles.root}>Save</Button>).toBeTruthy();
  expect(<Input aria-label="Search" style={styles.root} />).toBeTruthy();
  expect(<Table style={styles.root} />).toBeTruthy();
  expect(<StatusBadge style={styles.root}>Current</StatusBadge>).toBeTruthy();
});

test("styled primitives reject raw class names", () => {
  // @ts-expect-error Styled primitives compose compiled StyleX rules through `style`.
  const button = <Button className="legacy-class">Save</Button>;
  // @ts-expect-error Styled primitives compose compiled StyleX rules through `style`.
  const input = <Input aria-label="Search" className="legacy-class" />;
  // @ts-expect-error Styled primitives compose compiled StyleX rules through `style`.
  const table = <Table className="legacy-class" />;
  // @ts-expect-error Styled components compose compiled StyleX rules through `style`.
  const statusBadge = <StatusBadge className="legacy-class">Current</StatusBadge>;

  expect([button, input, table, statusBadge]).toHaveLength(4);
});
