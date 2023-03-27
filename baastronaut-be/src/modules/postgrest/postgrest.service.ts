import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import * as fs from 'fs';
import { isValidIdentifier } from '../../utils/names-identifiers-parser';
import { SyncLocksService } from '../sync-locks/sync-locks.service';

@Injectable()
export class PostgrestService {
  private logger = new Logger(PostgrestService.name);

  constructor(
    @Inject('BAAS_PGRST_CONF_FILE') private postgrestConfigFile: string,
    private syncLocksService: SyncLocksService,
  ) {}

  async addDbSchema(schema: string) {
    await this.syncLocksService.executeWithPostgRESTConfigLock(
      async () => await this.modifyDbSchemas(schema, true),
    );
  }

  async removeDbSchema(schema: string) {
    await this.syncLocksService.executeWithPostgRESTConfigLock(
      async () => await this.modifyDbSchemas(schema, false),
    );
  }

  private async modifyDbSchemas(schema: string, add: boolean) {
    if (!isValidIdentifier(schema)) {
      throw new BadRequestException(`${schema} is not a valid identifier.`);
    }

    try {
      const dbSchemasRegex = /^(\s*db-schemas\s*=\s*")(.*)(".*)$/;

      const configFileLines = fs
        .readFileSync(this.postgrestConfigFile, 'utf-8')
        .toString()
        .split('\n');

      for (let i = 0; i < configFileLines.length; i++) {
        let line = configFileLines[i];

        const match = line.match(dbSchemasRegex);
        if (!match) {
          continue;
        }

        let schemas = match[2];
        if (add) {
          const schemasSet = new Set(
            schemas
              .split(',')
              .map((s) => s.trim())
              .filter((s) => s),
          );

          if (schemasSet.has(schema)) {
            return;
          }

          schemas = schemas.length ? `${schemas},${schema}` : schema;
        } else {
          schemas = schemas
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s && s !== schema)
            .join(',');
        }

        configFileLines[i] = line.replace(
          dbSchemasRegex,
          '$1' + schemas + '$3',
        );

        break;
      }

      fs.writeFileSync(this.postgrestConfigFile, configFileLines.join('\n'));
    } catch (err) {
      this.logger.log(
        { err },
        'Error while trying to add schema to postgrest config file.',
      );
      throw err;
    }
  }
}
