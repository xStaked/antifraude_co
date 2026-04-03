import { IsString, IsEnum, MinLength, MaxLength } from 'class-validator';
import { ActionType } from '@sn8/database';

export class ModerationActionDto {
  @IsEnum(ActionType)
  actionType!: ActionType;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  note!: string;
}
