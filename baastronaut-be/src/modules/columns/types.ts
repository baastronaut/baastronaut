import { IsBoolean, IsEnum, Length } from 'class-validator';
import { IsValidName } from '../../utils/validators';
import { ColumnType } from './column.entity';

/**
 * For adding columns to existing table.
 */
export class AddColumnReq {
  @Length(1, 63)
  @IsValidName()
  name: string;

  description: string | null;

  @IsEnum(ColumnType)
  columnType: ColumnType;

  // TODO: required and default (if required is true)
}

/**
 * Not supporting default values yet just to simplify things.
 */
export class CreateColumnReq extends AddColumnReq {
  @IsBoolean()
  required: boolean;
}

type BaseColumnDetails = {
  pgColumnIdentifier: string;
  name: string;
  columnType: ColumnType;
  required: boolean;
};

export type GeneratedColumnResp = BaseColumnDetails & {
  primary: boolean;
};

export type ColumnResp = BaseColumnDetails & {
  id: number;
  createdAt: string;
  updatedAt: string;
  tableId: number;
  description: string | null;
};
