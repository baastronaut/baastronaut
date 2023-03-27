import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationError } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import TransportStream from 'winston-transport';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function bootstrap() {
  if (
    !process.env.BAAS_ERR_LOG_FILE ||
    !process.env.BAAS_ERR_LOG_LEVEL ||
    !process.env.BAAS_COMBINED_LOG_FILE ||
    !process.env.BAAS_MIN_LOG_LEVEL
  ) {
    throw new Error('Missing required env var to configure logs');
  }

  const format = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  );

  const transports: TransportStream[] = [
    new winston.transports.File({
      filename: process.env.BAAS_ERR_LOG_FILE,
      level: process.env.BAAS_ERR_LOG_LEVEL,
      format,
    }),
    new winston.transports.File({
      filename: process.env.BAAS_COMBINED_LOG_FILE,
      format,
    }),
  ];

  if (process.env.NODE_ENV === 'local') {
    transports.push(
      new winston.transports.Console({
        format,
      }),
    );
  }

  const logger = WinstonModule.createLogger({
    level: process.env.BAAS_MIN_LOG_LEVEL,
    exitOnError: false,
    transports,
  });

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger,
  });
  const configService: ConfigService = app.get(ConfigService);

  const origins: RegExp[] = (configService.get('BAAS_ALLOWED_ORIGINS') || '')
    .split(',')
    .map((v: string) => v.trim())
    .filter((v: string) => !!v)
    .map((v: string) => new RegExp(v, 'i'));

  app.enableCors({
    origin: origins,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors: ValidationError[]) => {
        const validationErrors: {
          property: string;
          errorMessages: string[];
        }[] = [];
        errors.forEach((error) => {
          const errorMessages: string[] = [];
          const err = {
            property: error.property,
            errorMessages,
          };
          Object.entries(error.constraints || {}).forEach(
            ([constraintName, errorMsg]) => {
              err.errorMessages.push(errorMsg);
            },
          );
          validationErrors.push(err);
        });
        const responseJson = {
          statusCode: 400,
          message: 'Invalid inputs received.',
          error: 'Bad Request',
          validationErrors,
        };
        return new BadRequestException(responseJson);
      },
    }),
  );
  app.use(helmet());
  await app.listen(process.env.BAAS_PORT || 3001);
}
bootstrap();
