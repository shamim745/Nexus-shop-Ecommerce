import { IsString, Length, MaxLength, MinLength } from "class-validator";

export class ResetPasswordDto {
  @IsString()
  @Length(32, 128)
  token!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
