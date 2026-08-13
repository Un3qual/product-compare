import { useState } from "react";
import { props } from "@stylexjs/stylex";
import { useMutation } from "react-relay";
import type { ProductCommunityOperationsRemoveCommunityContentMutation } from "$generated/ProductCommunityOperationsRemoveCommunityContentMutation.graphql";
import { Button } from "$ui/primitives/Button";
import { commitRouteMutationPromise } from "../../relay-mutations";
import {
  DEFAULT_MUTATION_ERROR_MESSAGE,
  hasGraphQLErrors,
  type MutationGraphQLErrors,
} from "$relay/mutation-errors";
import { resolveCommunityContentRemovalMessage } from "./product-community-data";
import { productCommunityStyles as styles } from "./product-community-styles";
import { removeCommunityContentMutation } from "./ProductCommunityOperations";

type CommunityContentType = "REVIEW" | "QUESTION" | "ANSWER";
export type CommunityContentLabel = "review" | "question" | "answer";

export function useCommunityItemState() {
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [resubmittedMessage, setResubmittedMessage] = useState<string | null>(null);

  return {
    cancelEditing: () => setEditing(false),
    completeUpdate(nextMessage: string, ownerView: boolean) {
      setMessage(nextMessage);
      setEditing(false);
      if (!ownerView) setResubmittedMessage(nextMessage);
    },
    editing,
    markRemoved: () => setRemoved(true),
    message,
    setMessage,
    startEditing: () => setEditing(true),
    unavailableMessage: resubmittedMessage ?? (removed ? "Community content removed." : null),
  };
}

export type CommunityItemState = ReturnType<typeof useCommunityItemState>;

export function applyCommunityUpdate(
  content: object | null | undefined,
  nextMessage: string,
  graphQLErrors: MutationGraphQLErrors,
  ownerView: boolean,
  state: CommunityItemState,
) {
  if (!content || hasGraphQLErrors(graphQLErrors)) {
    state.setMessage(nextMessage);
    return;
  }

  state.completeUpdate(nextMessage, ownerView);
}

export function EditActions({
  label,
  onCancel,
  pending,
}: {
  label: CommunityContentLabel;
  onCancel: () => void;
  pending: boolean;
}) {
  return (
    <div {...props(styles.actions)}>
      <Button disabled={pending} type="submit">
        {pending ? "Saving…" : `Save ${label}`}
      </Button>
      <Button onClick={onCancel} type="button" variant="ghost">
        Cancel edit
      </Button>
    </div>
  );
}

export function CommunityOwnerActions({
  canEdit,
  canRemove,
  contentId,
  contentType,
  editing,
  label,
  onEdit,
  onRemoved,
}: {
  canEdit: boolean;
  canRemove: boolean;
  contentId: string;
  contentType: CommunityContentType;
  editing: boolean;
  label: CommunityContentLabel;
  onEdit: () => void;
  onRemoved: () => void;
}) {
  if (!canEdit && !canRemove) return null;

  return (
    <div {...props(styles.actions)}>
      {canEdit && !editing ? (
        <Button onClick={onEdit} type="button" variant="link">
          Edit {label}
        </Button>
      ) : null}
      {canRemove ? (
        <RemoveCommunityControl
          contentId={contentId}
          contentType={contentType}
          label={label}
          onRemoved={onRemoved}
        />
      ) : null}
    </div>
  );
}

function RemoveCommunityControl({
  contentId,
  contentType,
  label,
  onRemoved,
}: {
  contentId: string;
  contentType: CommunityContentType;
  label: CommunityContentLabel;
  onRemoved: () => void;
}) {
  const [commitRemove, pending] =
    useMutation<ProductCommunityOperationsRemoveCommunityContentMutation>(
      removeCommunityContentMutation,
    );
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function remove() {
    try {
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitRemove, {
        variables: { input: { contentId, contentType } },
      });
      const payload = response.removeCommunityContent;
      setMessage(resolveCommunityContentRemovalMessage(payload, graphQLErrors));
      if (payload.removedContentId && !hasGraphQLErrors(graphQLErrors)) onRemoved();
    } catch {
      setMessage(DEFAULT_MUTATION_ERROR_MESSAGE);
    }
  }

  if (!confirming) {
    return (
      <>
        <Button onClick={() => setConfirming(true)} type="button" variant="link">
          Remove {label}
        </Button>
        <RowMessage message={message} />
      </>
    );
  }

  return (
    <fieldset aria-label={`Confirm removal of ${label}`} {...props(styles.confirmation)}>
      <legend>Remove this {label}?</legend>
      <div {...props(styles.actions)}>
        <Button disabled={pending} onClick={remove} type="button" variant="destructive">
          {pending ? "Removing…" : `Confirm remove ${label}`}
        </Button>
        <Button
          disabled={pending}
          onClick={() => setConfirming(false)}
          type="button"
          variant="secondary"
        >
          Cancel removal
        </Button>
      </div>
      <RowMessage message={message} />
    </fieldset>
  );
}

export function ModerationStatus({ ownerView, status }: { ownerView: boolean; status: string }) {
  if (!ownerView) return null;
  return <p {...props(styles.metadata)}>{moderationStatusCopy(status)}</p>;
}

function moderationStatusCopy(status: string) {
  switch (status) {
    case "PUBLISHED":
      return "Published";
    case "PENDING":
    case "PENDING_REVIEW":
      return "Awaiting review";
    case "HIDDEN":
      return "Hidden from shoppers";
    case "REJECTED":
      return "Changes requested";
    default:
      return "Review status unavailable";
  }
}

export function OptionalParagraph({ value }: { value: string | null | undefined }) {
  return value ? <p>{value}</p> : null;
}

export function RowMessage({ message }: { message: string | null }) {
  return message ? <p role="status">{message}</p> : null;
}

export function UnavailableListItem({ label, message }: { label: string; message: string }) {
  return (
    <li>
      <UnavailableArticle label={label} message={message} />
    </li>
  );
}

export function UnavailableArticle({ label, message }: { label: string; message: string }) {
  return (
    <article aria-label={label} {...props(styles.item)}>
      <p role="status">{message}</p>
    </article>
  );
}

export function normalizedFormText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}
