import { IsNotEmpty, IsString, Length } from 'class-validator';

export class PasswordLoginRequest {
  @IsString()
  @Length(1, 254)
  account!: string;

  @IsString()
  @Length(1, 256)
  password!: string;
}

export class RefreshRequest {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class LogoutRequest {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
