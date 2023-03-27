import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsModule } from '../projects/projects.module';
import { UserDataModule } from '../user-data/user-data.module';
import { ApiTokenEntity } from './api-token.entity';
import { ApiTokensController } from './api-tokens.controller';
import { ApiTokensService } from './api-tokens.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApiTokenEntity]),
    ProjectsModule,
    UserDataModule,
  ],
  controllers: [ApiTokensController],
  providers: [ApiTokensService],
  exports: [ApiTokensService],
})
export class ApiTokensModule {}
