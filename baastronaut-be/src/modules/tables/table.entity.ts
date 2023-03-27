import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from '../projects/project.entity';
import { User } from '../users/user.entity';
import { TableColumn } from './column.entity';

@Entity({
  name: 'tables',
})
export class Table {
  @PrimaryGeneratedColumn()
  id?: number;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;

  @Column({
    name: 'project_id',
    type: 'integer',
  })
  projectId: number;

  @ManyToOne(() => Project, {
    eager: false,
  })
  @JoinColumn({
    name: 'project_id',
  })
  project?: Project;

  @Column({
    name: 'name',
    type: 'varchar',
    length: 64,
  })
  name: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description: string | null;

  @Column({
    name: 'pg_table_identifier',
    type: 'varchar',
    length: 64,
  })
  pgTableIdentifier: string;

  @OneToMany(() => TableColumn, (column) => column.table, {
    cascade: ['insert', 'update'],
    eager: false,
  })
  columns?: TableColumn[];

  @Column({
    name: 'creator_id',
  })
  creatorId: number;

  @ManyToOne(() => User, {
    eager: true,
  })
  @JoinColumn({
    name: 'creator_id',
  })
  creator?: User;
}
