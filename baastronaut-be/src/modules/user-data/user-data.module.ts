import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '../projects/project.entity';
import { Table } from '../tables/table.entity';
import { UserDataService } from './user-data.service';
import * as fs from 'fs';
import * as jose from 'jose';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Table])],
  providers: [
    {
      provide: 'PGRST_JWT_PRIVATE_KEY_JWK',
      useFactory: async (configService: ConfigService) => {
        const jwkFile = configService.getOrThrow<string>(
          'PGRST_JWT_PRIVATE_KEY_JWK_FILE',
        );
        return await jose.importJWK(
          JSON.parse(fs.readFileSync(jwkFile, 'utf-8')),
          'RS512',
        );
      },
      inject: [ConfigService],
    },
    UserDataService,
  ],
  exports: [UserDataService],
})
export class UserDataModule {}
