import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from '../email/email.module';
import { PasswordHashModule } from '../password-hash/password-hash.module';
import { Workspace } from '../workspaces/workspace.entity';
import { UserWorkspace } from './user-workspace.entity';
import { User } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserWorkspace, Workspace]),
    PasswordHashModule,
    EmailModule,
  ],
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
