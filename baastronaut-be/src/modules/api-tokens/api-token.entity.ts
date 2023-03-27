import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from '../projects/project.entity';
import { User } from '../users/user.entity';

@Entity({
  name: 'api_tokens',
})
export class ApiTokenEntity {
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

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({
    name: 'generated_by_user_id',
  })
  generatedByUser?: User;

  @Column({
    name: 'generated_by_user_id',
  })
  generatedByUserId: number;

  // We only support one api token per project for now, hence OneToOne relation.
  // This is enforced by the unique constraint on project_id in the table.
  @OneToOne(() => Project, { eager: false })
  @JoinColumn({
    name: 'project_id',
  })
  project?: Project;

  @Column({
    name: 'project_id',
  })
  projectId: number;

  @Column({
    name: 'token',
  })
  token: string;

  @Column({
    name: 'read_only',
  })
  readOnly: boolean;
}
