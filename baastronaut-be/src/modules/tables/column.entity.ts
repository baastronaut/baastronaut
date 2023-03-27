import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Table } from './table.entity';

export enum ColumnType {
  INTEGER = 'INTEGER',
  FLOAT = 'FLOAT',
  TEXT = 'TEXT',
  BOOLEAN = 'BOOLEAN',
  DATETIME = 'DATETIME',
}

@Entity({
  name: 'columns',
})
export class TableColumn {
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

  @ManyToOne(() => Table, (table) => table.columns, {
    eager: true,
    orphanedRowAction: 'delete',
  })
  @JoinColumn({
    name: 'table_id',
  })
  table?: Table;

  @Column({
    name: 'table_id',
    type: 'integer',
  })
  tableId?: number;

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
    name: 'column_type',
    type: 'text',
  })
  columnType: ColumnType;

  @Column({
    name: 'pg_column_identifier',
    type: 'varchar',
    length: 64,
  })
  pgColumnIdentifier: string;

  @Column({
    name: 'required',
    type: 'boolean',
  })
  required: boolean;
}
