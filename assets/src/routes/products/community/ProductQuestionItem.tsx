import { type FormEvent, type ReactNode, useId } from "react";
import { props } from "@stylexjs/stylex";
import { useFragment, useMutation } from "react-relay";
import type {
  ProductCommunityItems_question$data,
  ProductCommunityItems_question$key,
} from "$generated/ProductCommunityItems_question.graphql";
import type { ProductCommunityOperationsUpdateProductQuestionMutation } from "$generated/ProductCommunityOperationsUpdateProductQuestionMutation.graphql";
import { Input } from "$ui/primitives/Input";
import { Label } from "$ui/primitives/Label";
import { Textarea } from "$ui/primitives/Textarea";
import { commitRouteMutationPromise } from "../../relay-mutations";
import { DEFAULT_ROUTE_ERROR_MESSAGE } from "../../route-errors";
import {
  applyCommunityUpdate,
  CommunityOwnerActions,
  EditActions,
  ModerationStatus,
  normalizedFormText,
  OptionalParagraph,
  RowMessage,
  UnavailableListItem,
  useCommunityItemState,
  type CommunityItemState,
} from "./CommunityContentActions";
import { resolveProductQuestionUpdateMessage } from "./product-community-data";
import { productCommunityStyles as styles } from "./product-community-styles";
import { questionFragment } from "./ProductCommunityItems";
import { updateProductQuestionMutation } from "./ProductCommunityOperations";

type Question = ProductCommunityItems_question$data;

export function QuestionItem({
  children,
  ownerView = false,
  question: questionRef,
}: {
  children?: ReactNode;
  ownerView?: boolean;
  question: ProductCommunityItems_question$key;
}) {
  const question = useFragment(questionFragment, questionRef);
  const state = useCommunityItemState();
  const { pending, submit } = useQuestionUpdate(question, ownerView, state);

  if (state.unavailableMessage) {
    return (
      <UnavailableListItem
        label={`Question: ${question.title}`}
        message={state.unavailableMessage}
      />
    );
  }

  return (
    <li>
      <article aria-label={`Question: ${question.title}`} {...props(styles.item)}>
        <ModerationStatus ownerView={ownerView} status={question.moderationStatus} />
        <strong>{question.title}</strong>
        <OptionalParagraph value={question.body} />
        <p {...props(styles.metadata)}>{question.authorLabel}</p>
        <QuestionEditForm
          editing={state.editing}
          pending={pending}
          question={question}
          onCancel={state.cancelEditing}
          onSubmit={submit}
        />
        <CommunityOwnerActions
          canEdit={question.viewerCanEdit}
          canRemove={question.viewerCanRemove}
          contentId={question.id}
          contentType="QUESTION"
          editing={state.editing}
          label="question"
          onEdit={state.startEditing}
          onRemoved={state.markRemoved}
        />
        <RowMessage message={state.message} />
        {children}
      </article>
    </li>
  );
}

function useQuestionUpdate(question: Question, ownerView: boolean, state: CommunityItemState) {
  const [commitUpdate, pending] =
    useMutation<ProductCommunityOperationsUpdateProductQuestionMutation>(
      updateProductQuestionMutation,
    );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitUpdate, {
        variables: {
          input: {
            id: question.id,
            title: normalizedFormText(form.get("title")),
            body: normalizedFormText(form.get("body")),
          },
        },
      });
      const payload = response.updateProductQuestion;
      const nextMessage = resolveProductQuestionUpdateMessage(payload, graphQLErrors);
      applyCommunityUpdate(payload.question, nextMessage, graphQLErrors, ownerView, state);
    } catch {
      state.setMessage(DEFAULT_ROUTE_ERROR_MESSAGE);
    }
  }

  return { pending, submit };
}

function QuestionEditForm({
  editing,
  pending,
  question,
  onCancel,
  onSubmit,
}: {
  editing: boolean;
  pending: boolean;
  question: Question;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const fieldId = useId();

  if (!editing) return null;

  return (
    <form onSubmit={onSubmit} {...props(styles.form)}>
      <Label htmlFor={`${fieldId}-title`} style={styles.field}>
        Edit question title
        <Input
          id={`${fieldId}-title`}
          name="title"
          defaultValue={question.title}
          required
          maxLength={200}
          style={styles.input}
        />
      </Label>
      <Label htmlFor={`${fieldId}-body`} style={styles.field}>
        Edit question body
        <Textarea
          id={`${fieldId}-body`}
          name="body"
          defaultValue={question.body ?? ""}
          maxLength={5000}
          rows={3}
          style={styles.input}
        />
      </Label>
      <EditActions label="question" onCancel={onCancel} pending={pending} />
    </form>
  );
}
