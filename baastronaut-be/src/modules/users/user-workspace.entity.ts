import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../utils/constants';
import { User } from '../users/user.entity';
import { Workspace } from '../workspaces/workspace.entity';

@Entity({
  name: 'user_workspaces',
})
export class UserWorkspace {
  @PrimaryColumn({ name: 'user_id' })
  userId: number;

  @PrimaryColumn({ name: 'workspace_id' })
  workspaceId: number;

  @JoinColumn({ name: 'user_id' })
  @ManyToOne(() => User)
  user: User;

  @JoinColumn({ name: 'workspace_id' })
  @ManyToOne(() => Workspace, {
    eager: false,
  })
  workspace?: Workspace;

  @Column()
  role: Role;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;
}
