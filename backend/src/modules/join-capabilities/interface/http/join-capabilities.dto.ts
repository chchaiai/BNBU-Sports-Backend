import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsString, Length, Max, Min } from 'class-validator';

import { STUDENT_GENDERS } from '../../../users/application/student-identity.js';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class IssueJoinCapabilityRequestDto {
  @Transform(trim)
  @IsString()
  @Length(1, 100)
  fullName!: string;

  @Transform(trim)
  @IsString()
  @Length(1, 32)
  studentNumber!: string;

  @IsIn(STUDENT_GENDERS)
  gender!: string;

  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2027)
  gradeYear!: number;
}
