import { GridNativeColTypes } from '@mui/x-data-grid';

export enum ColumnType {
  TEXT = 'TEXT',
  INTEGER = 'INTEGER',
  FLOAT = 'FLOAT',
  BOOLEAN = 'BOOLEAN',
  DATETIME = 'DATETIME',
}

export interface ColumnTypeHandler {
  toGridNativeColTypes: () => GridNativeColTypes;
  validateValue: (val: any) => boolean;
}
export class TextHandler implements ColumnTypeHandler {
  toGridNativeColTypes = (): GridNativeColTypes => 'string';
  validateValue = (val: any): boolean => typeof val === 'string';
}
export class IntegerHandler implements ColumnTypeHandler {
  toGridNativeColTypes = (): GridNativeColTypes => 'number';
  validateValue = (val: any): boolean =>
    typeof val === 'number' && !isNaN(val) && Number.isInteger(val);
}
export class FloatHandler implements ColumnTypeHandler {
  toGridNativeColTypes = (): GridNativeColTypes => 'number';
  validateValue = (val: any): boolean => typeof val === 'number' && !isNaN(val);
}
export class BooleanHandler implements ColumnTypeHandler {
  toGridNativeColTypes = (): GridNativeColTypes => 'boolean';
  validateValue = (val: any): boolean => typeof val === 'boolean';
}
export class DatetimeHandler implements ColumnTypeHandler {
  toGridNativeColTypes = (): GridNativeColTypes => 'dateTime';
  validateValue = (val: any): boolean => val instanceof Date;
}

export const COLUMN_TYPE_HANDLERS = new Map<ColumnType, ColumnTypeHandler>([
  [ColumnType.TEXT, new TextHandler()],
  [ColumnType.INTEGER, new IntegerHandler()],
  [ColumnType.FLOAT, new FloatHandler()],
  [ColumnType.BOOLEAN, new BooleanHandler()],
  [ColumnType.DATETIME, new DatetimeHandler()],
]);
