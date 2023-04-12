import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from '../../utils/constants';
import { User } from '../users/user.entity';
import { Workspace } from './workspace.entity';

@Entity({
  name: 'workspace_invites',
})
export class WorkspaceInvite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  token: string;

  @ManyToOne(() => Workspace, {
    eager: false,
  })
  @JoinColumn({
    name: 'workspace_id',
  })
  workspace?: Workspace;

  @Column({
    name: 'workspace_id',
  })
  workspaceId: number;

  @ManyToOne(() => User, {
    eager: false,
  })
  @JoinColumn({
    name: 'inviter_id',
  })
  inviter?: User;

  @Column({
    name: 'inviter_id',
  })
  inviterId: number;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @Column({
    name: 'role',
  })
  role: Role;
}
