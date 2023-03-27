import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserWorkspace } from './user-workspace.entity';

@Entity({
  name: 'users',
})
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'email',
    type: 'varchar',
    length: 300,
  })
  email: string;

  @Column({
    name: 'first_name',
    type: 'varchar',
    length: 300,
    nullable: true,
  })
  firstName: string | null;

  @Column({
    name: 'last_name',
    type: 'varchar',
    length: 300,
    nullable: true,
  })
  lastName: string | null;

  @Column({
    name: 'password',
  })
  passwordHash: string;

  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;

  @Column({
    name: 'verified',
  })
  verified: boolean;

  @Column({
    name: 'verified_at',
    type: 'timestamptz',
    nullable: true,
  })
  verifiedAt: Date | null;

  @Column({
    name: 'verify_token',
    type: 'text',
    nullable: true,
  })
  verifyToken: string | null;

  @Column({
    name: 'verify_token_expires_at',
    type: 'timestamptz',
    nullable: true,
  })
  verifyTokenExpiresAt: Date | null;

  @Column({
    name: 'account_disabled',
  })
  accountDisabled: boolean;

  @Column({
    name: 'account_disabled_at',
    type: 'timestamptz',
    nullable: true,
  })
  accountDisabledAt: Date | null;

  @Column({
    name: 'reset_password_token',
    type: 'text',
    nullable: true,
  })
  resetPasswordToken: string | null;

  @Column({
    name: 'reset_password_token_expires_at',
    type: 'timestamptz',
    nullable: true,
  })
  resetPasswordTokenExpiresAt: Date | null;

  @OneToMany(() => UserWorkspace, (userWorkspace) => userWorkspace.user, {
    eager: false,
  })
  userWorkspaces?: UserWorkspace[];
}
