import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SyncLocksModule } from '../sync-locks/sync-locks.module';
import { PostgrestService } from './postgrest.service';

@Module({
  imports: [SyncLocksModule],
  providers: [
    {
      provide: 'BAAS_PGRST_CONF_FILE',
      useFactory: (configService: ConfigService) =>
        configService.getOrThrow<string>('BAAS_PGRST_CONF_FILE'),
      inject: [ConfigService],
    },
    PostgrestService,
  ],
  exports: [PostgrestService],
})
export class PostgrestModule {}
