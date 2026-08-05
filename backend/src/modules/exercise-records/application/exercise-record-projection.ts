import type { ExerciseRecord, ReviewRecord } from '../../../generated/prisma/client.js';

export interface ExerciseRecordProjection {
  id: string;
  organizationId: string;
  semesterId: string;
  studentId: string;
  enrollmentId: string;
  classSectionId: string;
  courseId: string;
  teacherId: string;
  sessionId: string;
  businessDate: string;
  creditType: string;
  sportType: string;
  sportName: string | null;
  description: string;
  studentRemark: string | null;
  actualDurationSeconds: number;
  pausedDurationSeconds: number;
  creditedDurationSeconds: number;
  status: string;
  submittedAt: string | null;
  cancelledAt: string | null;
  clientRequestId: string;
  currentReview: {
    result: string;
    reasonCode: string | null;
    publicComment: string | null;
  } | null;
  version: number;
}

export type ExerciseRecordWithReview = ExerciseRecord & {
  reviews: Pick<ReviewRecord, 'result' | 'reasonCode' | 'publicComment' | 'reviewVersion'>[];
};

function safeSeconds(value: bigint): number {
  const result = Number(value);
  if (!Number.isSafeInteger(result)) throw new Error('ExerciseRecord duration is unsafe');
  return result;
}

export function projectExerciseRecord(record: ExerciseRecordWithReview): ExerciseRecordProjection {
  const current = record.reviews.at(0) ?? null;
  return {
    id: record.id,
    organizationId: record.organizationId,
    semesterId: record.semesterId,
    studentId: record.studentId,
    enrollmentId: record.enrollmentId,
    classSectionId: record.classSectionId,
    courseId: record.courseId,
    teacherId: record.teacherId,
    sessionId: record.sessionId,
    businessDate: record.businessDate.toISOString().slice(0, 10),
    creditType: record.creditType,
    sportType: record.sportType,
    sportName: record.sportName,
    description: record.description,
    studentRemark: record.studentRemark,
    actualDurationSeconds: safeSeconds(record.actualDurationSeconds),
    pausedDurationSeconds: safeSeconds(record.pausedDurationSeconds),
    creditedDurationSeconds: safeSeconds(record.creditedDurationSeconds),
    status: record.status,
    submittedAt: record.submittedAt?.toISOString() ?? null,
    cancelledAt: record.cancelledAt?.toISOString() ?? null,
    clientRequestId: record.clientRequestId,
    currentReview:
      current === null
        ? null
        : {
            result: current.result,
            reasonCode: current.reasonCode,
            publicComment: current.publicComment,
          },
    version: record.version,
  };
}
