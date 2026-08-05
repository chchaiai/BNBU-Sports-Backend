import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/database/prisma.service.js';
import { ApplicationError } from '../../../common/errors/application-error.js';
import { Prisma, type Enrollment, type PrismaClient } from '../../../generated/prisma/client.js';
import type { EnrollmentStatus } from '../domain/enrollment-status.js';
import type { EnrollmentState } from '../domain/enrollment.js';
import {
  EnrollmentRepository,
  type AppendEnrollmentEventInput,
  type EnrollmentListQuery,
  type EnrollmentPage,
  type EnrollmentView,
} from '../domain/enrollment.repository.js';

const enrollmentInclude = {
  student: true,
  classSection: {
    include: {
      teacher: { select: { userId: true } },
      course: true,
      semester: { select: { id: true, status: true, endDate: true } },
      excludedDates: { orderBy: { excludedDate: 'asc' as const } },
    },
  },
} satisfies Prisma.EnrollmentInclude;

type EnrollmentRow = Prisma.EnrollmentGetPayload<{ include: typeof enrollmentInclude }>;
type EnrollmentClient =
  | Pick<PrismaClient, 'enrollment' | 'enrollmentStatusEvent' | 'studentProfile' | '$queryRaw'>
  | Prisma.TransactionClient;

@Injectable()
export class PrismaEnrollmentRepository extends EnrollmentRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findViewById(
    organizationId: string,
    enrollmentId: string,
    transaction?: object,
  ): Promise<EnrollmentView | null> {
    const row = await this.client(transaction).enrollment.findFirst({
      where: { id: enrollmentId, organizationId },
      include: enrollmentInclude,
    });
    return row === null ? null : this.view(row);
  }

  async lockViewById(
    organizationId: string,
    enrollmentId: string,
    transaction: object,
  ): Promise<EnrollmentView | null> {
    const client = this.client(transaction);
    await client.$queryRaw<{ id: string }[]>`
      SELECT id
      FROM enrollments
      WHERE id = ${enrollmentId}::uuid
        AND organization_id = ${organizationId}::uuid
      FOR UPDATE
    `;
    return this.findViewById(organizationId, enrollmentId, transaction);
  }

  async findStudentByUser(
    organizationId: string,
    userId: string,
    transaction?: object,
  ): Promise<{ id: string; status: string; deletedAt: Date | null } | null> {
    return this.client(transaction).studentProfile.findFirst({
      where: { organizationId, userId },
      select: { id: true, status: true, deletedAt: true },
    });
  }

  async findStudentById(
    organizationId: string,
    studentId: string,
    transaction?: object,
  ): Promise<{
    id: string;
    userId: string;
    status: string;
    deletedAt: Date | null;
  } | null> {
    return this.client(transaction).studentProfile.findFirst({
      where: { organizationId, id: studentId },
      select: { id: true, userId: true, status: true, deletedAt: true },
    });
  }

  async findForClassStudent(
    classSectionId: string,
    studentId: string,
    transaction: object,
  ): Promise<EnrollmentState | null> {
    const row = await this.client(transaction).enrollment.findUnique({
      where: { classSectionId_studentId: { classSectionId, studentId } },
    });
    return row === null ? null : this.state(row);
  }

  async findActiveForSemesterStudent(
    organizationId: string,
    semesterId: string,
    studentId: string,
    transaction: object,
  ): Promise<EnrollmentState | null> {
    const row = await this.client(transaction).enrollment.findFirst({
      where: { organizationId, semesterId, studentId, status: 'ACTIVE' },
    });
    return row === null ? null : this.state(row);
  }

  async create(state: EnrollmentState, transaction: object): Promise<EnrollmentState> {
    try {
      return this.state(await this.client(transaction).enrollment.create({ data: state }));
    } catch (error: unknown) {
      this.mapWriteError(error);
    }
  }

  async update(
    state: EnrollmentState,
    expectedVersion: number,
    transaction: object,
  ): Promise<EnrollmentState | null> {
    const client = this.client(transaction);
    try {
      const changed = await client.enrollment.updateMany({
        where: {
          id: state.id,
          organizationId: state.organizationId,
          version: expectedVersion,
        },
        data: {
          status: state.status,
          endedAt: state.endedAt,
          endReason: state.endReason,
          updatedBy: state.updatedBy,
          updatedAt: state.updatedAt,
          version: state.version,
        },
      });
      if (changed.count !== 1) return null;
      const row = await client.enrollment.findUnique({ where: { id: state.id } });
      return row === null ? null : this.state(row);
    } catch (error: unknown) {
      this.mapWriteError(error);
    }
  }

  async appendEvent(input: AppendEnrollmentEventInput, transaction: object): Promise<void> {
    await this.client(transaction).enrollmentStatusEvent.create({ data: input });
  }

  async list(query: EnrollmentListQuery): Promise<EnrollmentPage> {
    const positionWhere: Prisma.EnrollmentWhereInput =
      query.position === null
        ? {}
        : {
            OR: [
              {
                joinedAt: {
                  [query.sortDirection === 'asc' ? 'gt' : 'lt']: new Date(query.position.value),
                },
              },
              {
                joinedAt: new Date(query.position.value),
                id: { [query.sortDirection === 'asc' ? 'gt' : 'lt']: query.position.id },
              },
            ],
          };
    const where: Prisma.EnrollmentWhereInput = {
      organizationId: query.organizationId,
      ...(query.studentId === undefined ? {} : { studentId: query.studentId }),
      ...(query.teacherUserId === undefined
        ? {}
        : { classSection: { teacher: { userId: query.teacherUserId } } }),
      ...(query.classSectionId === undefined ? {} : { classSectionId: query.classSectionId }),
      ...(query.semesterId === undefined ? {} : { semesterId: query.semesterId }),
      ...(query.status === undefined ? {} : { status: query.status }),
      ...positionWhere,
    };
    const rows = await this.prisma.enrollment.findMany({
      where,
      orderBy: [{ joinedAt: query.sortDirection }, { id: query.sortDirection }],
      take: query.limit + 1,
      include: enrollmentInclude,
    });
    return {
      items: rows.slice(0, query.limit).map((row) => this.view(row)),
      hasMore: rows.length > query.limit,
    };
  }

  private view(row: EnrollmentRow): EnrollmentView {
    return {
      enrollment: this.state(row),
      student: row.student,
      classSection: {
        id: row.classSection.id,
        organizationId: row.classSection.organizationId,
        courseId: row.classSection.courseId,
        semesterId: row.classSection.semesterId,
        teacherId: row.classSection.teacherId,
        teacherUserId: row.classSection.teacher.userId,
        classCode: row.classSection.classCode,
        displayName: row.classSection.displayName,
        status: row.classSection.status,
        isEnrollmentOpen: row.classSection.isEnrollmentOpen,
        checkInWindowMode: row.classSection.checkInWindowMode,
        checkInStartDate: row.classSection.checkInStartDate,
        checkInEndDate: row.classSection.checkInEndDate,
        dailyStartTime: row.classSection.dailyStartTime,
        dailyEndTime: row.classSection.dailyEndTime,
        submissionDeadlineAt: row.classSection.submissionDeadlineAt,
        excludedDates: row.classSection.excludedDates.map(({ excludedDate }) => excludedDate),
        createdAt: row.classSection.createdAt,
        updatedAt: row.classSection.updatedAt,
        version: row.classSection.version,
        course: row.classSection.course,
        semester: row.classSection.semester,
      },
    };
  }

  private state(row: Enrollment): EnrollmentState {
    return {
      ...row,
      status: row.status as EnrollmentStatus,
      source: row.source as EnrollmentState['source'],
    };
  }

  private client(transaction?: object): EnrollmentClient {
    return (transaction ?? this.prisma) as EnrollmentClient;
  }

  private mapWriteError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = JSON.stringify(error.meta?.target ?? '');
      if (target.includes('semester')) {
        throw new ApplicationError('ENROLLMENT_SEMESTER_CONFLICT', 409);
      }
      throw new ApplicationError('ENROLLMENT_ALREADY_ACTIVE', 409);
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      ['P2003', 'P2004'].includes(error.code)
    ) {
      throw new ApplicationError('USER_IDENTITY_CONFLICT', 409);
    }
    throw error;
  }
}
