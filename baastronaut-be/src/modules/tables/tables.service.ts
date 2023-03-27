import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, PaginateQuery } from 'nestjs-paginate';
import { Repository } from 'typeorm';
import { nameToPostgresIdentifier } from '../../utils/names-identifiers-parser';
import { PG_ERR_CODES } from '../../utils/postgres-constants';
import { Pageable } from '../../utils/utility-types';
import { AuthedUser } from '../auth/auth.service';
import { EncryptionService } from '../encryption/encryption.service';
import { ProjectsService } from '../projects/projects.service';
import {
  NewColumnDetails,
  NewTableDetails,
  SupportedPostgresColType,
  UserDataDBService,
} from '../user-data-db/user-data-db-service';
import { ColumnType } from './column.entity';
import { DEFAULT_GENERATED_COLUMN_NAMES } from './constants';
import { FtsGroup } from './fts-group.entity';
import { Table } from './table.entity';
import { TABLES_PAGINATION_CONFIG } from './tables-pagination.config';
import { CreateFtsGroupReq, CreateTableReq, TableResp } from './types';

function mapColumnTypeToPostgresType(
  columnType: ColumnType,
): SupportedPostgresColType {
  if (columnType === ColumnType.INTEGER) {
    return SupportedPostgresColType.INTEGER;
  } else if (columnType === ColumnType.FLOAT) {
    return SupportedPostgresColType.FLOAT;
  } else if (columnType === ColumnType.TEXT) {
    return SupportedPostgresColType.TEXT;
  } else if (columnType === ColumnType.BOOLEAN) {
    return SupportedPostgresColType.BOOLEAN;
  } else if (columnType === ColumnType.DATETIME) {
    return SupportedPostgresColType.TIMESTAMPTZ;
  }

  throw new Error(`Type ${columnType} is not handled.`);
}

function mapPostgresTypeToColumnType(
  postgresType: SupportedPostgresColType,
): ColumnType {
  if (
    postgresType === SupportedPostgresColType.SERIAL ||
    postgresType === SupportedPostgresColType.INTEGER
  ) {
    return ColumnType.INTEGER;
  } else if (postgresType === SupportedPostgresColType.FLOAT) {
    return ColumnType.FLOAT;
  } else if (postgresType === SupportedPostgresColType.TEXT) {
    return ColumnType.TEXT;
  } else if (postgresType === SupportedPostgresColType.BOOLEAN) {
    return ColumnType.BOOLEAN;
  } else if (postgresType === SupportedPostgresColType.TIMESTAMPTZ) {
    return ColumnType.DATETIME;
  }

  throw new Error(`Type ${postgresType} is not handled.`);
}

type DefaultGeneratedColumnDetails = NewColumnDetails & {
  name: string;
};

const DEFAULT_GENERATED_COLUMNS: DefaultGeneratedColumnDetails[] = [
  {
    identifier: DEFAULT_GENERATED_COLUMN_NAMES.ID,
    name: 'ID',
    columnType: SupportedPostgresColType.SERIAL,
    required: true,
    primary: true,
  },
  {
    identifier: DEFAULT_GENERATED_COLUMN_NAMES.CREATED_AT,
    name: 'Created At',
    columnType: SupportedPostgresColType.TIMESTAMPTZ,
    required: true,
    primary: false,
    default: 'now()',
  },
  {
    identifier: DEFAULT_GENERATED_COLUMN_NAMES.UPDATED_AT,
    columnType: SupportedPostgresColType.TIMESTAMPTZ,
    name: 'Updated at',
    required: true,
    primary: false,
    default: 'now()',
  },
  {
    identifier: DEFAULT_GENERATED_COLUMN_NAMES.CREATOR,
    columnType: SupportedPostgresColType.TEXT,
    name: 'Creator',
    required: true,
    primary: false,
  },
];

@Injectable()
export class TablesService {
  private logger = new Logger(TablesService.name);

  constructor(
    @InjectRepository(Table)
    private tablesRepository: Repository<Table>,
    private projectsService: ProjectsService,
    private userDataDBService: UserDataDBService,
    private encryptionService: EncryptionService,
    @InjectRepository(FtsGroup)
    private ftsGroupsRepository: Repository<FtsGroup>,
  ) {}

  async createTableInProject(
    projectId: number,
    createTableReq: CreateTableReq,
    authedUser: AuthedUser,
  ): Promise<TableResp> {
    const project = await this.projectsService.getProjectEntityOrThrow(
      projectId,
    );

    const connCredentials = {
      owner: project.pgSchemaOwner,
      password: this.encryptionService.decrypt({
        iv: project.pgSchemaOwnerEncIV,
        payload: project.pgSchemaOwnerEncryptedPW,
      }),
    };

    const { newTableDetails, columnIdentifierMappings } =
      this.createTableReqToTableDetails(
        project.pgSchemaIdentifier,
        createTableReq,
      );

    try {
      await this.userDataDBService.createTableWithRowLevelSecurity(
        newTableDetails,
        connCredentials,
        DEFAULT_GENERATED_COLUMN_NAMES.CREATOR,
      );
      await this.userDataDBService.reloadPostgrestSchema();
    } catch (err) {
      if (err.code && err.code === PG_ERR_CODES.DUPLICATE_TABLE) {
        throw new BadRequestException(
          `"${createTableReq.name}" maps to table name "${newTableDetails.identifier}" which already exists in this project. Please pick another name.`,
        );
      }
      this.logger.error({ err }, 'Error while trying to create a new table.');
      throw new InternalServerErrorException(
        'An error occurred while creating new table.',
      );
    }

    try {
      let table = new Table();
      table.projectId = projectId;
      table.name = createTableReq.name;
      table.description = createTableReq.description;
      table.pgTableIdentifier = newTableDetails.identifier;
      table.columns = createTableReq.columns.map((col) => ({
        table: table,
        name: col.name,
        description: col.description,
        columnType: col.columnType,
        pgColumnIdentifier: columnIdentifierMappings.get(col.name)!,
        required: col.required,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      table.creatorId = authedUser.id;
      table = await this.tablesRepository.save(table);

      return await this.toTableResp(table);
    } catch (err) {
      await this.userDataDBService.dropTable(newTableDetails);
      throw err;
    }
  }

  async getTablesInProject(
    projectId: number,
    paginateQuery: PaginateQuery,
  ): Promise<Pageable<TableResp>> {
    const queryBuilder = this.tablesRepository
      .createQueryBuilder('tables')
      // important to prevent N+1 query later on
      .leftJoinAndSelect('tables.columns', 'columns')
      .where('tables.projectId = :projectId', { projectId });

    const paginatedEntityResults = await paginate<Table>(
      paginateQuery,
      queryBuilder,
      TABLES_PAGINATION_CONFIG,
    );

    const paginatedResp: Pageable<TableResp> = {
      ...paginatedEntityResults,
      data: await Promise.all(
        paginatedEntityResults.data.map(
          async (tableEntity) => await this.toTableResp(tableEntity),
        ),
      ),
    };

    return paginatedResp;
  }

  async getTable(projectId: number, tableId: number): Promise<TableResp> {
    const table = await this.tablesRepository.findOne({
      where: {
        projectId: projectId,
        id: tableId,
      },
      relations: {
        columns: true,
      },
    });

    if (!table) {
      throw new NotFoundException('Table does not exist.');
    }

    return await this.toTableResp(table);
  }

  /**
   * Deletes a table. Doesn't check whether user has the rights to delete the table or not.
   * Will also drop the postgres table that maps to this table.
   * Irreversible action.
   */
  async deleteTable(projectId: number, tableId: number) {
    const table = await this.tablesRepository.findOne({
      where: {
        projectId: projectId,
        id: tableId,
      },
      relations: {
        project: true,
      },
    });

    if (!table) {
      throw new NotFoundException('Table not found.');
    }

    if (!table.id) {
      throw new InternalServerErrorException('Unexpected invalid table state.');
    }

    if (!table.project) {
      throw new InternalServerErrorException(
        'Internal server error. Did not load project.',
      );
    }

    await this.userDataDBService.dropTable({
      identifier: table.pgTableIdentifier,
      schema: table.project.pgSchemaIdentifier,
    });

    // ON DELETE CASCADE is already set in the database for table -> columns
    await this.tablesRepository.delete(table.id);
  }

  // NOT READY
  // async createTableFtsGroup(
  //   projectId: number,
  //   tableId: number,
  //   createFtsGroupReq: CreateFtsGroupReq,
  // ): Promise<FtsGroup> {
  //   const table = await this.tablesRepository.findOne({
  //     where: {
  //       projectId: projectId,
  //       id: tableId,
  //     },
  //     relations: {
  //       columns: true,
  //     },
  //   });

  //   if (!table) {
  //     throw new NotFoundException('Table not found.');
  //   }

  //   if (!table.id) {
  //     throw new InternalServerErrorException('Unexpected invalid table state.');
  //   }

  //   const tableColumnsMap = new Map(
  //     table.columns?.map((c) => [c.id!, c]) || [],
  //   );

  //   const columnsForFtsGroup = createFtsGroupReq.columns.map((col) => {
  //     const dbColEntity = tableColumnsMap.get(col.id);
  //     if (!dbColEntity) {
  //       throw new BadRequestException(
  //         `Column ${col.id} does not belong to table.`,
  //       );
  //     }
  //     return {
  //       id: dbColEntity.id!,
  //       name: dbColEntity.name,
  //       pgColumnIdentifier: dbColEntity.pgColumnIdentifier,
  //       weight: col.weight,
  //     };
  //   });

  //   // TODO: call userDataDBService to create fts columns, if error occurs, don't save

  //   const ftaGroupWithColumnsEntity = await this.ftsGroupsRepository.save({
  //     tableId,
  //     name: createFtsGroupReq.name,
  //     description: createFtsGroupReq.description,
  //     columns: columnsForFtsGroup.map((col) => ({
  //       columnId: col.id,
  //       weight: col.weight,
  //     })),
  //   });

  //   return ftaGroupWithColumnsEntity;
  // }

  private async toTableResp(table: Table): Promise<TableResp> {
    return {
      id: table.id!,
      createdAt: table.createdAt.toISOString(),
      updatedAt: table.updatedAt.toISOString(),
      projectId: table.projectId,
      name: table.name,
      description: table.description,
      pgTableIdentifier: table.pgTableIdentifier,
      columns:
        table.columns?.map((col) => ({
          id: col.id!,
          createdAt: col.createdAt.toISOString(),
          updatedAt: col.updatedAt.toISOString(),
          tableId: col.tableId!,
          name: col.name,
          description: col.description,
          columnType: col.columnType,
          pgColumnIdentifier: col.pgColumnIdentifier,
          required: col.required,
        })) || [],
      generatedColumns: DEFAULT_GENERATED_COLUMNS.map((col) => ({
        pgColumnIdentifier: col.identifier,
        name: col.name,
        columnType: mapPostgresTypeToColumnType(col.columnType),
        required: col.required,
        primary: col.primary,
      })),
    };
  }

  private createTableReqToTableDetails(
    schema: string,
    createTableReq: CreateTableReq,
  ): {
    newTableDetails: NewTableDetails;
    columnIdentifierMappings: Map<string, string>;
  } {
    const columnIdentifierMappings = new Map<string, string>();

    const columns: NewColumnDetails[] = DEFAULT_GENERATED_COLUMNS.map(
      (col) => ({
        identifier: col.identifier,
        required: col.required,
        columnType: col.columnType,
        primary: col.primary,
        default: col.default,
      }),
    ).concat(
      createTableReq.columns.map((col) => {
        const colIdentifier = nameToPostgresIdentifier(col.name);
        columnIdentifierMappings.set(col.name, colIdentifier);
        return {
          identifier: colIdentifier,
          required: col.required,
          columnType: mapColumnTypeToPostgresType(col.columnType),
          primary: false,
          default: undefined,
        };
      }),
    );

    const newTableDetails: NewTableDetails = {
      schema,
      identifier: nameToPostgresIdentifier(createTableReq.name),
      columns,
    };

    return {
      newTableDetails,
      columnIdentifierMappings,
    };
  }
}
