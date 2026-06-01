import { IsEnum, IsString } from 'class-validator';
import { KeyType } from '../entities/key.entity';

export class CreateKeyDto {
  @IsEnum(KeyType)
  type: KeyType;

  @IsString()
  key: string;
}
