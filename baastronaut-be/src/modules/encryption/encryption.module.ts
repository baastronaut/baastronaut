import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from './encryption.service';

@Module({
  providers: [
    {
      provide: 'BAAS_ENCRYPTION_KEY_HEX',
      useFactory: (configService: ConfigService) =>
        configService.getOrThrow<string>('BAAS_ENCRYPTION_KEY_HEX'),
      inject: [ConfigService],
    },
    EncryptionService,
  ],
  exports: [EncryptionService],
})
export class EncryptionModule {}
