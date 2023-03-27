import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SyncLocksService } from './sync-locks.service';

@Module({
  providers: [
    {
      provide: 'USER_DATA_DB_HOST',
      useFactory: (configService: ConfigService) =>
        configService.getOrThrow<string>('USER_DATA_DB_HOST'),
      inject: [ConfigService],
    },
    {
      provide: 'USER_DATA_DB_PORT',
      useFactory: (configService: ConfigService) =>
        configService.getOrThrow<number>('USER_DATA_DB_PORT'),
      inject: [ConfigService],
    },
    {
      provide: 'USER_DATA_DB_NAME',
      useFactory: (configService: ConfigService) =>
        configService.getOrThrow<string>('USER_DATA_DB_NAME'),
      inject: [ConfigService],
    },
    SyncLocksService,
  ],
  exports: [SyncLocksService],
})
export class SyncLocksModule {}
