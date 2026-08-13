import { type FormEvent, useCallback, useId, useMemo, useRef, useState } from "react";
import { create, props } from "@stylexjs/stylex";
import { useMutation } from "react-relay";
import type { ProductCommunityOperationsAnswerProductQuestionMutation } from "$generated/ProductCommunityOperationsAnswerProductQuestionMutation.graphql";
import type { ProductCommunityOperationsAskProductQuestionMutation } from "$generated/ProductCommunityOperationsAskProductQuestionMutation.graphql";
import type { ProductCommunityOperationsSubmitProductReviewMutation } from "$generated/ProductCommunityOperationsSubmitProductReviewMutation.graphql";
import { Button } from "$ui/primitives/Button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "$ui/primitives/Collapsible";
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
  buildProductAnswerInput,
  buildProductQuestionInput,
  buildProductReviewInput,
  resolveProductAnswerMutationMessage,
  resolveProductQuestionMutationMessage,
  resolveProductReviewMutationMessage,
} from "./product-community-data";
import { productCommunityStyles as styles } from "./product-community-styles";
import {
  answerProductQuestionMutation,
  askProductQuestionMutation,
  submitProductReviewMutation,
} from "./ProductCommunityOperations";

const ratingOptions = [5, 4, 3, 2, 1].map((rating) => ({
  label: String(rating),
  value: String(rating),
}));

const disclosureStyles = create({
  content: {
    display: {
      default: "block",
      ":where([data-closed])": "none",
    },
  },
});

export function ReviewSubmissionForm({ productId }: { productId: string }) {
  const [commitReview, pending] =
    useMutation<ProductCommunityOperationsSubmitProductReviewMutation>(submitProductReviewMutation);
  const [message, setMessage] = useState<string | null>(null);
  const fieldId = useId();
  const submissionKey = useSubmissionKey();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const form = new FormData(event.currentTarget);
      const input = buildProductReviewInput({
        body: form.get("body"),
        idempotencyKey: submissionKey.current(),
        productId,
        rating: form.get("rating"),
        title: form.get("title"),
      });
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitReview, {
        variables: { input },
      });
      submissionKey.clear();
      setMessage(resolveProductReviewMutationMessage(response.submitProductReview, graphQLErrors));
    } catch {
      setMessage(DEFAULT_ROUTE_ERROR_MESSAGE);
    }
  }

  return (
    <Collapsible>
      <CollapsibleTrigger render={<Button variant="link" />}>Write a review</CollapsibleTrigger>
      <CollapsibleContent keepMounted style={disclosureStyles.content}>
        <form onSubmit={submit} {...props(styles.form)}>
          <ReviewSubmissionFields fieldId={fieldId} />
          <Button disabled={pending} type="submit">
            {pending ? "Submitting…" : "Submit review"}
          </Button>
          {message ? <p role="status">{message}</p> : null}
        </form>
      </CollapsibleContent>
    </Collapsible>
  );
}

function ReviewSubmissionFields({ fieldId }: { fieldId: string }) {
  return (
    <>
      <Label htmlFor={`${fieldId}-rating`} style={styles.field}>
        Rating
        <Select defaultValue="5" items={ratingOptions} name="rating">
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
        Title
        <Input id={`${fieldId}-title`} name="title" maxLength={120} style={styles.input} />
      </Label>
      <Label htmlFor={`${fieldId}-body`} style={styles.field}>
        Review
        <Textarea
          id={`${fieldId}-body`}
          name="body"
          maxLength={5000}
          rows={4}
          style={styles.input}
        />
      </Label>
    </>
  );
}

export function QuestionSubmissionForm({ productId }: { productId: string }) {
  const [commitQuestion, pending] =
    useMutation<ProductCommunityOperationsAskProductQuestionMutation>(askProductQuestionMutation);
  const [message, setMessage] = useState<string | null>(null);
  const fieldId = useId();
  const submissionKey = useSubmissionKey();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const form = new FormData(event.currentTarget);
      const input = buildProductQuestionInput({
        body: form.get("body"),
        idempotencyKey: submissionKey.current(),
        productId,
        title: form.get("title"),
      });
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitQuestion, {
        variables: { input },
      });
      submissionKey.clear();
      setMessage(resolveProductQuestionMutationMessage(response.askProductQuestion, graphQLErrors));
    } catch {
      setMessage(DEFAULT_ROUTE_ERROR_MESSAGE);
    }
  }

  return (
    <Collapsible>
      <CollapsibleTrigger render={<Button variant="link" />}>Ask a question</CollapsibleTrigger>
      <CollapsibleContent keepMounted style={disclosureStyles.content}>
        <form onSubmit={submit} {...props(styles.form)}>
          <Label htmlFor={`${fieldId}-title`} style={styles.field}>
            Question
            <Input
              id={`${fieldId}-title`}
              name="title"
              required
              maxLength={200}
              style={styles.input}
            />
          </Label>
          <Label htmlFor={`${fieldId}-body`} style={styles.field}>
            Details
            <Textarea
              id={`${fieldId}-body`}
              name="body"
              maxLength={5000}
              rows={3}
              style={styles.input}
            />
          </Label>
          <Button disabled={pending} type="submit">
            {pending ? "Submitting…" : "Submit question"}
          </Button>
          {message ? <p role="status">{message}</p> : null}
        </form>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function AnswerSubmissionForm({ questionId }: { questionId: string }) {
  const [commitAnswer, pending] =
    useMutation<ProductCommunityOperationsAnswerProductQuestionMutation>(
      answerProductQuestionMutation,
    );
  const [message, setMessage] = useState<string | null>(null);
  const fieldId = useId();
  const submissionKey = useSubmissionKey();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const { response, graphQLErrors } = await commitRouteMutationPromise(commitAnswer, {
        variables: {
          input: buildProductAnswerInput({
            questionId,
            body: form.get("body"),
            idempotencyKey: submissionKey.current(),
          }),
        },
      });
      submissionKey.clear();
      setMessage(
        resolveProductAnswerMutationMessage(response.answerProductQuestion, graphQLErrors),
      );
    } catch {
      setMessage(DEFAULT_ROUTE_ERROR_MESSAGE);
    }
  }

  return (
    <Collapsible>
      <CollapsibleTrigger render={<Button variant="link" />}>
        Answer this question
      </CollapsibleTrigger>
      <CollapsibleContent keepMounted style={disclosureStyles.content}>
        <form onSubmit={submit} {...props(styles.form)}>
          <Label htmlFor={`${fieldId}-body`} style={styles.field}>
            Answer
            <Textarea
              id={`${fieldId}-body`}
              name="body"
              required
              maxLength={5000}
              rows={3}
              style={styles.input}
            />
          </Label>
          <Button disabled={pending} type="submit">
            {pending ? "Submitting…" : "Submit answer"}
          </Button>
          {message ? <p role="status">{message}</p> : null}
        </form>
      </CollapsibleContent>
    </Collapsible>
  );
}

function useSubmissionKey() {
  const key = useRef<string | null>(null);
  const current = useCallback(() => {
    key.current ??= crypto.randomUUID();
    return key.current;
  }, []);
  const clear = useCallback(() => {
    key.current = null;
  }, []);

  return useMemo(() => ({ clear, current }), [clear, current]);
}
