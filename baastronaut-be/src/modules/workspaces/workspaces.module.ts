import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from '../email/email.module';
import { UsersModule } from '../users/users.module';
import { WorkspaceInvite } from './workspace-invites.entity';
import { Workspace } from './workspace.entity';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workspace, WorkspaceInvite]),
    UsersModule,
    EmailModule,
  ],
  providers: [WorkspacesService],
  controllers: [WorkspacesController],
})
export class WorkspacesModule {}
