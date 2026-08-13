import { type FormEvent, useId } from "react";
import { props } from "@stylexjs/stylex";
import { useFragment, useMutation } from "react-relay";
import type {
  ProductCommunityItems_review$data,
  ProductCommunityItems_review$key,
} from "$generated/ProductCommunityItems_review.graphql";
import type { ProductCommunityOperationsUpdateProductReviewMutation } from "$generated/ProductCommunityOperationsUpdateProductReviewMutation.graphql";
import { Input } from "$ui/primitives/Input";
import { Label } from "$ui/primitives/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "$ui/primitives/Select";
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
import {
  publishedReviewRowDisplayData,
  resolveProductReviewUpdateMessage,
} from "./product-community-data";
import { productCommunityStyles as styles } from "./product-community-styles";
import { reviewFragment } from "./ProductCommunityItems";
import { updateProductReviewMutation } from "./ProductCommunityOperations";

const ratingOptions = [5, 4, 3, 2, 1].map((rating) => ({
  label: String(rating),
  value: String(rating),
}));

type Review = ProductCommunityItems_review$data;

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
        <Select defaultValue={String(review.rating)} items={ratingOptions} name="rating">
          <SelectTrigger id={`${fieldId}-rating`} style={styles.input}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ratingOptions.map((option) => (
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
