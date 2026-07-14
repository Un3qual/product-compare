import { type FormEvent, useId, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { useMutation } from "react-relay";
import type { ProductDetailRouteQuery } from "../../__generated__/ProductDetailRouteQuery.graphql";
import type { SubmitProductReviewMutation } from "../../__generated__/SubmitProductReviewMutation.graphql";
import type { AskProductQuestionMutation } from "../../__generated__/AskProductQuestionMutation.graphql";
import type { AnswerProductQuestionMutation } from "../../__generated__/AnswerProductQuestionMutation.graphql";
import { Button } from "../../ui/primitives/Button";
import { commitRouteMutationPromise } from "../relay-mutations";
import { DEFAULT_ROUTE_ERROR_MESSAGE, routeMutationErrorMessage } from "../route-errors";
import answerProductQuestionMutation from "./queries/AnswerProductQuestionMutation";
import askProductQuestionMutation from "./queries/AskProductQuestionMutation";
import submitProductReviewMutation from "./queries/SubmitProductReviewMutation";

type Product = NonNullable<ProductDetailRouteQuery["response"]["product"]>;

const styles = create({
  answer: { borderInlineStart: "2px solid var(--pc-border-quiet)", display: "grid", gap: "0.35rem", paddingInlineStart: "0.8rem" },
  content: { display: "grid", gap: "1.25rem" },
  field: { display: "grid", gap: "0.35rem" },
  form: { display: "grid", gap: "0.75rem", maxWidth: "38rem" },
  input: { backgroundColor: "var(--pc-surface)", border: "1px solid var(--pc-border-emphasized)", borderRadius: "0.4rem", color: "var(--pc-text)", minHeight: "2.6rem", padding: "0.65rem" },
  item: { display: "grid", gap: "0.5rem" },
  list: { display: "grid", gap: "1.2rem", listStyle: "none", margin: 0, padding: 0 },
  metadata: { color: "var(--pc-text-secondary)", margin: 0 },
  title: { fontSize: "1.25rem", margin: 0 }
});

export function ProductCommunityPanel({ product }: { product: Product }) {
  return (
    <section aria-label="Reviews and product questions" {...props(styles.content)}>
      <ReviewSection product={product} />
      <QuestionSection product={product} />
    </section>
  );
}

function ReviewSection({ product }: { product: Product }) {
  const [commitReview, pending] = useMutation<SubmitProductReviewMutation>(submitProductReviewMutation);
  const [message, setMessage] = useState<string | null>(null);
  const ratingId = useId();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const input = reviewInput(product.id, new FormData(event.currentTarget));
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitReview, { variables: { input } });
      const payload = response.submitProductReview;
      setMessage(payload?.review ? "Review submitted for moderation." : routeMutationErrorMessage(payload?.errors, graphQLErrors));
    } catch { setMessage(DEFAULT_ROUTE_ERROR_MESSAGE); }
  }

  return <section aria-labelledby="reviews-heading" {...props(styles.content)}>
    <h2 id="reviews-heading" {...props(styles.title)}>Reviews</h2>
    <p {...props(styles.metadata)}>{product.reviewSummary.count ? `${product.reviewSummary.averageRating} out of 5 from ${product.reviewSummary.count} published review${product.reviewSummary.count === 1 ? "" : "s"}.` : "No published reviews yet."}</p>
    <ul aria-label="Published product reviews" {...props(styles.list)}>{product.reviews.map((review) => <li key={review.id} {...props(styles.item)}><strong>{review.title ?? `${review.rating} out of 5`}</strong><span>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>{review.body ? <p>{review.body}</p> : null}<p {...props(styles.metadata)}>{review.authorLabel}{review.verifiedPurchase ? " · Verified purchase" : " · Purchase not verified"}</p></li>)}</ul>
    <details><summary>Write a review</summary><form onSubmit={submit} {...props(styles.form)}>
      <label htmlFor={ratingId} {...props(styles.field)}>Rating<select id={ratingId} name="rating" defaultValue="5" {...props(styles.input)}>{[5,4,3,2,1].map((rating) => <option key={rating} value={rating}>{rating}</option>)}</select></label>
      <label {...props(styles.field)}>Title<input name="title" maxLength={120} {...props(styles.input)} /></label>
      <label {...props(styles.field)}>Review<textarea name="body" maxLength={5000} rows={4} {...props(styles.input)} /></label>
      <Button disabled={pending} type="submit">{pending ? "Submitting…" : "Submit review"}</Button>{message ? <p role="status">{message}</p> : null}
    </form></details>
  </section>;
}

function reviewInput(
  productId: string,
  form: FormData
): SubmitProductReviewMutation["variables"]["input"] {
  const title = String(form.get("title") ?? "").trim();
  const body = String(form.get("body") ?? "").trim();

  return {
    productId,
    rating: Number(form.get("rating")),
    ...(title ? { title } : {}),
    ...(body ? { body } : {})
  };
}

function QuestionSection({ product }: { product: Product }) {
  const [commitQuestion, pending] = useMutation<AskProductQuestionMutation>(askProductQuestionMutation);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitQuestion, { variables: { input: { productId: product.id, title: String(form.get("title") ?? "").trim(), body: String(form.get("body") ?? "").trim() || undefined } } });
      const payload = response.askProductQuestion;
      setMessage(payload?.question ? "Question submitted for moderation." : routeMutationErrorMessage(payload?.errors, graphQLErrors));
    } catch { setMessage(DEFAULT_ROUTE_ERROR_MESSAGE); }
  }

  return <section aria-labelledby="questions-heading" {...props(styles.content)}>
    <h2 id="questions-heading" {...props(styles.title)}>Product Q&amp;A</h2>
    {product.questions.length ? <ul aria-label="Published product questions" {...props(styles.list)}>{product.questions.map((question) => <li key={question.id} {...props(styles.item)}><strong>{question.title}</strong>{question.body ? <p>{question.body}</p> : null}<p {...props(styles.metadata)}>{question.authorLabel}</p>{question.answers.map((answer) => <div key={answer.id} {...props(styles.answer)}><p>{answer.body}</p><p {...props(styles.metadata)}>{answer.id === question.acceptedAnswerId ? "Accepted answer · " : ""}{answer.authorLabel}</p></div>)}<AnswerForm questionId={question.id} /></li>)}</ul> : <p>No published questions yet.</p>}
    <details><summary>Ask a question</summary><form onSubmit={submit} {...props(styles.form)}><label {...props(styles.field)}>Question<input name="title" required maxLength={200} {...props(styles.input)} /></label><label {...props(styles.field)}>Details<textarea name="body" maxLength={5000} rows={3} {...props(styles.input)} /></label><Button disabled={pending} type="submit">{pending ? "Submitting…" : "Submit question"}</Button>{message ? <p role="status">{message}</p> : null}</form></details>
  </section>;
}

function AnswerForm({ questionId }: { questionId: string }) {
  const [commitAnswer, pending] = useMutation<AnswerProductQuestionMutation>(answerProductQuestionMutation);
  const [message, setMessage] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); try { const { response, graphQLErrors } = await commitRouteMutationPromise(commitAnswer, { variables: { input: { questionId, body: String(form.get("body") ?? "").trim() } } }); const payload = response.answerProductQuestion; setMessage(payload?.answer ? "Answer submitted for moderation." : routeMutationErrorMessage(payload?.errors, graphQLErrors)); } catch { setMessage(DEFAULT_ROUTE_ERROR_MESSAGE); } }
  return <details><summary>Answer this question</summary><form onSubmit={submit} {...props(styles.form)}><label {...props(styles.field)}>Answer<textarea name="body" required maxLength={5000} rows={3} {...props(styles.input)} /></label><Button disabled={pending} type="submit">{pending ? "Submitting…" : "Submit answer"}</Button>{message ? <p role="status">{message}</p> : null}</form></details>;
}
