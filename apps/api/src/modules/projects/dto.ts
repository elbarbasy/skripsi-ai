import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  title!: string;

  @IsOptional() @IsString() topic?: string;
  @IsOptional() @IsString() studyProgram?: string;
  @IsOptional() @IsString() researchMethod?: string;
  @IsOptional() @IsString() guidelineId?: string;
}

export class UpdateProjectDto {
  @IsOptional() @IsString() @MaxLength(300) title?: string;
  @IsOptional() @IsString() topic?: string;
  @IsOptional() @IsString() studyProgram?: string;
  @IsOptional() @IsString() researchMethod?: string;
  @IsOptional() @IsString() guidelineId?: string;
}
