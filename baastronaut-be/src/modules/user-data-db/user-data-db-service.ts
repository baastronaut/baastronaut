import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, ValidateNested } from 'class-validator';
import { Client, Pool } from 'pg';
import { validateOrThrow } from '../../utils/helpers';
import { IsValidIdentifier } from '../../utils/validators';

type BaseConnOptions = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl?: {
    rejectUnauthorized: boolean;
    ca: string;
  };
};

export class SchemaDetails {
  @IsValidIdentifier()
  identifier: string;

  @IsValidIdentifier()
  owner: string;
}

export class NewSchemaDetails extends SchemaDetails {
  password: string;
}

export class ConnCredentials {
  @IsValidIdentifier()
  owner: string;

  password: string;
}

export enum SupportedPostgresColType {
  SERIAL = 'SERIAL',
  INTEGER = 'INTEGER',
  FLOAT = 'FLOAT',
  TEXT = 'TEXT',
  BOOLEAN = 'BOOLEAN',
  TIMESTAMPTZ = 'TIMESTAMPTZ',
}

export class NewColumnDetails {
  @IsValidIdentifier()
  identifier: string;

  columnType: SupportedPostgresColType;

  @IsBoolean()
  required: boolean;

  @IsBoolean()
  primary: boolean;

  default?: string;
}

export class TableDetails {
  @IsValidIdentifier()
  schema: string;

  @IsValidIdentifier()
  identifier: string;
}

export class AddColumnDetails {
  @ValidateNested()
  @Type(() => TableDetails)
  table: TableDetails;

  @ValidateNested()
  @Type(() => NewColumnDetails)
  newColumn: NewColumnDetails;
}

export class DropColumnDetails {
  @ValidateNested()
  @Type(() => TableDetails)
  table: TableDetails;

  @IsValidIdentifier()
  columnIdentifier: string;
}

export class NewTableDetails extends TableDetails {
  @ValidateNested()
  @IsArray()
  @Type(() => NewColumnDetails)
  columns: NewColumnDetails[];
}

export class QueryWithSemiColonException extends Error {
  constructor(msg: string) {
    super(msg);
  }
}

function hasSemiColon(s: string): boolean {
  return s.includes(';');
}

function checkSQLSafeOrThrow(sqlQuery: string) {
  if (hasSemiColon(sqlQuery)) {
    throw new QueryWithSemiColonException(
      `query '${sqlQuery}' has semi-colon. Possible SQL injection attempted.`,
    );
  }
}

const BEGIN = 'BEGIN';
const COMMIT = 'COMMIT';

/**
 * Executes queries sequentially in a transaction using the connection given.
 * This does not check for sql-injection attempts. Callers should check and sanitize before
 * calling this function.
 */
async function executeTransactionalQueries(
  conn: Pool | Client,
  queries: string[],
) {
  await conn.query(BEGIN);
  for (const query of queries) {
    await conn.query(query);
  }
  await conn.query(COMMIT);
}

@Injectable()
export class UserDataDBService {
  /**
   * userDataDBAdminConn is only used for creating schemas and roles, and other management stuff. This is akin to the superuser of the db.
   * For modifying objects (tables, columns) in a schema, use the schema's owner.
   */
  userDataDBAdminConn: Pool;

  constructor(
    @Inject('USER_DATA_DB_BASE_CONN_OPTS')
    private userDataDbBaseConnOpts: BaseConnOptions,
    @Inject('USER_DATA_DB_MIN_CONN') userDataDbMinConn: number,
    @Inject('USER_DATA_DB_MAX_CONN') userDataDbMaxConn: number,
  ) {
    this.userDataDBAdminConn = new Pool({
      ...userDataDbBaseConnOpts,
      min: userDataDbMinConn,
      max: userDataDbMaxConn,
    });
  }

  /**
   * Creates new schema and new user. The user role is set as the owner of the schema.
   */
  async createSchemaWithOwner(newSchemaDetails: NewSchemaDetails) {
    await validateOrThrow(NewSchemaDetails, newSchemaDetails);

    const createRoleQuery = `CREATE ROLE ${newSchemaDetails.owner} PASSWORD '${newSchemaDetails.password}' LOGIN`;
    const setSearchPathQuery = `ALTER ROLE ${newSchemaDetails.owner} SET search_path = "${newSchemaDetails.identifier}"`;
    const createSchemaQuery = `CREATE SCHEMA ${newSchemaDetails.identifier} AUTHORIZATION ${newSchemaDetails.owner}`;

    checkSQLSafeOrThrow(createRoleQuery);
    checkSQLSafeOrThrow(setSearchPathQuery);
    checkSQLSafeOrThrow(createSchemaQuery);

    await executeTransactionalQueries(this.userDataDBAdminConn, [
      createRoleQuery,
      setSearchPathQuery,
      createSchemaQuery,
    ]);
  }

  /**
   * Drops schema and owner. To drop schema even when it contains objects (tables, functions, etc),
   * set "cascade" to true. If "cascade" is false and you attempt to drop a schema with objects,
   * the command will fail.
   */
  async dropSchemaAndOwner(schemaDetails: SchemaDetails, cascade: boolean) {
    const dropSchemaQuery = `DROP SCHEMA ${schemaDetails.identifier} ${
      cascade ? 'CASCADE' : ''
    }`;
    const dropRoleQuery = `DROP ROLE ${schemaDetails.owner}`;

    checkSQLSafeOrThrow(dropSchemaQuery);
    checkSQLSafeOrThrow(dropRoleQuery);

    await executeTransactionalQueries(this.userDataDBAdminConn, [
      dropSchemaQuery,
      dropRoleQuery,
    ]);
  }

  async createTableWithRowLevelSecurity(
    newTableDetails: NewTableDetails,
    connCredentials: ConnCredentials,
    creatorColumn: string,
  ) {
    await validateOrThrow(NewTableDetails, newTableDetails);

    const primaryColumns = newTableDetails.columns.filter((col) => col.primary);
    const primaryKeys = primaryColumns.length
      ? `PRIMARY KEY(${primaryColumns.map((pc) => pc.identifier).join(', ')})`
      : '';
    const createTableQuery = `CREATE TABLE ${newTableDetails.schema}.${
      newTableDetails.identifier
    } (
      ${newTableDetails.columns.map(newColumnDetailsToPartialSql).join(',\n')}
      ${primaryKeys ? `, ${primaryKeys}` : ''}
    )`;

    // Force does not enable RLS. You need to enable and then force. Force ensures that table owner is subject to RLS too.
    const enableRLSQuery = `ALTER TABLE ${newTableDetails.identifier} ENABLE ROW LEVEL SECURITY`;
    const forceRLSQuery = `ALTER TABLE ${newTableDetails.identifier} FORCE ROW LEVEL SECURITY`;
    const selectPolicyQuery = `CREATE POLICY ${newTableDetails.identifier}_sel_policy ON ${newTableDetails.identifier} FOR SELECT USING (true)`;
    const modificationPolicyQuery = `CREATE POLICY ${newTableDetails.identifier}_mod_policy ON ${newTableDetails.identifier} USING (${creatorColumn} = current_setting('request.jwt.claims', true)::json->>'email')`;

    checkSQLSafeOrThrow(createTableQuery);
    checkSQLSafeOrThrow(enableRLSQuery);
    checkSQLSafeOrThrow(forceRLSQuery);
    checkSQLSafeOrThrow(selectPolicyQuery);
    checkSQLSafeOrThrow(modificationPolicyQuery);

    let client: Client | null = null;
    try {
      client = await this.getClient(connCredentials);
      await executeTransactionalQueries(client, [
        createTableQuery,
        enableRLSQuery,
        forceRLSQuery,
        selectPolicyQuery,
        modificationPolicyQuery,
      ]);
    } finally {
      if (client) {
        client.end();
      }
    }
  }

  async dropTable(tableDetails: TableDetails) {
    await validateOrThrow(TableDetails, tableDetails);

    const dropTableQuery = `DROP table ${tableDetails.schema}.${tableDetails.identifier}`;

    checkSQLSafeOrThrow(dropTableQuery);

    await executeTransactionalQueries(this.userDataDBAdminConn, [
      dropTableQuery,
    ]);
  }

  async addTableColumn(addColumnDetails: AddColumnDetails) {
    await validateOrThrow(AddColumnDetails, addColumnDetails);

    const { table, newColumn } = addColumnDetails;
    const addColumnQuery = `ALTER table ${table.schema}.${
      table.identifier
    } ADD COLUMN ${newColumnDetailsToPartialSql(newColumn)}`;

    checkSQLSafeOrThrow(addColumnQuery);

    await executeTransactionalQueries(this.userDataDBAdminConn, [
      addColumnQuery,
    ]);
  }

  async dropTableColumn(dropColumnDetails: DropColumnDetails) {
    await validateOrThrow(DropColumnDetails, dropColumnDetails);

    const { table } = dropColumnDetails;
    const dropColumnQuery = `ALTER table ${table.schema}.${table.identifier} DROP COLUMN ${dropColumnDetails.columnIdentifier}`;

    checkSQLSafeOrThrow(dropColumnQuery);

    await executeTransactionalQueries(this.userDataDBAdminConn, [
      dropColumnQuery,
    ]);
  }

  async reloadPostgrestConfig() {
    await this.userDataDBAdminConn.query(`NOTIFY pgrst, 'reload config'`);
  }

  async reloadPostgrestSchema() {
    await this.userDataDBAdminConn.query(`NOTIFY pgrst, 'reload schema'`);
  }

  private async getClient(connCredentials: ConnCredentials) {
    const client = new Client({
      host: this.userDataDbBaseConnOpts.host,
      port: this.userDataDbBaseConnOpts.port,
      database: this.userDataDbBaseConnOpts.database,
      user: connCredentials.owner,
      password: connCredentials.password,
    });
    await client.connect();
    return client;
  }
}

function newColumnDetailsToPartialSql(column: NewColumnDetails): string {
  return `${column.identifier} ${column.columnType} ${
    column.required ? 'NOT NULL' : ''
  } ${column.default ? `DEFAULT ${column.default}` : ''}`;
}
