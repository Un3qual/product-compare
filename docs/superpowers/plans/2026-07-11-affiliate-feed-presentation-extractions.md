# Affiliate And Feed Review Presentation Extractions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract affiliate setup form rendering and feed-candidate review rendering into focused components without changing Relay, mutation, URL, or secret-safety behavior.

**Architecture:** Route owners keep loader data, Relay query reads, mutation commits, transient mutation state, and revalidation. New sibling components receive typed values and callbacks and own only the existing presentation, derived display data, and pagination links.

**Tech Stack:** React 19, React Router 7, Relay 20, TypeScript, StyleX, Vitest.

## Global Constraints

- Browser data remains GraphQL/Relay based.
- Preserve every existing form field name, accessible label, button label, result region, status message, URL parameter, and mutation variable.
- Keep mutation hooks, mutation completion/error handling, Relay queries, loader state, and revalidation in the route owner.
- Feed-candidate presentation must expose only the existing non-secret candidate fields; do not add dashboard, ingestion, provider-call, raw-metadata, credential, account-id, tracking-parameter, file-export, or CSV behavior.
- Use direct imports instead of new barrel files.
- Do not add memoization for simple derived values or move route-owned state into effects.

---

### Task 1: Affiliate Setup Form Presentation

**Files:**

- Create: `assets/src/routes/affiliate/setup/AffiliateSetupForms.tsx`
- Modify: `assets/src/routes/affiliate/setup/AffiliateSetupRoute.tsx`
- Test: `assets/test/routes/affiliate/setup/affiliate-setup.route.test.tsx`
- Modify: `docs/work/frontend-affiliate-setup-demo-parity.md`
- Include with this milestone: `docs/superpowers/plans/2026-07-11-affiliate-feed-presentation-extractions.md`

**Interfaces:**

- `AffiliateSetupRoute.tsx` continues to own all four `useMutation` calls, pending/error/result state, in-flight refs, merchant selection state, and submit handlers.
- `AffiliateSetupForms.tsx` exports `AffiliateNetworkForm`, `AffiliateProgramForm`, `AffiliateLinkForm`, `AffiliateCouponForm`, and the `MerchantChoice` type.
- Each form consumes a `FormEventHandler<HTMLFormElement>` callback and typed presentation values. The program and coupon forms consume `MerchantChoice[]`, the selected merchant value/summary, and an `(merchantId: string) => void` callback. The program form additionally consumes the controlled affiliate-network ID and its string change callback.

- [ ] **Step 1: Confirm the characterization contract**

Run:

```bash
cd assets && bun x vitest run test/routes/affiliate/setup/affiliate-setup.route.test.tsx
```

Expected: 18 tests pass before extraction.

- [ ] **Step 2: Create the presentation component file**

Move the existing form JSX, StyleX `form` style, `MerchantSelect`, `DiscountTypeSelect`, `CouponResultPanel`, and `couponDiscountText` into `AffiliateSetupForms.tsx`. Use this public shape:

```tsx
export type MerchantChoice = {
  domain: string;
  id: string;
  name: string;
};

export function AffiliateNetworkForm(props: {
  error: string | null;
  onSubmit: FormEventHandler<HTMLFormElement>;
  pending: boolean;
  result: NetworkResult | null;
}): ReactElement;

export function AffiliateProgramForm(props: {
  affiliateNetworkId: string;
  error: string | null;
  merchantChoices: MerchantChoice[];
  onAffiliateNetworkIdChange: (value: string) => void;
  onSelectedMerchantIdChange: (merchantId: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  pending: boolean;
  result: ProgramResult | null;
  selectedMerchantSummary: string | null;
  selectedMerchantValue: string;
}): ReactElement;

export function AffiliateLinkForm(props: {
  error: string | null;
  onSubmit: FormEventHandler<HTMLFormElement>;
  pending: boolean;
  result: LinkResult | null;
  selectedMerchantSummary: string | null;
}): ReactElement;

export function AffiliateCouponForm(props: {
  error: string | null;
  merchantChoices: MerchantChoice[];
  onSelectedMerchantIdChange: (merchantId: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  pending: boolean;
  result: CouponResult | null;
  selectedMerchantSummary: string | null;
  selectedMerchantValue: string;
}): ReactElement;
```

Derive the result types from the existing generated Relay mutation response types in the new file. Do not alter any form markup or copy while moving it.

- [ ] **Step 3: Replace route-owned markup with typed component calls**

Import the four form components and `MerchantChoice`. Preserve the existing empty-merchant behavior by keeping the conditional program/coupon rendering in `AffiliateSetupRoute.tsx`. Pass existing state and handlers directly; for the controlled network ID use:

```tsx
onAffiliateNetworkIdChange={setAffiliateNetworkId}
```

- [ ] **Step 4: Verify behavior and types**

Run:

```bash
cd assets && bun x vitest run test/routes/affiliate/setup/affiliate-setup.route.test.tsx
cd assets && bun run typecheck
git diff --check
```

Expected: the focused suite and TypeScript pass; diff check has no output.

- [ ] **Step 5: Record lane evidence and commit**

Append a concise completed-batch entry to `docs/work/frontend-affiliate-setup-demo-parity.md` naming the extracted forms and the commands/results from Step 4.

```bash
git add assets/src/routes/affiliate/setup/AffiliateSetupForms.tsx assets/src/routes/affiliate/setup/AffiliateSetupRoute.tsx assets/test/routes/affiliate/setup/affiliate-setup.route.test.tsx docs/work/frontend-affiliate-setup-demo-parity.md docs/superpowers/plans/2026-07-11-affiliate-feed-presentation-extractions.md
git commit -m "refactor(frontend): extract affiliate setup forms"
```

---

### Task 2: Feed Candidate Review Presentation

**Files:**

- Create: `assets/src/routes/ingestion/feed-candidates/FeedCandidateReviewList.tsx`
- Modify: `assets/src/routes/ingestion/feed-candidates/FeedCandidatesRoute.tsx`
- Test: `assets/test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx`
- Modify: `docs/work/product-data-scraping.md`

**Interfaces:**

- `FeedCandidatesRoute.tsx` continues to own the route query, `useMutation`, review-note draft state, review feedback, `useRevalidator`, mutation completion/error handling, and control form.
- `FeedCandidateReviewList.tsx` exports `FeedCandidateReviewList`, `FeedCandidate`, `FeedCandidatesConnection`, `ReviewStatus`, `formatFeedCandidateName`, and `formatFeedCandidateReviewStatus`.
- The list component consumes the existing connection and pagination plus mutation state/callbacks:

```tsx
export function FeedCandidateReviewList(props: {
  connection: FeedCandidatesConnection;
  isReviewInFlight: boolean;
  onReview: (candidate: FeedCandidate, status: ReviewStatus) => void;
  onReviewNoteChange: (candidateId: string, note: string) => void;
  pagination: FeedCandidatesPagination;
  reviewFeedback: string;
  reviewNotes: Readonly<Record<string, string>>;
}): ReactElement;
```

- [ ] **Step 1: Confirm the characterization contract**

Run:

```bash
cd assets && bun x vitest run test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx
```

Expected: 14 tests pass before extraction.

- [ ] **Step 2: Create the pure review-list presentation**

Move the existing summary, empty state, candidate list item, review controls, feedback status, pagination rendering, pagination-path helpers, fit scoring/reasons, review-status display/tone, product-count formatting, review-date formatting, and candidate counting into `FeedCandidateReviewList.tsx`. Keep the existing StyleX `list`, `item`, and `actions` styles there.

The new component must not call `useMutation`, `useRevalidator`, or own review-note state. It receives all mutation state and callbacks through the public interface above.

- [ ] **Step 3: Keep review orchestration in the route**

Rename the route-owned wrapper to `FeedCandidateReviewPanel` if helpful. It continues to derive candidates, call `useRevalidator`, own `reviewFeedback` and `reviewNotes`, commit `ReviewMerchantFeedCandidateMutation`, omit successful drafts, and build the exact success/error copy. Render `FeedCandidateReviewList` with those values and callbacks.

Use the exported formatters for success feedback:

```tsx
setReviewFeedback(
  `${formatFeedCandidateName(candidate)} marked ${formatFeedCandidateReviewStatus(
    payload.candidate?.reviewStatus ?? status
  )}.`
);
```

- [ ] **Step 4: Verify behavior, secret safety, and types**

Run:

```bash
cd assets && bun x vitest run test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx
cd assets && bun run typecheck
rg -n "CJ_API_TOKEN|CJ_ACCOUNT_ID|rawMetadata|raw_metadata|tracking" assets/src/routes/ingestion/feed-candidates/FeedCandidateReviewList.tsx
git diff --check
```

Expected: the focused suite and TypeScript pass; the secret/raw-field scan exits 1 with no matches; diff check has no output.

- [ ] **Step 5: Record lane evidence and commit**

Append a concise completed-batch entry to `docs/work/product-data-scraping.md` naming the extracted review presentation, unchanged orchestration/guardrails, and the commands/results from Step 4.

```bash
git add assets/src/routes/ingestion/feed-candidates/FeedCandidateReviewList.tsx assets/src/routes/ingestion/feed-candidates/FeedCandidatesRoute.tsx assets/test/routes/ingestion/feed-candidates/feed-candidates.route.test.tsx docs/work/product-data-scraping.md
git commit -m "refactor(frontend): extract feed candidate review list"
```
