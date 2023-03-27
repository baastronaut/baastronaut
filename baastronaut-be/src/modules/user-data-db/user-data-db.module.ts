import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserDataDBService } from './user-data-db-service';
import * as fs from 'fs';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      inject: [ConfigService],
      provide: 'USER_DATA_DB_BASE_CONN_OPTS',
      useFactory: async (configService: ConfigService) => {
        return {
          host: configService.getOrThrow<string>('USER_DATA_DB_HOST'),
          port: configService.getOrThrow<number>('USER_DATA_DB_PORT'),
          user: configService.getOrThrow<string>('USER_DATA_DB_USER'),
          password: configService.getOrThrow<string>('USER_DATA_DB_PW'),
          database: configService.getOrThrow<string>('USER_DATA_DB_NAME'),
          ssl: configService.get<string>('USER_DATA_DB_SSL_CERT')
            ? {
                rejectUnauthorized: true,
                ca: fs
                  .readFileSync(
                    configService.get<string>('USER_DATA_DB_SSL_CERT')!,
                  )
                  .toString(),
              }
            : undefined,
        };
      },
    },
    {
      inject: [ConfigService],
      provide: 'USER_DATA_DB_MIN_CONN',
      useFactory: async (configService: ConfigService) =>
        configService.get<number>('USER_DATA_DB_MIN_CONN'),
    },
    {
      inject: [ConfigService],
      provide: 'USER_DATA_DB_MAX_CONN',
      useFactory: async (configService: ConfigService) =>
        configService.get<number>('USER_DATA_DB_MAX_CONN'),
    },
    UserDataDBService,
  ],
  exports: [UserDataDBService],
})
export class UserDataDBModule {}
