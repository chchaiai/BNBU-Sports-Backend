export const REVIEW_DECISION_RESULTS = ['VALID', 'INVALID'] as const;
export type ReviewDecisionResult = (typeof REVIEW_DECISION_RESULTS)[number];

export const REVIEW_REASON_CODES = [
  'INSUFFICIENT_EVIDENCE',
  'INVALID_MEDIA',
  'DURATION_INCONSISTENT',
  'IDENTITY_MISMATCH',
  'DUPLICATE_SUBMISSION',
  'OUTSIDE_ALLOWED_SCOPE',
  'OTHER',
] as const;
export type ReviewReasonCode = (typeof REVIEW_REASON_CODES)[number];

export interface ReviewDecisionInput {
  result: ReviewDecisionResult;
  reasonCode?: ReviewReasonCode | null;
  reason?: string | null;
  publicComment?: string | null;
  internalNote?: string | null;
}

export interface NormalizedReviewDecision {
  result: ReviewDecisionResult;
  reasonCode: ReviewReasonCode | null;
  reason: string | null;
  publicComment: string | null;
  internalNote: string | null;
}

function optionalText(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export function normalizeReviewDecision(input: ReviewDecisionInput): NormalizedReviewDecision {
  const reason = optionalText(input.reason);
  const reasonCode = input.reasonCode ?? null;
  if (input.result === 'VALID' && reasonCode !== null) {
    throw new ApplicationError('REVIEW_CHANGE_NOT_ALLOWED', 409);
  }
  if (input.result === 'INVALID' && reasonCode === null) {
    throw new ApplicationError('REVIEW_INVALID_REASON_REQUIRED', 422);
  }
  if (reasonCode === 'OTHER' && reason === null) {
    throw new ApplicationError('REVIEW_INVALID_REASON_REQUIRED', 422);
  }
  return {
    result: input.result,
    reasonCode,
    reason,
    publicComment: optionalText(input.publicComment),
    internalNote: optionalText(input.internalNote),
  };
}
import { ApplicationError } from '../../../common/errors/application-error.js';
