import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreateReviewRequestDto {
  @IsString()
  @MinLength(10)
  @MaxLength(20)
  phone!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  applicantName!: string;

  @IsEmail()
  contactEmail!: string;

  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  reason!: string;
}
