import {
  All,
  BadRequestException,
  Controller,
  Inject,
  Logger,
  Param,
  ParseIntPipe,
  Request,
  Response,
  UseGuards,
} from '@nestjs/common';
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { Public, USER_APIS_ROOT_PATH } from '../../utils/constants';
import { getQueryPart } from '../../utils/url-helpers';
import { ProxyService } from '../proxy/proxy.service';
import { UserDataService } from '../user-data/user-data.service';
import { AuthedRequest, AuthedUser } from '../auth/auth.service';
import { ProjectAuthorizationGuard } from '../projects/project-auth.guard';
import { ApiUserGuard } from '../auth/api-user.guard';
import { AuthedApiRequest } from '../auth/api-user.strategy';
import {
  createProxy,
  isHttpMethodThatWritesData,
} from '../proxy/create-proxy-helpers';
import { DEFAULT_GENERATED_COLUMN_NAMES } from '../tables/constants';
import { POSTGREST_ERR_CODES } from '../../utils/postgREST-constants';

const allGeneratedColumnNames: string[] = Object.values(
  DEFAULT_GENERATED_COLUMN_NAMES,
);

// They need to provide ID in the request body for PUT request. This is a constraint by PostgREST.
const forbiddenColumnNamesForPutRequest: string[] =
  allGeneratedColumnNames.filter(
    (v) => v !== DEFAULT_GENERATED_COLUMN_NAMES.ID,
  );

function findForbiddenColumnNames(
  method: string,
  requestBody: any,
): Set<string> {
  const forbiddenColumnNamesFound = new Set<string>();

  let forbiddenColumnNames = allGeneratedColumnNames;
  if (method === 'put') {
    forbiddenColumnNames = forbiddenColumnNamesForPutRequest;
  }

  if (Array.isArray(requestBody)) {
    requestBody.forEach((element) => {
      findForbiddenColumnNames(method, element).forEach((val) => {
        forbiddenColumnNamesFound.add(val);
      });
    });
  } else {
    Object.keys(requestBody).forEach((key) => {
      if (forbiddenColumnNames.includes(key)) {
        forbiddenColumnNamesFound.add(key);
      }
    });
  }

  return forbiddenColumnNamesFound;
}

function checkNoGeneratedColumnOrThrow(method: string, requestBody: any) {
  const foundForbiddenColumnNames = findForbiddenColumnNames(
    method,
    requestBody,
  );
  if (foundForbiddenColumnNames.size) {
    throw new BadRequestException(
      `These generated columns are found in your request: ${Array.from(
        foundForbiddenColumnNames,
      )
        .map((v) => `'${v}'`)
        .join(
          ', ',
        )}. Generated columns are not updateable. Please remove them and try again.`,
    );
  }
}

function fillInRequiredColumns(authedUser: AuthedUser, requestBody: any) {
  // we need to fill in creator because we are using it for verification in our row-level security policies

  if (Array.isArray(requestBody)) {
    requestBody.forEach((element) =>
      fillInRequiredColumns(authedUser, element),
    );
  } else {
    requestBody[DEFAULT_GENERATED_COLUMN_NAMES.CREATOR] = authedUser.email;
    requestBody[DEFAULT_GENERATED_COLUMN_NAMES.UPDATED_AT] =
      new Date().toISOString();
  }
}

const WHITELISTED_POSTGREST_CODES = new Set<string>([
  POSTGREST_ERR_CODES.MISMATCH_PKEY,
]);

function createProxyService(postgRESTUrl: string, logger: Logger) {
  return new ProxyService(
    createProxy({
      target: postgRESTUrl,
      selfHandleResponseFunc: function (proxyRes, req, body, res) {
        Object.keys(proxyRes.headers).forEach((header) =>
          res.setHeader(header, proxyRes.headers[header]!),
        );
        if (proxyRes.statusCode && proxyRes.statusCode > 299) {
          const jsonBodyString = Buffer.concat(body).toString();
          const jsonBody = JSON.parse(jsonBodyString);
          // If PostgREST returns an error response, it's probably because we did not translate user's request to PostgREST properly,
          // hence we return an internal server error. Another reason we do this instead of returning what PostgREST sends us is to
          // hide detailed error messages from users in case they have sensitive information. We still log the original error for
          // debugging purposes.
          if (
            jsonBody?.code &&
            WHITELISTED_POSTGREST_CODES.has(jsonBody.code)
          ) {
            res.status(400).end(
              JSON.stringify({
                statusCode: 400,
                error: 'Bad request',
                message:
                  jsonBody?.message ||
                  'Primary key values in request body do not match value in URL.',
              }),
            );
          } else {
            logger.error(
              { statusCode: proxyRes.statusCode, jsonBodyString },
              'PostgREST returned error response.',
            );
            res.status(500).end(
              JSON.stringify({
                statusCode: 500,
                error: 'Internal server error',
                message: `An internal server error occurred. Error code: ${
                  jsonBody?.code || 'none'
                }`,
              }),
            );
          }
        } else {
          res.end(Buffer.concat(body).toString());
        }
      },
    }),
  );
}

@Controller()
export class UserApisController {
  private logger = new Logger(UserApisController.name);

  private proxyService: ProxyService;

  constructor(
    private userDataService: UserDataService,
    @Inject('BAAS_PGRST_URL') private postgRESTURL: string,
  ) {
    this.proxyService = createProxyService(this.postgRESTURL, this.logger);
  }

  /**
   * This method does not add bearer token for user because user is meant to call it as an authed API,
   * i.e. they provide the bearer token.
   */
  @Public()
  @UseGuards(ApiUserGuard)
  @All(`${USER_APIS_ROOT_PATH}/*`)
  async proxyUserRequest(
    @Request() req: ExpressRequest,
    @Response() resp: ExpressResponse,
  ) {
    const apiUser = (req as AuthedApiRequest).user;

    req.url = req.originalUrl.substring(USER_APIS_ROOT_PATH.length);

    req.headers['authorization'] = `Bearer ${apiUser.apiToken}`;

    this.proxyService.proxyRequest({
      req,
      resp,
      schema: apiUser.project.pgSchemaIdentifier,
    });
  }

  /**
   * This is meant to be called by our app's frontend.
   */
  @UseGuards(ProjectAuthorizationGuard)
  @All('/user-data/projects/:projectId/tables/:tableId')
  async tableDataAccess(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('tableId', ParseIntPipe) tableId: number,
    @Request() req: AuthedRequest,
    @Response() resp: ExpressResponse,
  ) {
    const method = req.method.toLowerCase();
    if (isHttpMethodThatWritesData(method)) {
      checkNoGeneratedColumnOrThrow(method, req.body);
      // this must be done after checkNoGeneratedColumnOrThrow(), obviously
      fillInRequiredColumns(req.user, req.body);
    }

    const tablePgDetails = await this.userDataService.getTablePgDetails(
      projectId,
      tableId,
    );

    const token = await this.userDataService.createSignedJwtForPgrst(
      tablePgDetails.projectPgDetails.pgSchemaOwner,
      req.user.email,
    );

    const queryPart = getQueryPart(req);
    req.url = `/${tablePgDetails.pgTableIdentifier}${queryPart}`;
    req.headers.authorization = `Bearer ${token}`;

    this.proxyService.proxyRequest({
      req,
      resp,
      schema: tablePgDetails.projectPgDetails.pgSchemaIdentifier,
    });
  }
}
