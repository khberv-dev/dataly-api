import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { AdAccountEntity } from '../../ad-account/entities/ad-account.entity';

@Entity('campaigns')
@Unique(['campaignId', 'adAccount'])
export class CampaignEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  campaignId: string;

  @Column()
  title: string;

  @Column({ type: 'integer', default: 0 })
  budget: number;

  @Column({ type: 'integer', default: 0 })
  views: number;

  @Column({ type: 'integer', default: 0 })
  clicks: number;

  @ManyToOne(() => AdAccountEntity, { onDelete: 'CASCADE' })
  adAccount: AdAccountEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
