import { useCallback, useRef, useState, type ReactNode } from "react";
import type { RootViewer } from "../../root/viewer";
import { AuthRequiredDialog } from "./AuthRequiredDialog";
import type { PendingIntentDraft } from "./pending-intent";

export function useAuthenticatedIntent({
  intent,
  onAuthenticated,
  viewer,
}: {
  intent: PendingIntentDraft;
  onAuthenticated: () => void;
  viewer: RootViewer | null | undefined;
}): { dialog: ReactNode; request: () => void } {
  const [dialogOpen, setDialogOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  const handleOpenChange = useCallback((open: boolean) => {
    setDialogOpen(open);

    if (!open) {
      queueMicrotask(() => triggerRef.current?.focus());
    }
  }, []);

  const request = useCallback(() => {
    if (viewer) {
      onAuthenticated();
      return;
    }

    triggerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setDialogOpen(true);
  }, [onAuthenticated, viewer]);

  return {
    request,
    dialog: (
      <AuthRequiredDialog intent={intent} onOpenChange={handleOpenChange} open={dialogOpen} />
    ),
  };
}
