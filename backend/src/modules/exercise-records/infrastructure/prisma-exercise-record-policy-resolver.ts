import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/database/prisma.service.js';
import { ApplicationError } from '../../../common/errors/application-error.js';
import type { AuthenticatedPrincipal } from '../../../common/http/request-context.js';
import {
  ExerciseRecordPolicyResolver,
  type ExerciseRecordCollectionScope,
  type ExerciseRecordPolicyContext,
} from '../../../common/policy/exercise-record-policy-resolver.js';

@Injectable()
export class PrismaExerciseRecordPolicyResolver extends ExerciseRecordPolicyResolver {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async resolveCollection(
    principal: AuthenticatedPrincipal,
  ): Promise<ExerciseRecordCollectionScope> {
    if (principal.role === 'STUDENT') {
      const student = await this.prisma.studentProfile.findFirst({
        where: {
          organizationId: principal.organizationId,
          userId: principal.userId,
          status: 'ACTIVE',
          deletedAt: null,
        },
        select: { id: true },
      });
      if (student === null) throw new ApplicationError('PERMISSION_RESOURCE_NOT_FOUND', 404);
      return {
        organizationId: principal.organizationId,
        role: principal.role,
        studentId: student.id,
      };
    }
    return {
      organizationId: principal.organizationId,
      role: principal.role,
      ...(principal.role === 'TEACHER' ? { teacherUserId: principal.userId } : {}),
    };
  }

  async resolveRecord(
    principal: AuthenticatedPrincipal,
    recordId: string,
  ): Promise<ExerciseRecordPolicyContext> {
    const record = await this.prisma.exerciseRecord.findFirst({
      where: { id: recordId, organizationId: principal.organizationId },
      include: {
        student: { select: { userId: true } },
        classSection: { include: { teacher: { select: { userId: true } } } },
      },
    });
    if (record === null) throw new ApplicationError('EXERCISE_RECORD_NOT_FOUND', 404);
    const authorized =
      (principal.role === 'STUDENT' && record.student.userId === principal.userId) ||
      (principal.role === 'TEACHER' && record.classSection.teacher.userId === principal.userId) ||
      principal.role === 'ADMIN';
    if (!authorized) throw new ApplicationError('EXERCISE_RECORD_NOT_FOUND', 404);
    return {
      recordId: record.id,
      organizationId: record.organizationId,
      studentId: record.studentId,
      studentUserId: record.student.userId,
      enrollmentId: record.enrollmentId,
      classSectionId: record.classSectionId,
      teacherUserId: record.classSection.teacher.userId,
      status: record.status,
      version: record.version,
    };
  }
}
