import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('deals')
@Unique(['dealId'])
export class DealEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'integer' })
  dealId: number;

  @Column()
  title: string;

  @Column({ type: 'integer', default: 0 })
  price: number;

  @Column({ type: 'integer' })
  statusId: number;

  @Column({ type: 'integer' })
  pipelineId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
