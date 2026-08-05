import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class InitiateMediaUploadRequestDto {
  @IsUUID('7')
  sessionId!: string;

  @IsIn(['EXERCISE_RECORD'])
  businessPurpose!: 'EXERCISE_RECORD';

  @IsIn(['IMAGE', 'VIDEO'])
  mediaType!: 'IMAGE' | 'VIDEO';

  @IsString()
  @MinLength(1)
  @MaxLength(127)
  mimeType!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  fileSizeBytes!: number;

  @IsIn(['IN_APP_CAMERA'])
  captureSource!: 'IN_APP_CAMERA';

  @IsOptional()
  @Matches(/^[0-9a-f]{64}$/)
  declaredContentSha256?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationSeconds?: number | null;
}

export class MediaUploadPathDto {
  @IsUUID('7')
  uploadSessionId!: string;
}

export class MediaPathDto {
  @IsUUID('7')
  mediaId!: string;
}

export class ConfirmMediaUploadRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(256)
  @Matches(/^[A-Za-z0-9._:+\-/=]+$/)
  etag!: string;
}

export class BindMediaRequestDto {
  @IsUUID('7')
  sessionId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  expectedVersion!: number;
}

export class MediaAccessRequestDto {
  @IsIn(['VIEW_ORIGINAL'])
  purpose!: 'VIEW_ORIGINAL';
}
