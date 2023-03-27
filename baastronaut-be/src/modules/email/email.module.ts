import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

@Module({
  providers: [
    EmailService,
    {
      provide: 'EMAIL_SERVICE',
      useFactory: (cfgSvc: ConfigService) =>
        cfgSvc.getOrThrow<string>('BAAS_EMAIL_SERVICE'),
      inject: [ConfigService],
    },
    {
      provide: 'EMAIL_USER',
      useFactory: (cfgSvc: ConfigService) =>
        cfgSvc.getOrThrow<string>('BAAS_EMAIL_USER'),
      inject: [ConfigService],
    },
    {
      provide: 'EMAIL_SECRET',
      useFactory: (cfgSvc: ConfigService) =>
        cfgSvc.getOrThrow<string>('BAAS_EMAIL_SECRET'),
      inject: [ConfigService],
    },
    {
      provide: 'FRONTEND_URL',
      useFactory: (cfgSvc: ConfigService) =>
        cfgSvc.getOrThrow<string>('BAAS_FRONTEND_URL'),
      inject: [ConfigService],
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}
