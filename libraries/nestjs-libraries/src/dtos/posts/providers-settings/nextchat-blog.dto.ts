import {
  IsDefined,
  IsOptional,
  IsString,
  IsArray,
  IsIn,
  MinLength,
  ValidateNested,
  IsUrl,
  IsDateString,
} from 'class-validator';
import { MediaDto } from '@gitroom/nestjs-libraries/dtos/media/media.dto';
import { Type } from 'class-transformer';

export class NextChatBlogDto {
  @IsString()
  @MinLength(2)
  @IsDefined()
  title: string;

  @IsString()
  @IsDefined()
  botConfigId: string;

  @IsString()
  @IsOptional()
  @IsIn(['draft', 'published'])
  status?: 'draft' | 'published';

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tagIds?: string[];

  @IsString()
  @IsOptional()
  metaDescription?: string;

  @IsString()
  @IsUrl()
  @IsOptional()
  featuredImage?: string;

  @IsString()
  @IsUrl()
  @IsOptional()
  websiteUrl?: string;

  @IsString()
  @IsDateString()
  @IsOptional()
  publishedAt?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => MediaDto)
  main_image?: MediaDto;
}
