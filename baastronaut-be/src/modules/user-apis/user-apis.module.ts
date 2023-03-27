import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProjectsModule } from '../projects/projects.module';
import { UserDataModule } from '../user-data/user-data.module';
import { UserApisController } from './user-apis.controller';

@Module({
  imports: [UserDataModule, ProjectsModule],
  providers: [
    {
      provide: 'BAAS_PGRST_URL',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.getOrThrow<string>('BAAS_PGRST_URL'),
    },
  ],
  controllers: [UserApisController],
})
export class UserApisModule {}
