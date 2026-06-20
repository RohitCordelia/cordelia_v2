import { IsOptional, IsString } from 'class-validator';

export class ChatDto {
  @IsString()
  query!: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  jwtToken?: string;

  @IsOptional()
  @IsString()
  pageHint?: string;
}
