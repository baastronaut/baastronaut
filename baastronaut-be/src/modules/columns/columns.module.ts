import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TableColumn } from './column.entity';
import { Table } from '../tables/table.entity';
import { UserDataDBModule } from '../user-data-db/user-data-db.module';
import { ColumnsController } from './columns.controller';
import { ColumnsService } from './columns.service';

@Module({
  imports: [TypeOrmModule.forFeature([Table, TableColumn]), UserDataDBModule],
  controllers: [ColumnsController],
  providers: [ColumnsService],
})
export class ColumnsModule {}
