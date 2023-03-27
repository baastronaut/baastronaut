import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as crypto from 'crypto';

@Injectable()
export class SyncLocksService {
  private logger = new Logger(SyncLocksService.name);

  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @Inject('USER_DATA_DB_HOST') private userDataDbHost: string,
    @Inject('USER_DATA_DB_PORT') private userDataDbPort: number,
    @Inject('USER_DATA_DB_NAME') private userDataDbName: string,
  ) {}

  async executeWithPostgRESTConfigLock(cb: () => any) {
    const hash = crypto
      .createHash('md5')
      .update(
        `${this.userDataDbHost}:${this.userDataDbPort}/${this.userDataDbName}`,
      )
      .digest('hex');

    const lockKey = parseInt(`0x${hash.substring(0, 8)}`);

    await this.dataSource.manager.transaction(async (manager) => {
      this.logger.log({ lockKey }, 'Getting lock with key');

      const lock = await manager.query(
        `SELECT pg_advisory_xact_lock(${lockKey})`,
      );

      this.logger.log({ lock }, 'Lock acquired');

      await cb();

      this.logger.log({ lock }, 'Releasing lock');
    });
  }
}
