import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerOptions } from 'typeorm';
import { ProjectsModule } from './modules/projects/projects.module';
import * as fs from 'fs';
import { UserDataModule } from './modules/user-data/user-data.module';
import { TablesModule } from './modules/tables/tables.module';
import { UserApisModule } from './modules/user-apis/user-apis.module';
import { UserApiDocsModule } from './modules/user-api-docs/user-api-docs.module';
import { PublicUsersModule } from './modules/public-users/public-users.module';
import { APP_GUARD } from '@nestjs/core';
import { BearerAuthGuard } from './modules/auth/bearer-auth.guard';
import { ApiTokensModule } from './modules/api-tokens/api-tokens.module';
import { UsersModule } from './modules/users/users.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        synchronize: false, // never set true in production!
        autoLoadEntities: true,
        logging: configService.get<string>(
          'APP_DB_SQL_LOGGING',
        ) as LoggerOptions,
        host: configService.get<string>('APP_DB_HOST'),
        port: configService.get<number>('APP_DB_PORT'),
        username: configService.get<string>('APP_DB_USER'),
        password: configService.get<string>('APP_DB_PW'),
        database: configService.get<string>('APP_DB_NAME'),
        ssl: configService.get<string>('APP_DB_SSL_CERT')
          ? {
              rejectUnauthorized: true,
              ca: fs
                .readFileSync(configService.get<string>('APP_DB_SSL_CERT')!)
                .toString(),
            }
          : undefined,
        extra: {
          max: configService.get<number>('APP_DB_MAX_CONN'),
        },
      }),
      inject: [ConfigService],
    }),
    ProjectsModule,
    TablesModule,
    UserDataModule,
    UserApisModule,
    UserApiDocsModule,
    PublicUsersModule,
    ApiTokensModule,
    UsersModule,
    WorkspacesModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: BearerAuthGuard,
    },
  ],
})
export class AppModule {}
