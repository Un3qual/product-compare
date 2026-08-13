import { type FormEvent, type ReactNode, useId, useState } from "react";
import { props } from "@stylexjs/stylex";
import { graphql, useFragment, useMutation } from "react-relay";
import type {
  ProductCommunityItems_answer$data,
  ProductCommunityItems_answer$key,
} from "$generated/ProductCommunityItems_answer.graphql";
import type {
  ProductCommunityItems_question$data,
  ProductCommunityItems_question$key,
} from "$generated/ProductCommunityItems_question.graphql";
import type {
  ProductCommunityItems_review$data,
  ProductCommunityItems_review$key,
} from "$generated/ProductCommunityItems_review.graphql";
import type { ProductCommunityOperationsRemoveCommunityContentMutation } from "$generated/ProductCommunityOperationsRemoveCommunityContentMutation.graphql";
import type { ProductCommunityOperationsUpdateProductAnswerMutation } from "$generated/ProductCommunityOperationsUpdateProductAnswerMutation.graphql";
import type { ProductCommunityOperationsUpdateProductQuestionMutation } from "$generated/ProductCommunityOperationsUpdateProductQuestionMutation.graphql";
import type { ProductCommunityOperationsUpdateProductReviewMutation } from "$generated/ProductCommunityOperationsUpdateProductReviewMutation.graphql";
import { Button } from "$ui/primitives/Button";
import { Label } from "$ui/primitives/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "$ui/primitives/Select";
import { Textarea } from "$ui/primitives/Textarea";
import { Input } from "$ui/primitives/Input";
import { commitRouteMutationPromise } from "../../relay-mutations";
import { DEFAULT_ROUTE_ERROR_MESSAGE, hasRouteGraphQLErrors } from "../../route-errors";
import {
  acceptedAnswerAuthorLabel,
  publishedReviewRowDisplayData,
  resolveCommunityContentRemovalMessage,
  resolveProductAnswerUpdateMessage,
  resolveProductQuestionUpdateMessage,
  resolveProductReviewUpdateMessage,
} from "./product-community-data";
import { productCommunityStyles as styles } from "./product-community-styles";
import {
  removeCommunityContentMutation,
  updateProductAnswerMutation,
  updateProductQuestionMutation,
  updateProductReviewMutation,
} from "./ProductCommunityOperations";

const reviewFragment = graphql`
  fragment ProductCommunityItems_review on ProductReview {
    id
    rating
    title
    body
    verifiedPurchase
    authorLabel
    moderationStatus
    viewerCanEdit
    viewerCanRemove
  }
`;

const REVIEW_RATING_OPTIONS = [5, 4, 3, 2, 1].map((rating) => ({
  label: String(rating),
  value: String(rating),
}));

const questionFragment = graphql`
  fragment ProductCommunityItems_question on ProductQuestion {
    id
    title
    body
    authorLabel
    moderationStatus
    viewerCanEdit
    viewerCanRemove
  }
`;

const answerFragment = graphql`
  fragment ProductCommunityItems_answer on ProductAnswer {
    id
    body
    authorLabel
    moderationStatus
    viewerCanEdit
    viewerCanRemove
  }
`;

type Review = ProductCommunityItems_review$data;
type QuestionRow = ProductCommunityItems_question$data;
type Answer = ProductCommunityItems_answer$data;
type CommunityContentType = "REVIEW" | "QUESTION" | "ANSWER";
type CommunityContentLabel = "review" | "question" | "answer";

export function ReviewItem({
  ownerView = false,
  review: reviewRef,
}: {
  ownerView?: boolean;
  review: ProductCommunityItems_review$key;
}) {
  const review = useFragment(reviewFragment, reviewRef);
  const state = useCommunityItemState();
  const { pending, submit } = useReviewUpdate(review, ownerView, state);
  const display = publishedReviewRowDisplayData(review);

  if (state.unavailableMessage) {
    return (
      <UnavailableListItem label={`Review: ${display.title}`} message={state.unavailableMessage} />
    );
  }

  return (
    <li>
      <article aria-label={`Review: ${display.title}`} {...props(styles.item)}>
        <ModerationStatus ownerView={ownerView} status={review.moderationStatus} />
        <strong>{display.title}</strong>
        <span>{display.ratingStars}</span>
        <OptionalParagraph value={review.body} />
        <p {...props(styles.metadata)}>{display.authorCopy}</p>
        <ReviewEditForm
          editing={state.editing}
          pending={pending}
          review={review}
          onCancel={state.cancelEditing}
          onSubmit={submit}
        />
        <CommunityOwnerActions
          canEdit={review.viewerCanEdit}
          canRemove={review.viewerCanRemove}
          contentId={review.id}
          contentType="REVIEW"
          editing={state.editing}
          label="review"
          onEdit={state.startEditing}
          onRemoved={state.markRemoved}
        />
        <RowMessage message={state.message} />
      </article>
    </li>
  );
}

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
    <AnswerArticle
      acceptedAnswerId={acceptedAnswerId}
      answer={answer}
      ownerView={ownerView}
      pending={pending}
      state={state}
      submit={submit}
    />
  );
}

function AnswerArticle({
  acceptedAnswerId,
  answer,
  ownerView,
  pending,
  state,
  submit,
}: {
  acceptedAnswerId?: string | null;
  answer: Answer;
  ownerView: boolean;
  pending: boolean;
  state: CommunityItemState;
  submit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <article aria-label={`Answer by ${answer.authorLabel}`} {...props(styles.answer)}>
      <ModerationStatus ownerView={ownerView} status={answer.moderationStatus} />
      <p>{answer.body}</p>
      <p {...props(styles.metadata)}>
        {acceptedAnswerAuthorLabel(answer.id, acceptedAnswerId, answer.authorLabel)}
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

function useCommunityItemState() {
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

type CommunityItemState = ReturnType<typeof useCommunityItemState>;

function useReviewUpdate(review: Review, ownerView: boolean, state: CommunityItemState) {
  const [commitUpdate, pending] =
    useMutation<ProductCommunityOperationsUpdateProductReviewMutation>(updateProductReviewMutation);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    try {
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitUpdate, {
        variables: {
          input: {
            id: review.id,
            rating: Number(form.get("rating")),
            title: normalizedFormText(form.get("title")),
            body: normalizedFormText(form.get("body")),
          },
        },
      });
      const payload = response.updateProductReview;
      const nextMessage = resolveProductReviewUpdateMessage(payload, graphQLErrors);
      applyCommunityUpdate(payload.review, nextMessage, graphQLErrors, ownerView, state);
    } catch {
      state.setMessage(DEFAULT_ROUTE_ERROR_MESSAGE);
    }
  }

  return { pending, submit };
}

function useQuestionUpdate(question: QuestionRow, ownerView: boolean, state: CommunityItemState) {
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
      state.setMessage(DEFAULT_ROUTE_ERROR_MESSAGE);
    }
  }

  return { pending, submit };
}

function applyCommunityUpdate(
  content: object | null | undefined,
  nextMessage: string,
  graphQLErrors: readonly unknown[] | null | undefined,
  ownerView: boolean,
  state: CommunityItemState,
) {
  if (!content || hasRouteGraphQLErrors(graphQLErrors)) {
    state.setMessage(nextMessage);
    return;
  }

  state.completeUpdate(nextMessage, ownerView);
}

function ReviewEditForm({
  editing,
  pending,
  review,
  onCancel,
  onSubmit,
}: {
  editing: boolean;
  pending: boolean;
  review: Review;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const fieldId = useId();

  if (!editing) return null;

  return (
    <form onSubmit={onSubmit} {...props(styles.form)}>
      <Label htmlFor={`${fieldId}-rating`} style={styles.field}>
        Edit review rating
        <Select defaultValue={String(review.rating)} items={REVIEW_RATING_OPTIONS} name="rating">
          <SelectTrigger id={`${fieldId}-rating`} style={styles.input}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REVIEW_RATING_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Label>
      <Label htmlFor={`${fieldId}-title`} style={styles.field}>
        Edit review title
        <Input
          id={`${fieldId}-title`}
          name="title"
          defaultValue={review.title ?? ""}
          maxLength={120}
          style={styles.input}
        />
      </Label>
      <Label htmlFor={`${fieldId}-body`} style={styles.field}>
        Edit review body
        <Textarea
          id={`${fieldId}-body`}
          name="body"
          defaultValue={review.body ?? ""}
          maxLength={5000}
          rows={4}
          style={styles.input}
        />
      </Label>
      <EditActions label="review" onCancel={onCancel} pending={pending} />
    </form>
  );
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
  question: QuestionRow;
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

function EditActions({
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

function CommunityOwnerActions({
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
      if (payload.removedContentId && !hasRouteGraphQLErrors(graphQLErrors)) onRemoved();
    } catch {
      setMessage(DEFAULT_ROUTE_ERROR_MESSAGE);
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

function ModerationStatus({ ownerView, status }: { ownerView: boolean; status: string }) {
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

function OptionalParagraph({ value }: { value: string | null | undefined }) {
  return value ? <p>{value}</p> : null;
}

function RowMessage({ message }: { message: string | null }) {
  return message ? <p role="status">{message}</p> : null;
}

function UnavailableListItem({ label, message }: { label: string; message: string }) {
  return (
    <li>
      <UnavailableArticle label={label} message={message} />
    </li>
  );
}

function UnavailableArticle({ label, message }: { label: string; message: string }) {
  return (
    <article aria-label={label} {...props(styles.item)}>
      <p role="status">{message}</p>
    </article>
  );
}

function normalizedFormText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}
