import { Transform } from 'class-transformer';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

export enum KeyType {
  META = 'meta',
  AMOCRM = 'amocrm',
}

@Entity('keys')
@Unique(['type'])
export class KeyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: KeyType, unique: true })
  type: KeyType;

  @Column()
  @Transform(({ value }) => (value ? `${'*'.repeat(8)}${String(value).slice(-4)}` : ''))
  key: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
