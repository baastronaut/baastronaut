import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FtsWeight } from './types';

@Entity({
  name: 'fts_groups',
})
export class FtsGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;

  @Column({
    name: 'table_id',
  })
  tableId: number;

  @Column({
    name: 'name',
  })
  name: string;

  @Column({
    name: 'description',
    type: 'text',
    nullable: true,
  })
  description: string | null;

  @OneToMany(() => FtsGroupColumn, (column) => column.ftsGroup, {
    cascade: ['insert', 'update'],
    eager: false,
  })
  columns?: FtsGroupColumn[];
}

@Entity({
  name: 'fts_group_columns',
})
export class FtsGroupColumn {
  @PrimaryColumn({
    name: 'fts_group_id',
  })
  ftsGroupId: number;

  @ManyToOne(() => FtsGroup, {
    eager: false,
  })
  @JoinColumn({
    name: 'fts_group_id',
  })
  ftsGroup?: FtsGroup;

  @PrimaryColumn({
    name: 'column_id',
  })
  columnId: number;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @Column({
    name: 'weight',
    type: 'text',
    nullable: true,
  })
  weight: FtsWeight | null;
}
