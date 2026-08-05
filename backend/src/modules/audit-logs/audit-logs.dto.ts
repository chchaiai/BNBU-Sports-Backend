import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class AuditLogPathDto {
  @IsUUID()
  auditLogId!: string;
}

export class AuditLogListQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @IsOptional()
  @IsIn(['occurredAt', '-occurredAt'])
  sort = '-occurredAt';

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 100)
  q?: string;

  @IsOptional()
  @IsUUID()
  actorUserId?: string;

  @IsOptional()
  @Matches(/^[A-Z][A-Z0-9_]*$/)
  action?: string;

  @IsOptional()
  @Matches(/^[A-Z][A-Z0-9_]*$/)
  targetType?: string;

  @IsOptional()
  @IsUUID()
  targetId?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  occurredAtFrom?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  occurredAtTo?: string;
}
