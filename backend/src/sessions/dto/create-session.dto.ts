import { IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @MinLength(3)
  @MaxLength(4096)
  prompt!: string;

  @IsArray()
  @IsString({ each: true })
  models!: string[];

  @IsOptional()
  @IsString()
  sessionLabel?: string;
}
