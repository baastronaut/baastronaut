import { SupportedPostgresColType } from '../user-data-db/user-data-db-service';
import { ColumnType } from './column.entity';

export function mapColumnTypeToPostgresType(
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

export function mapPostgresTypeToColumnType(
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
