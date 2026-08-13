import { create, props } from "@stylexjs/stylex";
import { useNavigate } from "react-router-dom";
import { Button } from "$ui/primitives/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "$ui/primitives/Dialog";
import { tokens } from "$ui/theme/tokens.stylex";
import { writePendingIntent, type PendingIntentDraft } from "./pending-intent";

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
  intent: PendingIntentDraft;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const navigate = useNavigate();
  const copy = authRequiredCopy(intent.kind);
  const query = new URLSearchParams({ returnTo: intent.returnTo, intent: intent.kind }).toString();
  const chooseAuthPath = (path: "/auth/login" | "/auth/register") => {
    writePendingIntent(intent);
    navigate(`${path}?${query}`);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent showCloseButton={false}>
        <DialogTitle>{copy.title}</DialogTitle>
        <DialogDescription>{copy.description}</DialogDescription>
        <p {...props(styles.copy)}>Your entered values stay here until you return.</p>
        <div {...props(styles.actions)}>
          <Button onClick={() => chooseAuthPath("/auth/login")}>Sign in</Button>
          <Button
            onClick={() => chooseAuthPath("/auth/register")}
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

function authRequiredCopy(kind: PendingIntentDraft["kind"]) {
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
