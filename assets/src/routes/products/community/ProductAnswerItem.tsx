import { type FormEvent, useId } from "react";
import { props } from "@stylexjs/stylex";
import { useFragment, useMutation } from "react-relay";
import type {
  ProductCommunityItems_answer$data,
  ProductCommunityItems_answer$key,
} from "$generated/ProductCommunityItems_answer.graphql";
import type { ProductCommunityOperationsUpdateProductAnswerMutation } from "$generated/ProductCommunityOperationsUpdateProductAnswerMutation.graphql";
import { Label } from "$ui/primitives/Label";
import { Textarea } from "$ui/primitives/Textarea";
import { commitRouteMutationPromise } from "$relay/mutations";
import { DEFAULT_MUTATION_ERROR_MESSAGE } from "$relay/mutation-errors";
import {
  applyCommunityUpdate,
  CommunityOwnerActions,
  EditActions,
  ModerationStatus,
  normalizedFormText,
  RowMessage,
  UnavailableArticle,
  useCommunityItemState,
  type CommunityItemState,
} from "./CommunityContentActions";
import {
  acceptedAnswerAuthorLabel,
  resolveProductAnswerUpdateMessage,
} from "./product-community-data";
import { productCommunityStyles as styles } from "./product-community-styles";
import { answerFragment } from "./ProductCommunityItems";
import { updateProductAnswerMutation } from "./ProductCommunityOperations";

type Answer = ProductCommunityItems_answer$data;

export function AnswerView({
  acceptedAnswerId,
  answer: answerRef,
  ownerView = false,
}: {
  acceptedAnswerId?: string | null;
  answer: ProductCommunityItems_answer$key;
  ownerView?: boolean;
}) {
  const answer = useFragment(answerFragment, answerRef);
  const state = useCommunityItemState();
  const { pending, submit } = useAnswerUpdate(answer, ownerView, state);

  if (state.unavailableMessage) {
    return (
      <UnavailableArticle
        label={`Answer by ${answer.authorLabel}`}
        message={state.unavailableMessage}
      />
    );
  }

  return (
    <article aria-label={`Answer by ${answer.authorLabel}`} {...props(styles.answer)}>
      <ModerationStatus ownerView={ownerView} status={answer.moderationStatus} />
      <p>{answer.body}</p>
      <p {...props(styles.metadata)}>
        {acceptedAnswerAuthorLabel(answer.id, acceptedAnswerId ?? null, answer.authorLabel)}
      </p>
      <AnswerEditForm
        answer={answer}
        editing={state.editing}
        pending={pending}
        onCancel={state.cancelEditing}
        onSubmit={submit}
      />
      <CommunityOwnerActions
        canEdit={answer.viewerCanEdit}
        canRemove={answer.viewerCanRemove}
        contentId={answer.id}
        contentType="ANSWER"
        editing={state.editing}
        label="answer"
        onEdit={state.startEditing}
        onRemoved={state.markRemoved}
      />
      <RowMessage message={state.message} />
    </article>
  );
}

function useAnswerUpdate(answer: Answer, ownerView: boolean, state: CommunityItemState) {
  const [commitUpdate, pending] =
    useMutation<ProductCommunityOperationsUpdateProductAnswerMutation>(updateProductAnswerMutation);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitUpdate, {
        variables: { input: { id: answer.id, body: normalizedFormText(form.get("body")) } },
      });
      const payload = response.updateProductAnswer;
      const nextMessage = resolveProductAnswerUpdateMessage(payload, graphQLErrors);
      applyCommunityUpdate(payload.answer, nextMessage, graphQLErrors, ownerView, state);
    } catch {
      state.setMessage(DEFAULT_MUTATION_ERROR_MESSAGE);
    }
  }

  return { pending, submit };
}

function AnswerEditForm({
  answer,
  editing,
  pending,
  onCancel,
  onSubmit,
}: {
  answer: Answer;
  editing: boolean;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const fieldId = useId();

  if (!editing) return null;

  return (
    <form onSubmit={onSubmit} {...props(styles.form)}>
      <Label htmlFor={`${fieldId}-body`} style={styles.field}>
        Edit answer body
        <Textarea
          id={`${fieldId}-body`}
          name="body"
          defaultValue={answer.body}
          required
          maxLength={5000}
          rows={3}
          style={styles.input}
        />
      </Label>
      <EditActions label="answer" onCancel={onCancel} pending={pending} />
    </form>
  );
}
