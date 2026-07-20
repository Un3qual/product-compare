import { type FormEvent, type ReactNode, useState } from "react";
import { props } from "@stylexjs/stylex";
import { useMutation } from "react-relay";
import type { ProductCommunityQuery } from "../../__generated__/ProductCommunityQuery.graphql";
import type { RemoveCommunityContentMutation } from "../../__generated__/RemoveCommunityContentMutation.graphql";
import type { UpdateProductAnswerMutation } from "../../__generated__/UpdateProductAnswerMutation.graphql";
import type { UpdateProductQuestionMutation } from "../../__generated__/UpdateProductQuestionMutation.graphql";
import type { UpdateProductReviewMutation } from "../../__generated__/UpdateProductReviewMutation.graphql";
import { Button } from "../../ui/primitives/Button";
import { commitRouteMutationPromise } from "../relay-mutations";
import { DEFAULT_ROUTE_ERROR_MESSAGE, hasRouteGraphQLErrors } from "../route-errors";
import {
  acceptedAnswerAuthorLabel,
  publishedReviewRowDisplayData,
  resolveCommunityContentRemovalMessage,
  resolveProductAnswerUpdateMessage,
  resolveProductQuestionUpdateMessage,
  resolveProductReviewUpdateMessage
} from "./product-community-data";
import { productCommunityStyles as styles } from "./product-community-styles";
import removeCommunityContentMutation from "./queries/RemoveCommunityContentMutation";
import updateProductAnswerMutation from "./queries/UpdateProductAnswerMutation";
import updateProductQuestionMutation from "./queries/UpdateProductQuestionMutation";
import updateProductReviewMutation from "./queries/UpdateProductReviewMutation";

type CommunityProduct = NonNullable<ProductCommunityQuery["response"]["product"]>;
type Review = CommunityProduct["reviews"]["edges"][number]["node"];
type Question = CommunityProduct["questions"]["edges"][number]["node"];
type Answer = Question["answers"]["edges"][number]["node"];
type QuestionRow = Pick<
  Question,
  "id" | "title" | "body" | "authorLabel" | "moderationStatus" | "viewerCanEdit" | "viewerCanRemove"
>;
type CommunityContentType = "REVIEW" | "QUESTION" | "ANSWER";
type CommunityContentLabel = "review" | "question" | "answer";

export function ReviewItem({ ownerView = false, review }: { ownerView?: boolean; review: Review }) {
  const [commitUpdate, pending] = useMutation<UpdateProductReviewMutation>(updateProductReviewMutation);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [resubmittedMessage, setResubmittedMessage] = useState<string | null>(null);
  const display = publishedReviewRowDisplayData(review);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitUpdate, {
        variables: { input: {
          id: review.id,
          rating: Number(form.get("rating")),
          title: normalizedFormText(form.get("title")),
          body: normalizedFormText(form.get("body"))
        } }
      });
      const payload = response.updateProductReview;
      const nextMessage = resolveProductReviewUpdateMessage(payload, graphQLErrors);
      setMessage(nextMessage);
      if (payload.review && !hasRouteGraphQLErrors(graphQLErrors)) {
        setEditing(false);
        if (!ownerView) setResubmittedMessage(nextMessage);
      }
    } catch {
      setMessage(DEFAULT_ROUTE_ERROR_MESSAGE);
    }
  }

  const unavailableMessage = resubmittedMessage ?? (removed ? "Community content removed." : null);
  if (unavailableMessage) return <UnavailableListItem label={`Review: ${display.title}`} message={unavailableMessage} />;

  return <li><article aria-label={`Review: ${display.title}`} {...props(styles.item)}>
    <ModerationStatus ownerView={ownerView} status={review.moderationStatus} />
    <strong>{display.title}</strong><span>{display.ratingStars}</span>
    <OptionalParagraph value={review.body} />
    <p {...props(styles.metadata)}>{display.authorCopy}</p>
    <ReviewEditForm editing={editing} pending={pending} review={review} onCancel={() => setEditing(false)} onSubmit={submit} />
    <CommunityOwnerActions
      canEdit={review.viewerCanEdit}
      canRemove={review.viewerCanRemove}
      contentId={review.id}
      contentType="REVIEW"
      editing={editing}
      label="review"
      onEdit={() => setEditing(true)}
      onRemoved={() => setRemoved(true)}
    />
    <RowMessage message={message} />
  </article></li>;
}

export function QuestionItem({
  children,
  ownerView = false,
  question
}: {
  children?: ReactNode;
  ownerView?: boolean;
  question: QuestionRow;
}) {
  const [commitUpdate, pending] = useMutation<UpdateProductQuestionMutation>(updateProductQuestionMutation);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [resubmittedMessage, setResubmittedMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitUpdate, {
        variables: { input: {
          id: question.id,
          title: normalizedFormText(form.get("title")),
          body: normalizedFormText(form.get("body"))
        } }
      });
      const payload = response.updateProductQuestion;
      const nextMessage = resolveProductQuestionUpdateMessage(payload, graphQLErrors);
      setMessage(nextMessage);
      if (payload.question && !hasRouteGraphQLErrors(graphQLErrors)) {
        setEditing(false);
        if (!ownerView) setResubmittedMessage(nextMessage);
      }
    } catch {
      setMessage(DEFAULT_ROUTE_ERROR_MESSAGE);
    }
  }

  const unavailableMessage = resubmittedMessage ?? (removed ? "Community content removed." : null);
  if (unavailableMessage) return <UnavailableListItem label={`Question: ${question.title}`} message={unavailableMessage} />;

  return <li><article aria-label={`Question: ${question.title}`} {...props(styles.item)}>
    <ModerationStatus ownerView={ownerView} status={question.moderationStatus} />
    <strong>{question.title}</strong>
    <OptionalParagraph value={question.body} />
    <p {...props(styles.metadata)}>{question.authorLabel}</p>
    <QuestionEditForm editing={editing} pending={pending} question={question} onCancel={() => setEditing(false)} onSubmit={submit} />
    <CommunityOwnerActions
      canEdit={question.viewerCanEdit}
      canRemove={question.viewerCanRemove}
      contentId={question.id}
      contentType="QUESTION"
      editing={editing}
      label="question"
      onEdit={() => setEditing(true)}
      onRemoved={() => setRemoved(true)}
    />
    <RowMessage message={message} />
    {children}
  </article></li>;
}

export function AnswerView({
  acceptedAnswerId,
  answer,
  ownerView = false
}: {
  acceptedAnswerId?: string | null;
  answer: Answer;
  ownerView?: boolean;
}) {
  const [commitUpdate, pending] = useMutation<UpdateProductAnswerMutation>(updateProductAnswerMutation);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [resubmittedMessage, setResubmittedMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitUpdate, {
        variables: { input: { id: answer.id, body: normalizedFormText(form.get("body")) } }
      });
      const payload = response.updateProductAnswer;
      const nextMessage = resolveProductAnswerUpdateMessage(payload, graphQLErrors);
      setMessage(nextMessage);
      if (payload.answer && !hasRouteGraphQLErrors(graphQLErrors)) {
        setEditing(false);
        if (!ownerView) setResubmittedMessage(nextMessage);
      }
    } catch {
      setMessage(DEFAULT_ROUTE_ERROR_MESSAGE);
    }
  }

  const unavailableMessage = resubmittedMessage ?? (removed ? "Community content removed." : null);
  if (unavailableMessage) return <UnavailableArticle label={`Answer by ${answer.authorLabel}`} message={unavailableMessage} />;

  return <article aria-label={`Answer by ${answer.authorLabel}`} {...props(styles.answer)}>
    <ModerationStatus ownerView={ownerView} status={answer.moderationStatus} />
    <p>{answer.body}</p>
    <p {...props(styles.metadata)}>{acceptedAnswerAuthorLabel(answer.id, acceptedAnswerId, answer.authorLabel)}</p>
    <AnswerEditForm answer={answer} editing={editing} pending={pending} onCancel={() => setEditing(false)} onSubmit={submit} />
    <CommunityOwnerActions
      canEdit={answer.viewerCanEdit}
      canRemove={answer.viewerCanRemove}
      contentId={answer.id}
      contentType="ANSWER"
      editing={editing}
      label="answer"
      onEdit={() => setEditing(true)}
      onRemoved={() => setRemoved(true)}
    />
    <RowMessage message={message} />
  </article>;
}

function ReviewEditForm({ editing, pending, review, onCancel, onSubmit }: {
  editing: boolean;
  pending: boolean;
  review: Review;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  if (!editing) return null;

  return <form onSubmit={onSubmit} {...props(styles.form)}>
    <label {...props(styles.field)}>Edit review rating<select name="rating" defaultValue={review.rating} {...props(styles.input)}>{[5,4,3,2,1].map((rating) => <option key={rating} value={rating}>{rating}</option>)}</select></label>
    <label {...props(styles.field)}>Edit review title<input name="title" defaultValue={review.title ?? ""} maxLength={120} {...props(styles.input)} /></label>
    <label {...props(styles.field)}>Edit review body<textarea name="body" defaultValue={review.body ?? ""} maxLength={5000} rows={4} {...props(styles.input)} /></label>
    <EditActions label="review" onCancel={onCancel} pending={pending} />
  </form>;
}

function QuestionEditForm({ editing, pending, question, onCancel, onSubmit }: {
  editing: boolean;
  pending: boolean;
  question: QuestionRow;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  if (!editing) return null;

  return <form onSubmit={onSubmit} {...props(styles.form)}>
    <label {...props(styles.field)}>Edit question title<input name="title" defaultValue={question.title} required maxLength={200} {...props(styles.input)} /></label>
    <label {...props(styles.field)}>Edit question body<textarea name="body" defaultValue={question.body ?? ""} maxLength={5000} rows={3} {...props(styles.input)} /></label>
    <EditActions label="question" onCancel={onCancel} pending={pending} />
  </form>;
}

function AnswerEditForm({ answer, editing, pending, onCancel, onSubmit }: {
  answer: Answer;
  editing: boolean;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  if (!editing) return null;

  return <form onSubmit={onSubmit} {...props(styles.form)}>
    <label {...props(styles.field)}>Edit answer body<textarea name="body" defaultValue={answer.body} required maxLength={5000} rows={3} {...props(styles.input)} /></label>
    <EditActions label="answer" onCancel={onCancel} pending={pending} />
  </form>;
}

function EditActions({ label, onCancel, pending }: { label: CommunityContentLabel; onCancel: () => void; pending: boolean }) {
  return <div {...props(styles.actions)}>
    <Button disabled={pending} type="submit">{pending ? "Saving…" : `Save ${label}`}</Button>
    <Button onClick={onCancel} type="button">Cancel edit</Button>
  </div>;
}

function CommunityOwnerActions({
  canEdit,
  canRemove,
  contentId,
  contentType,
  editing,
  label,
  onEdit,
  onRemoved
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

  return <div {...props(styles.actions)}>
    {canEdit && !editing ? <Button onClick={onEdit} type="button">Edit {label}</Button> : null}
    {canRemove ? <RemoveCommunityControl contentId={contentId} contentType={contentType} label={label} onRemoved={onRemoved} /> : null}
  </div>;
}

function RemoveCommunityControl({
  contentId,
  contentType,
  label,
  onRemoved
}: {
  contentId: string;
  contentType: CommunityContentType;
  label: CommunityContentLabel;
  onRemoved: () => void;
}) {
  const [commitRemove, pending] = useMutation<RemoveCommunityContentMutation>(removeCommunityContentMutation);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function remove() {
    try {
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitRemove, {
        variables: { input: { contentId, contentType } }
      });
      const payload = response.removeCommunityContent;
      setMessage(resolveCommunityContentRemovalMessage(payload, graphQLErrors));
      if (payload.removedContentId && !hasRouteGraphQLErrors(graphQLErrors)) onRemoved();
    } catch {
      setMessage(DEFAULT_ROUTE_ERROR_MESSAGE);
    }
  }

  if (!confirming) {
    return <><Button onClick={() => setConfirming(true)} type="button">Remove {label}</Button><RowMessage message={message} /></>;
  }

  return <fieldset aria-label={`Confirm removal of ${label}`} {...props(styles.confirmation)}>
    <legend>Remove this {label}?</legend>
    <div {...props(styles.actions)}>
      <Button disabled={pending} onClick={remove} type="button">{pending ? "Removing…" : `Confirm remove ${label}`}</Button>
      <Button disabled={pending} onClick={() => setConfirming(false)} type="button">Cancel removal</Button>
    </div>
    <RowMessage message={message} />
  </fieldset>;
}

function ModerationStatus({ ownerView, status }: { ownerView: boolean; status: string }) {
  if (!ownerView) return null;
  return <p {...props(styles.metadata)}>{status.charAt(0) + status.slice(1).toLowerCase()}</p>;
}

function OptionalParagraph({ value }: { value: string | null | undefined }) {
  return value ? <p>{value}</p> : null;
}

function RowMessage({ message }: { message: string | null }) {
  return message ? <p role="status">{message}</p> : null;
}

function UnavailableListItem({ label, message }: { label: string; message: string }) {
  return <li><UnavailableArticle label={label} message={message} /></li>;
}

function UnavailableArticle({ label, message }: { label: string; message: string }) {
  return <article aria-label={label} {...props(styles.item)}><p role="status">{message}</p></article>;
}

function normalizedFormText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}
