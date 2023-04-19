import { useMutation } from 'react-query';
import {
  ColumnType,
  CreateTableParams,
  Table,
  TableUpdateData,
} from 'client/types';
import { useApiClient } from './api-client';

export function useCreateTable(
  {
    workspaceId,
    projectId,
    params,
  }: {
    workspaceId: number;
    projectId: number;
    params: CreateTableParams;
  },
  options?: {
    onSuccess?: () => void;
  },
) {
  const apiClient = useApiClient();

  const { mutate, error, isSuccess, isLoading } = useMutation(
    () => {
      return apiClient.doFetchReq({
        path: `/workspaces/${workspaceId}/projects/${projectId}/tables`,
        method: 'POST',
        jsonBody: params,
      });
    },
    {
      ...options,
    },
  );

  return {
    createTable: mutate,
    createTableError: error,
    createTableSuccess: isSuccess,
    createTableLoading: isLoading,
  };
}

export function useTableDataInsert(
  {
    projectId,
    table,
  }: {
    projectId: number;
    table: Table;
  },
  options?: {
    onSuccess?: () => void;
  },
) {
  const apiClient = useApiClient();

  type ValueType = string | boolean | number;

  function getDefaultValues() {
    const defaultValues: Record<ColumnType, ValueType> = {
      [ColumnType.TEXT]: '',
      [ColumnType.BOOLEAN]: false,
      [ColumnType.DATETIME]: new Date().toISOString(),
      [ColumnType.INTEGER]: 0,
      [ColumnType.FLOAT]: 0,
    };

    const tableDataMap = new Map(
      table.columns.map((col) => {
        const key = col.pgColumnIdentifier;
        const defaultValue = defaultValues[col.columnType];
        const value = col.required ? defaultValue : undefined;

        return [key, value];
      }),
    );

    return Object.fromEntries(tableDataMap);
  }

  const { mutate, error, isSuccess } = useMutation(
    () => {
      return apiClient.doFetchReq({
        path: `/user-data/projects/${projectId}/tables/${table.id}`,
        method: 'POST',
        jsonBody: getDefaultValues(),
      });
    },
    {
      ...options,
    },
  );

  return {
    insertTableRowData: mutate,
    insertTableRowDataError: error,
    insertTableRowDataSuccess: isSuccess,
  };
}

export function useTableDataUpdate({
  projectId,
  tableId,
}: {
  projectId: number;
  tableId: number;
}) {
  const apiClient = useApiClient();

  const { mutate, error, isSuccess, isLoading } = useMutation(
    ({ id, data }: { id: number; data: TableUpdateData }) => {
      return apiClient.doFetchReq({
        path: `/user-data/projects/${projectId}/tables/${tableId}`,
        method: 'PUT',
        jsonBody: { id, ...data },
        urlSearchParams: new URLSearchParams({ id: `eq.${id}` }),
      });
    },
  );

  return {
    updateTableRowData: mutate,
    updateTableRowDataLoading: isLoading,
    updateTableRowDataError: error,
    updateTableRowDataSuccess: isSuccess,
  };
}

export function useAddTableColumn(
  {
    workspaceId,
    projectId,
    tableId,
  }: {
    workspaceId: number;
    projectId: number;
    tableId: number;
  },
  options?: {
    onSuccess?: () => void;
  },
) {
  const apiClient = useApiClient();

  const { mutate, error, isSuccess, isLoading } = useMutation(
    (data: { name: string; description: string; columnType: ColumnType }) => {
      return apiClient.doFetchReq({
        path: `workspaces/${workspaceId}/projects/${projectId}/tables/${tableId}/columns`,
        method: 'POST',
        jsonBody: data,
      });
    },
    {
      ...options,
    },
  );

  return {
    addTableColumn: mutate,
    addTableColumnLoading: isLoading,
    addTableColumnError: error,
    addTableColumnSuccess: isSuccess,
  };
}

export function useDeleteTableColumn({
  workspaceId,
  projectId,
  tableId,
}: {
  workspaceId: number;
  projectId: number;
  tableId: number;
}) {
  const apiClient = useApiClient();

  const { mutate, error, isSuccess, isLoading } = useMutation(
    ({ columnId }: { columnId: number }) => {
      return apiClient.doFetchReq({
        path: `/workspaces/${workspaceId}/projects/${projectId}/tables/${tableId}/columns/${columnId}`,
        method: 'DELETE',
      });
    },
  );

  return {
    deleteTableColumn: mutate,
    deleteTableColumnLoading: isLoading,
    deleteTableColumnError: error,
    deleteTableColumnSuccess: isSuccess,
  };
}

export function useDeleteTableRow(
  {
    projectId,
    tableId,
  }: {
    projectId: number;
    tableId: number;
  },
  options?: {
    onSuccess?: () => void;
  },
) {
  const apiClient = useApiClient();

  const { mutate, error, isSuccess, isLoading } = useMutation(
    (id: number) => {
      return apiClient.doFetchReq({
        path: `/user-data/projects/${projectId}/tables/${tableId}`,
        method: 'DELETE',
        urlSearchParams: new URLSearchParams({ id: `eq.${id}` }),
      });
    },
    {
      ...options,
    },
  );

  return {
    deleteTableRow: mutate,
    deleteTableRowLoading: isLoading,
    deleteTableRowError: error,
    deleteTableRowSuccess: isSuccess,
  };
}

export function useGenerateApiToken({
  workspaceId,
  projectId,
}: {
  workspaceId: number;
  projectId: number;
}) {
  const apiClient = useApiClient();

  const { mutate, error, isSuccess, isLoading } = useMutation(() => {
    return apiClient.doFetchReq({
      path: `/workspaces/${workspaceId}/projects/${projectId}/api-tokens`,
      method: 'POST',
    });
  });

  return {
    generateApiToken: mutate,
    generateApiTokenLoading: isLoading,
    generateApiTokenError: error,
    generateApiTokenSuccess: isSuccess,
  };
}
