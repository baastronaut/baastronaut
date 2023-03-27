import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Workspace } from '../workspaces/workspace.entity';

@Entity({
  name: 'projects',
})
export class Project {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({
    name: 'name',
    type: 'varchar',
    length: 64,
  })
  name: string;

  @Column({
    name: 'pg_schema_identifier',
    type: 'varchar',
    length: 64,
  })
  pgSchemaIdentifier: string;

  @Column({
    name: 'pg_schema_owner',
    type: 'varchar',
    length: 64,
  })
  pgSchemaOwner: string;

  @Column({
    name: 'pg_schema_owner_encrypted_pw',
    type: 'text',
  })
  pgSchemaOwnerEncryptedPW: string;

  @Column({
    name: 'pg_schema_owner_enc_iv',
    type: 'text',
  })
  pgSchemaOwnerEncIV: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description: string | null;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;

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

  @Column({
    name: 'workspace_id',
  })
  workspaceId: number;

  @ManyToOne(() => Workspace, {
    eager: true,
  })
  @JoinColumn({
    name: 'workspace_id',
  })
  workspace?: Workspace;
}
