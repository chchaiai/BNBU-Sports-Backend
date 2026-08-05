import { ApplicationError } from '../../../common/errors/application-error.js';

export const EXERCISE_RECORD_STATUSES = ['DRAFT', 'SUBMITTED', 'REVIEWED', 'CANCELLED'] as const;
export type ExerciseRecordStatus = (typeof EXERCISE_RECORD_STATUSES)[number];

export const CREDIT_TYPES = ['COURSE_RELATED', 'GENERAL'] as const;
export type CreditType = (typeof CREDIT_TYPES)[number];

export function creditedDuration(actualDurationSeconds: bigint): bigint {
  if (actualDurationSeconds < 0n || actualDurationSeconds > 7200n) {
    throw new ApplicationError('EXERCISE_RECORD_DURATION_NOT_CREDITABLE', 422);
  }
  if (actualDurationSeconds < 3600n) return 0n;
  if (actualDurationSeconds < 7200n) return 3600n;
  return 7200n;
}

export function assertCreditableDuration(actualDurationSeconds: bigint): bigint {
  const credited = creditedDuration(actualDurationSeconds);
  if (credited === 0n) {
    throw new ApplicationError('EXERCISE_RECORD_DURATION_NOT_CREDITABLE', 422);
  }
  return credited;
}

export function normalizeRecordContent(input: {
  creditType: CreditType;
  sportType: string;
  sportName?: string | null;
  description: string;
  studentRemark?: string | null;
}): {
  creditType: CreditType;
  sportType: string;
  sportName: string | null;
  description: string;
  studentRemark: string | null;
} {
  const sportType = input.sportType.trim();
  const normalizedSportName = input.sportName?.trim();
  const sportName =
    normalizedSportName === undefined || normalizedSportName === '' ? null : normalizedSportName;
  const description = input.description.trim();
  const normalizedStudentRemark = input.studentRemark?.trim();
  const studentRemark =
    normalizedStudentRemark === undefined || normalizedStudentRemark === ''
      ? null
      : normalizedStudentRemark;
  if (!/^[A-Z][A-Z0-9_]*$/.test(sportType) || description.length === 0) {
    throw new ApplicationError('VALIDATION_FAILED', 422);
  }
  if ((sportType === 'OTHER') !== (sportName !== null)) {
    throw new ApplicationError('VALIDATION_FAILED', 422);
  }
  return { creditType: input.creditType, sportType, sportName, description, studentRemark };
}
