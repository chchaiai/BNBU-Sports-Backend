import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../common/database/prisma.service.js';
import { ApplicationError } from '../../common/errors/application-error.js';

export interface SemesterProjection {
  id: string;
  organizationId: string;
  academicYear: string;
  termCode: string;
  displayName: string;
  startDate: string;
  endDate: string;
  status: string;
  isCurrent: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

@Injectable()
export class SemestersService {
  constructor(private readonly prisma: PrismaService) {}

  async current(organizationId: string): Promise<SemesterProjection> {
    const semester = await this.prisma.semester.findFirst({
      where: { organizationId, status: 'CURRENT' },
    });
    if (semester === null) throw new ApplicationError('PERMISSION_RESOURCE_NOT_FOUND', 404);
    return {
      id: semester.id,
      organizationId: semester.organizationId,
      academicYear: semester.academicYear,
      termCode: semester.termCode,
      displayName: semester.displayName,
      startDate: dateOnly(semester.startDate),
      endDate: dateOnly(semester.endDate),
      status: semester.status,
      isCurrent: true,
      createdBy: semester.createdBy,
      createdAt: semester.createdAt.toISOString(),
      updatedAt: semester.updatedAt.toISOString(),
      version: semester.version,
    };
  }
}
