import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { PasswordHashModule } from '../password-hash/password-hash.module';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { BearerStrategy } from './bearer.strategy';
import { ApiUserStrategy } from './api-user.strategy';
import { ApiTokensModule } from '../api-tokens/api-tokens.module';

@Module({
  imports: [
    UsersModule,
    PasswordHashModule,
    ApiTokensModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        publicKey: fs.readFileSync(
          configService.getOrThrow<string>('BAAS_APP_JWT_PUBLIC_KEY_FILE'),
          'utf-8',
        ),
        privateKey: fs.readFileSync(
          configService.getOrThrow<string>('BAAS_APP_JWT_PRIVATE_KEY_FILE'),
          'utf-8',
        ),
        signOptions: {
          expiresIn: '10h',
          algorithm: 'RS512',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    {
      provide: 'APP_JWT_PUBLIC_KEY',
      useFactory: (configService: ConfigService) =>
        fs.readFileSync(
          configService.getOrThrow<string>('BAAS_APP_JWT_PUBLIC_KEY_FILE'),
          'utf-8',
        ),
      inject: [ConfigService],
    },
    AuthService,
    LocalStrategy,
    BearerStrategy,
    ApiUserStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
