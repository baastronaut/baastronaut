import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EncryptionModule } from '../encryption/encryption.module';
import { ProjectsModule } from '../projects/projects.module';
import { UserDataDBModule } from '../user-data-db/user-data-db.module';
import { TableColumn } from '../columns/column.entity';
import { FtsGroup, FtsGroupColumn } from './fts-group.entity';
import { Table } from './table.entity';
import { TablesController } from './tables.controller';
import { TablesService } from './tables.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Table, TableColumn, FtsGroup, FtsGroupColumn]),
    ProjectsModule,
    EncryptionModule,
    UserDataDBModule,
  ],
  controllers: [TablesController],
  providers: [TablesService],
})
export class TablesModule {}
