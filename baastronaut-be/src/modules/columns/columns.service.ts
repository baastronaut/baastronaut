import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TableColumn } from './column.entity';
import { UserDataDBService } from '../user-data-db/user-data-db-service';
import { AddColumnReq, ColumnResp } from './types';
import { Table } from '../tables/table.entity';
import { nameToPostgresIdentifier } from '../../utils/names-identifiers-parser';
import { mapColumnTypeToPostgresType } from './column-helpers';

@Injectable()
export class ColumnsService {
  constructor(
    @InjectRepository(TableColumn)
    private columnsRepository: Repository<TableColumn>,
    @InjectRepository(Table)
    private tablesRepository: Repository<Table>,
    private userDataDBService: UserDataDBService,
  ) {}

  async addTableColumn(
    projectId: number,
    tableId: number,
    addColumnReq: AddColumnReq,
  ): Promise<ColumnResp> {
    const tableEntity = await this.tablesRepository.findOne({
      where: {
        projectId,
        id: tableId,
      },
      relations: {
        project: true,
      },
    });
    if (!tableEntity) {
      throw new NotFoundException('Table not found.');
    }

    const pgColumnIdentifier = nameToPostgresIdentifier(addColumnReq.name);

    await this.userDataDBService.addTableColumn({
      table: {
        schema: tableEntity.project!.pgSchemaIdentifier,
        identifier: tableEntity.pgTableIdentifier,
      },
      newColumn: {
        identifier: pgColumnIdentifier,
        columnType: mapColumnTypeToPostgresType(addColumnReq.columnType),
        required: false,
        primary: false,
        default: undefined,
      },
    });

    const newColumnEntity = await this.columnsRepository.save({
      tableId: tableEntity.id!,
      name: addColumnReq.name,
      description: addColumnReq.description,
      columnType: addColumnReq.columnType,
      pgColumnIdentifier,
      required: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      id: newColumnEntity.id!,
      createdAt: newColumnEntity.createdAt!.toISOString(),
      updatedAt: newColumnEntity.updatedAt!.toISOString(),
      tableId: tableEntity.id!,
      description: newColumnEntity.description,
      pgColumnIdentifier: newColumnEntity.pgColumnIdentifier,
      name: newColumnEntity.name,
      columnType: newColumnEntity.columnType,
      required: newColumnEntity.required,
    };
  }

  /**
   * Drops a column from a table. This will delete the column and all the data in it.
   * It is irreversible.
   */
  async dropTableColumn(projectId: number, tableId: number, columnId: number) {
    const columnEntity = await this.columnsRepository.findOne({
      where: {
        tableId,
        id: columnId,
      },
      relations: {
        table: {
          project: true,
        },
      },
    });

    if (!columnEntity || columnEntity.table!.projectId !== projectId) {
      throw new NotFoundException('Column not found.');
    }

    await this.userDataDBService.dropTableColumn({
      table: {
        schema: columnEntity.table!.project!.pgSchemaIdentifier,
        identifier: columnEntity.table!.pgTableIdentifier,
      },
      columnIdentifier: columnEntity.pgColumnIdentifier,
    });

    await this.columnsRepository.delete(columnEntity.id!);
  }
}
