export type FetchReqDetails = {
  apiUrl: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';
  authToken?: string;
  jsonBody?: string;
  urlSearchParams?: URLSearchParams;
};

export type HttpError = {
  statusCode: number;
  message: string;
  error: string;
};

export type UnknownError = {
  errorMessage: string;
};

type Workspace = {
  role: string;
  workspaceId: number;
  workspaceName: string;
};

export type LoginResp = {
  id: number;
  email: string;
  firstName: string;
  lastName: string | null;
  token: string;
  allowedWorkspaces: Workspace[];
};

export enum ColumnType {
  INTEGER = 'INTEGER',
  BOOLEAN = 'BOOLEAN',
  TEXT = 'TEXT',
  DATETIME = 'DATETIME',
  FLOAT = 'FLOAT',
}

export type ColumnTypeToValueMap = {
  [ColumnType.TEXT]: string;
  [ColumnType.INTEGER]: number;
  [ColumnType.FLOAT]: number;
  [ColumnType.BOOLEAN]: boolean;
  [ColumnType.DATETIME]: string;
};

export type BaseColumnDetails = {
  pgColumnIdentifier: string;
  name: string;
  // see: https://github.com/hendychua/baastronaut/blob/5f79639016d794b6a1bd20725e77b9cc78d6c95c/baastronaut-fe/utils/helpers.ts#L3
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

export type PageMeta = {
  itemsPerPage: number;
  totalItems: number;
  currentPage: number;
  totalPages: number;
  sortBy: string[][];
};

export type Page<T> = {
  data: T[];
  meta: PageMeta;
};

export interface Project {
  id: number;
  name: string;
  workspaceId: number;
  creatorId: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export type ProjectResp = Project; // TODO: clean this up later

export interface Table {
  id: number;
  createdAt: string;
  updatedAt: string;
  projectId: number;
  name: string;
  description: string;
  pgTableIdentifier: string;
  columns: ColumnResp[];
  generatedColumns: GeneratedColumnResp[];
}

export type TableResp = Table; // TODO: clean this up later

export type CreateTableParams = {
  name: string;
  description: string;
  columns: {
    name: string;
    description: string;
    columnType: ColumnType;
    required: boolean;
  }[];
};

export type TableDataValue = ColumnTypeToValueMap[ColumnType];

export interface TableRowData {
  id: number;
  created_at: string;
  updated_at: string;
  [key: string]: TableDataValue;
}

export type TableUpdateData = Omit<
  TableRowData,
  'id' | 'created_at' | 'updated_at'
>;

export type TableDataResponse = TableRowData[];

export type SingleGenericDataResp = {
  id: number;
  [field: string]: any;
};

export type DeleteResp = {
  success: boolean;
};

export type GenericDataArrResp = SingleGenericDataResp[];

export interface ApiTokenData {
  token: string;
  readOnly: true;
  id: number;
  createdAt: string;
  updatedAt: string;
  projectId: number;
  generatedByUser: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}
