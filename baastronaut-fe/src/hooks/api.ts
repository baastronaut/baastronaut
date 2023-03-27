import {
  ApiTokenData,
  Page,
  ProjectResp,
  Table,
  TableDataResponse,
  TableResp,
} from 'client/types';
import { useQuery } from 'react-query';
import { useApiClient } from './api-client';

export function useProjects(
  params: {
    workspaceId: number;
    page?: number;
  },
  options?: { enabled?: boolean },
) {
  const apiClient = useApiClient();

  const { workspaceId, page } = params;

  const { data: projectsData, isLoading: loadingProjects } = useQuery({
    queryKey: ['get-projects', ...Object.entries(params)],
    queryFn: () =>
      apiClient.doFetchReq<Page<ProjectResp>>({
        method: 'GET',
        path: `/workspaces/${workspaceId}/projects${
          page ? `?page=${page}` : ''
        }`,
      }),
    ...options,
  });

  const { data, meta } = projectsData || {};

  return {
    projects: data,
    projectsPageMeta: meta,
    loadingProjects,
  };
}

export function useProject(
  params: {
    workspaceId: number;
    projectId: number;
  },
  options?: { enabled?: boolean },
) {
  const apiClient = useApiClient();

  const { workspaceId, projectId } = params;

  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ['get-project', ...Object.entries(params)],
    queryFn: () =>
      apiClient.doFetchReq<ProjectResp>({
        method: 'GET',
        path: `/workspaces/${workspaceId}/projects/${projectId}`,
      }),
    ...options,
  });

  return {
    project,
    loadingProject,
  };
}

export function useTablesByProject(
  params: {
    workspaceId: number;
    projectId: number;
    page?: number;
  },
  options?: { enabled?: boolean },
) {
  const apiClient = useApiClient();

  const { workspaceId, projectId, page } = params;

  const { data: tablesData, isLoading: loadingTables } = useQuery({
    queryKey: ['get-tables-by-projects', ...Object.entries(params)],
    queryFn: () =>
      apiClient.doFetchReq<Page<Table>>({
        method: 'GET',
        path: `/workspaces/${workspaceId}/projects/${projectId}/tables${
          page ? `?page=${page}` : ''
        }`,
      }),
    ...options,
  });

  const { data, meta } = tablesData || {};

  return {
    tables: data,
    tablesPageMeta: meta,
    loadingTables,
  };
}

export function useTableData(
  params: {
    projectId: number;
    tableId: number;
  },
  options?: { enabled?: boolean },
) {
  const apiClient = useApiClient();

  const { projectId, tableId } = params;

  const {
    data: tableData,
    isLoading: loadingTableData,
    refetch: refetchTableData,
  } = useQuery({
    queryKey: ['get-table-data', ...Object.entries(params)],
    queryFn: () =>
      apiClient.doFetchReq<TableDataResponse>({
        method: 'GET',
        path: `user-data/projects/${projectId}/tables/${tableId}`,
      }),
    ...options,
  });

  return {
    tableData,
    loadingTableData,
    refetchTableData,
  };
}

export function useApiToken(
  params: {
    workspaceId: number;
    projectId: number;
  },
  options?: { enabled?: boolean },
) {
  const apiClient = useApiClient();

  const { workspaceId, projectId } = params;

  const { data: apiToken, isLoading: loadingApiToken } = useQuery({
    queryKey: ['get-api-tokens', ...Object.entries(params)],
    queryFn: () =>
      apiClient.doFetchReq<ApiTokenData>({
        method: 'GET',
        path: `workspaces/${workspaceId}/projects/${projectId}/api-tokens`,
      }),
    ...options,
    refetchOnWindowFocus: false,
  });

  return {
    apiToken,
    loadingApiToken,
  };
}

export function useApiDocs(
  params: {
    projectId: number;
    apiUserToken: string;
  },
  options?: { enabled?: boolean },
) {
  const apiClient = useApiClient();
  const { projectId, apiUserToken } = params;

  const {
    data: apiDocs,
    isLoading: loadingApiDocs,
    refetch: refetchApiDocs,
  } = useQuery({
    queryKey: ['get-table-data', ...Object.entries(params)],
    queryFn: () =>
      apiClient.doFetchReq<Record<string, unknown>>({
        path: `/api/docs/projects/${projectId}`,
        method: 'GET',
        urlSearchParams: new URLSearchParams({ apiUserToken }),
      }),
    ...options,
    refetchOnWindowFocus: false,
  });

  if (apiDocs) {
    apiDocs.info = {
      description: 'API for accessing table data',
      title: 'Table API',
    };
  }

  return {
    apiDocs,
    loadingApiDocs,
    refetchApiDocs,
  };
}
