import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { PublicUsersController } from './public-users.controller';

@Module({
  imports: [UsersModule, AuthModule],
  controllers: [PublicUsersController],
})
export class PublicUsersModule {}
