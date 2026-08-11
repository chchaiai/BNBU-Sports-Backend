import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class PasswordLoginRequest {
  @IsEmail()
  @Length(3, 254)
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
