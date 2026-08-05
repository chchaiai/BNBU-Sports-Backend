import type { AuthenticatedPrincipal } from '../../../common/http/request-context.js';
import type {
  ScoreAdjustment,
  ScoreAdjustmentApprovalEvent,
  ScoreRule,
  ScoreRuleApprovalEvent,
  StudentScore,
  StudentScoreRevision,
} from '../../../generated/prisma/client.js';

type RuleWithEvents = ScoreRule & { approvalEvents: ScoreRuleApprovalEvent[] };
type ScoreWithRevisions = StudentScore & {
  currentWorkingRevision: StudentScoreRevision | null;
  publishedRevision: StudentScoreRevision | null;
};
type AdjustmentWithEvents = ScoreAdjustment & {
  approvalEvents: ScoreAdjustmentApprovalEvent[];
};

const decimal = (value: { toNumber(): number }): number => value.toNumber();

export function projectScoreRule(rule: RuleWithEvents): Record<string, unknown> {
  return {
    id: rule.id,
    organizationId: rule.organizationId,
    classSectionId: rule.classSectionId,
    ruleCode: rule.ruleCode,
    ruleVersion: rule.ruleVersion,
    displayName: rule.displayName,
    totalRequiredSeconds: Number(rule.totalRequiredSeconds),
    calculationDefinition: rule.calculationDefinition,
    roundingMode: rule.roundingMode,
    roundingScale: rule.roundingScale,
    status: rule.status,
    effectiveFrom: rule.activatedAt?.toISOString() ?? null,
    effectiveTo: rule.supersededAt?.toISOString() ?? null,
    submittedAt: rule.submittedAt?.toISOString() ?? null,
    activatedAt: rule.activatedAt?.toISOString() ?? null,
    approvalCount: rule.approvalEvents.filter((event) => event.action === 'APPROVE').length,
    approvalEvents: rule.approvalEvents.map((event) => ({
      id: event.id,
      scoreRuleId: event.scoreRuleId,
      action: event.action,
      actorUserId: event.actorUserId,
      reason: event.reason,
      createdAt: event.createdAt.toISOString(),
    })),
    version: rule.version,
  };
}

function projectRevision(revision: StudentScoreRevision | null): Record<string, unknown> | null {
  if (revision === null) return null;
  return {
    id: revision.id,
    scoreRuleId: revision.scoreRuleId,
    calculationRevision: revision.calculationRevision,
    totalValidDurationSeconds: Number(revision.totalValidCreditedSeconds),
    scoringSeconds: Number(revision.scoringSeconds),
    excessSeconds: Number(revision.excessSeconds),
    qualificationStatus: revision.qualificationStatus,
    baseScore: decimal(revision.calculatedScore),
    adjustmentTotal: decimal(revision.adjustedScore.minus(revision.calculatedScore)),
    finalScore: decimal(revision.finalScore),
    status: revision.status,
    calculatedAt: revision.calculatedAt.toISOString(),
    sourceFingerprint: revision.sourceFingerprint,
  };
}

export function projectStudentScore(
  score: ScoreWithRevisions,
  principal: AuthenticatedPrincipal,
): Record<string, unknown> {
  const working = projectRevision(score.currentWorkingRevision);
  const published = projectRevision(score.publishedRevision);
  if (principal.role === 'STUDENT') {
    const progress = score.currentWorkingRevision;
    return {
      id: score.id,
      organizationId: score.organizationId,
      enrollmentId: score.enrollmentId,
      classSectionId: score.classSectionId,
      totalValidDurationSeconds: Number(progress?.totalValidCreditedSeconds ?? 0n),
      scoringSeconds: Number(progress?.scoringSeconds ?? 0n),
      excessSeconds: Number(progress?.excessSeconds ?? 0n),
      qualificationStatus: progress?.qualificationStatus ?? 'NOT_QUALIFIED',
      publishedScore: published,
      version: score.version,
    };
  }
  return {
    id: score.id,
    organizationId: score.organizationId,
    enrollmentId: score.enrollmentId,
    classSectionId: score.classSectionId,
    studentId: score.studentId,
    workingRevision: working,
    publishedRevision: published,
    hasUnpublishedChanges:
      score.currentWorkingRevisionId !== null &&
      score.currentWorkingRevisionId !== score.publishedRevisionId,
    version: score.version,
  };
}

export function projectScoreAdjustment(adjustment: AdjustmentWithEvents): Record<string, unknown> {
  return {
    id: adjustment.id,
    organizationId: adjustment.organizationId,
    studentScoreId: adjustment.studentScoreId,
    studentId: adjustment.studentId,
    enrollmentId: adjustment.enrollmentId,
    adjustmentType: adjustment.adjustmentType,
    adjustmentValue: decimal(adjustment.adjustmentValue),
    reasonCode: adjustment.reasonCode,
    reason: adjustment.reason,
    evidenceReference: adjustment.evidenceReference,
    status: adjustment.status,
    requestedBy: adjustment.requestedBy,
    requestedAt: adjustment.requestedAt.toISOString(),
    decidedAt: adjustment.decidedAt?.toISOString() ?? null,
    approvalEvents: adjustment.approvalEvents.map((event) => ({
      id: event.id,
      scoreAdjustmentId: event.scoreAdjustmentId,
      action: event.action,
      actorUserId: event.actorUserId,
      reason: event.reason,
      createdAt: event.createdAt.toISOString(),
    })),
    requestId: adjustment.requestId,
    version: adjustment.version,
  };
}
