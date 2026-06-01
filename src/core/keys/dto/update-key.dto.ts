import { IsEnum, IsOptional, IsString } from 'class-validator';
import { KeyType } from '../entities/key.entity';

export class UpdateKeyDto {
  @IsEnum(KeyType)
  @IsOptional()
  type?: KeyType;

  @IsString()
  @IsOptional()
  key?: string;
}
