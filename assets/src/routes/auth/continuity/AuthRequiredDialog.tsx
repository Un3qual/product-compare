import { create, props } from "@stylexjs/stylex";
import { Link } from "react-router-dom";
import { Button } from "$ui/primitives/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "$ui/primitives/Dialog";
import { tokens } from "$ui/theme/tokens.stylex";
import { writePendingIntent, type PendingIntent } from "./pending-intent";

const styles = create({
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
    justifyContent: "end",
  },
  copy: {
    color: tokens.textSecondary,
    margin: 0,
  },
});

export function AuthRequiredDialog({
  intent,
  onOpenChange,
  open,
}: {
  intent: PendingIntent;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const copy = authRequiredCopy(intent.kind);
  const query = new URLSearchParams({ returnTo: intent.returnTo, intent: intent.kind }).toString();
  const preserveIntent = () => writePendingIntent(intent);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent showCloseButton={false}>
        <DialogTitle>{copy.title}</DialogTitle>
        <DialogDescription>{copy.description}</DialogDescription>
        <p {...props(styles.copy)}>Your entered values stay here until you return.</p>
        <div {...props(styles.actions)}>
          <Button onClick={preserveIntent} render={<Link to={`/auth/login?${query}`} />}>
            Sign in
          </Button>
          <Button
            onClick={preserveIntent}
            render={<Link to={`/auth/register?${query}`} />}
            variant="secondary"
          >
            Create account
          </Button>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function authRequiredCopy(kind: PendingIntent["kind"]) {
  return kind === "price_watch"
    ? {
        title: "Sign in to watch this product",
        description: "Sign in to receive updates when this product matches your watch rule.",
      }
    : {
        title: "Sign in to save this comparison",
        description: "Sign in to keep this product set available for your next decision.",
      };
}
