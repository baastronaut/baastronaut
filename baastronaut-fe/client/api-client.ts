import { NEW_ROW_PROP_NAME } from '../utils/constants';
import {
  DeleteResp,
  FetchReqDetails,
  GenericDataArrResp,
  HttpError,
  LoginResp,
  Page,
  ProjectResp,
  TableResp,
  UnknownError,
} from './types';

function buildUrl(
  apiUrl: string,
  path: string,
  urlSearchParams?: URLSearchParams,
): string {
  const url = new URL(path, apiUrl);
  if (urlSearchParams) {
    url.search = urlSearchParams.toString();
  }
  return url.href;
}

async function fetchReq<T>(
  req: FetchReqDetails,
): Promise<T | HttpError | UnknownError> {
  try {
    const { apiUrl, path, method, jsonBody, urlSearchParams } = req;
    const headers: { [k: string]: string } = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    if (req.authToken) {
      headers['Authorization'] = `Bearer ${req.authToken}`;
    }
    const response = await fetch(`${buildUrl(apiUrl, path, urlSearchParams)}`, {
      mode: 'cors',
      headers,
      method,
      body: jsonBody,
    });

    const respBody = await response.json();

    if (response.ok) {
      return respBody as T;
    } else {
      const errResponse = respBody as HttpError;
      if (!errResponse.statusCode) {
        errResponse.statusCode = response.status;
      }
      return errResponse;
    }
  } catch (err) {
    return {
      errorMessage: err,
    } as UnknownError;
  }
}

function isUnknownError(resp: any): resp is UnknownError {
  const casted = resp as UnknownError;
  return !!casted.errorMessage;
}

function isHttpError(resp: any): resp is HttpError {
  const casted = resp as HttpError;
  return casted.statusCode >= 400;
}

function throwOrReturnType<T>(resp: T | HttpError | UnknownError): T {
  if (isHttpError(resp)) {
    throw resp;
  } else if (isUnknownError(resp)) {
    throw new Error(resp.errorMessage);
  } else {
    return resp;
  }
}

export class ApiClient {
  apiUrl: string;
  authToken?: string;

  constructor(authToken?: string) {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      throw new Error('API URL is not set.');
    }
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL;
    this.authToken = authToken;
  }

  doFetchReq = async <T>(
    req: Omit<FetchReqDetails, 'apiUrl' | 'authToken' | 'jsonBody'> & {
      jsonBody?: Record<string, unknown>;
    },
  ): Promise<T> => {
    const stringifiedJsonBody = req.jsonBody
      ? JSON.stringify(req.jsonBody)
      : undefined;

    const request = {
      apiUrl: this.apiUrl,
      authToken: this.authToken,
      ...req,
      jsonBody: stringifiedJsonBody,
    };

    const resp = await fetchReq<T>(request);

    return throwOrReturnType<T>(resp);
  };

  login = async (email: string, password: string): Promise<LoginResp> => {
    const resp = await fetchReq<LoginResp>({
      apiUrl: this.apiUrl,
      path: '/login',
      method: 'POST',
      jsonBody: JSON.stringify({
        email,
        password,
      }),
    });
    return throwOrReturnType<LoginResp>(resp);
  };

  getProjects = async (
    workspaceId: number,
    page?: number,
  ): Promise<Page<ProjectResp>> => {
    const resp = await fetchReq<Page<ProjectResp>>({
      apiUrl: this.apiUrl,
      path: `/workspaces/${workspaceId}/projects${page ? `?page=${page}` : ''}`,
      method: 'GET',
      authToken: this.authToken,
    });
    return throwOrReturnType<Page<ProjectResp>>(resp);
  };

  getProject = async (
    workspaceId: number,
    projectId: number,
  ): Promise<ProjectResp> => {
    const resp = await fetchReq<ProjectResp>({
      apiUrl: this.apiUrl,
      path: `/workspaces/${workspaceId}/projects/${projectId}`,
      method: 'GET',
      authToken: this.authToken,
    });
    return throwOrReturnType<ProjectResp>(resp);
  };

  deleteProject = async (workspaceId: number, projectId: number) => {
    const resp = await fetchReq<DeleteResp>({
      apiUrl: this.apiUrl,
      path: `/workspaces/${workspaceId}/projects/${projectId}`,
      method: 'DELETE',
      authToken: this.authToken,
    });
    return throwOrReturnType<DeleteResp>(resp);
  };

  getTable = async (
    workspaceId: number,
    projectId: number,
    tableId: number,
  ): Promise<TableResp> => {
    const resp = await fetchReq<TableResp>({
      apiUrl: this.apiUrl,
      path: `/workspaces/${workspaceId}/projects/${projectId}/tables/${tableId}`,
      method: 'GET',
      authToken: this.authToken,
    });
    return throwOrReturnType<TableResp>(resp);
  };

  getTableData = async (
    projectId: number,
    tableId: number,
  ): Promise<GenericDataArrResp> => {
    const resp = await fetchReq<GenericDataArrResp>({
      apiUrl: this.apiUrl,
      path: `/user-data/projects/${projectId}/tables/${tableId}`,
      method: 'GET',
      authToken: this.authToken,
    });
    return throwOrReturnType<GenericDataArrResp>(resp);
  };

  insertData = async (
    projectId: number,
    tableId: number,
    body: any,
  ): Promise<any> => {
    const sanitizedBody = { ...body };
    this.removeClientSideGeneratedFields(sanitizedBody);
    return this.insertOrUpdateData('ins', projectId, tableId, sanitizedBody);
  };

  updateData = async (
    projectId: number,
    tableId: number,
    body: any,
  ): Promise<any> => {
    const sanitizedBody = { ...body };
    this.removeServerSideGeneratedFields(sanitizedBody);
    return this.insertOrUpdateData('up', projectId, tableId, sanitizedBody);
  };

  deleteData = async (
    projectId: number,
    tableId: number,
    dataIds: number[],
  ): Promise<any> => {
    const resp = await fetchReq<any>({
      apiUrl: this.apiUrl,
      path: `/user-data/projects/${projectId}/tables/${tableId}`,
      method: 'DELETE',
      authToken: this.authToken,
      urlSearchParams: new URLSearchParams({ id: `in.(${dataIds.join(',')})` }),
    });
    return throwOrReturnType<any>(resp);
  };

  getApiDocs = async (
    projectId: number,
    apiUserToken: string,
  ): Promise<any> => {
    const resp = await fetchReq<any>({
      apiUrl: this.apiUrl,
      path: `/api/docs/projects/${projectId}`,
      method: 'GET',
      authToken: this.authToken,
      urlSearchParams: new URLSearchParams({ apiUserToken }),
    });
    return throwOrReturnType<any>(resp);
  };

  private insertOrUpdateData = async (
    mode: 'ins' | 'up',
    projectId: number,
    tableId: number,
    body: any,
  ): Promise<any> => {
    const resp = await fetchReq<any>({
      apiUrl: this.apiUrl,
      path: `/user-data/projects/${projectId}/tables/${tableId}`,
      method: mode === 'ins' ? 'POST' : 'PUT',
      jsonBody: JSON.stringify(body),
      authToken: this.authToken,
      urlSearchParams:
        mode === 'up'
          ? new URLSearchParams({ id: `eq.${body.id}` })
          : undefined,
    });
    return throwOrReturnType<any>(resp);
  };

  private removeClientSideGeneratedFields(body: any) {
    this.removeFields(['id', NEW_ROW_PROP_NAME], body);
  }

  private removeServerSideGeneratedFields(body: any) {
    this.removeFields(['created_at', 'updated_at', 'creator'], body);
  }

  private removeFields(fields: string[], body: any) {
    for (const field of fields) {
      if (body[field] !== undefined) {
        delete body[field];
      }
    }
  }
}
