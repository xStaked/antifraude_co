import { IsString, MinLength, MaxLength } from 'class-validator';

export class SearchDto {
  @IsString()
  @MinLength(10)
  @MaxLength(20)
  phone!: string;
}
