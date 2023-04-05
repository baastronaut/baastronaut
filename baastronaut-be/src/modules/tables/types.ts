import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { IsNotBlank, IsValidName } from '../../utils/validators';
import {
  ColumnResp,
  CreateColumnReq,
  GeneratedColumnResp,
} from '../columns/types';

export class CreateTableReq {
  @Length(1, 63)
  @IsValidName()
  name: string;

  description: string | null;

  @ValidateNested()
  @IsArray()
  @Type(() => CreateColumnReq)
  columns: CreateColumnReq[];
}

export type TableResp = {
  id: number;
  createdAt: string;
  updatedAt: string;
  projectId: number;
  name: string;
  description: string | null;
  pgTableIdentifier: string;
  columns: ColumnResp[];
  generatedColumns: GeneratedColumnResp[];
};

export enum FtsWeight {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
}

export class FtsGroupColumnReq {
  @IsInt()
  id: number;

  @IsEnum(FtsWeight)
  weight: FtsWeight;
}

export class CreateFtsGroupReq {
  @IsArray()
  @ValidateNested()
  @Type(() => FtsGroupColumnReq)
  columns: FtsGroupColumnReq[];

  @IsString()
  @IsNotBlank()
  name: string;

  @IsOptional()
  @IsString()
  description: string | null;
}

export type FtsGroupResp = {
  id: number;
  tableId: number;
  name: string;
  description: string | null;
  columns: {
    ftsGroupId: number;
    columnId: number;
    weight: FtsWeight | null;
    createdAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
};
