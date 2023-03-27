import {
  Controller,
  Get,
  Inject,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  Request,
  Response,
  UseGuards,
} from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { ProxyService } from '../proxy/proxy.service';
import { ProjectAuthorizationGuard } from '../projects/project-auth.guard';
import { AuthedRequest } from '../auth/auth.service';
import { IsNotBlank } from '../../utils/validators';
import { ApiTokensService } from '../api-tokens/api-tokens.service';

export const IS_READONLY_API_USER_HEADER = 'x-baas-ro-api-user';

export class GetDocsQuery {
  @IsNotBlank()
  apiUserToken: string;
}

@Controller('api/docs')
export class UserApiDocsController {
  constructor(
    @Inject('PROXY_SERVICE') private proxyService: ProxyService,
    private apiTokensService: ApiTokensService,
  ) {}

  @UseGuards(ProjectAuthorizationGuard)
  @Get('projects/:projectId')
  async getDocs(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Request() req: AuthedRequest,
    @Response() resp: ExpressResponse,
    @Query() getDocsQuery: GetDocsQuery,
  ) {
    // just to be extra safe
    if (req.method.toLowerCase() !== 'get') {
      throw new InternalServerErrorException(
        `Unexpected HTTP method: ${req.method}.`,
      );
    }

    const apiToken =
      await this.apiTokensService.getApiTokenWithProjectAndCreatorDetails(
        getDocsQuery.apiUserToken,
      );

    if (!apiToken) {
      throw new NotFoundException('Token not found.');
    }

    if (apiToken.projectId !== projectId) {
      throw new NotFoundException('Project not found.');
    }

    if (!apiToken.project) {
      throw new InternalServerErrorException(
        'An error occurred while fetching the project.',
      );
    }

    // https://postgrest.org/en/stable/api.html#openapi-support
    // OpenAPI docs are served at the root path and the docs generated depends on the permissions of the role that is contained
    // by JWT role claim.
    req.url = '/';
    req.headers.authorization = `Bearer ${getDocsQuery.apiUserToken}`;
    req.headers[IS_READONLY_API_USER_HEADER] = `${apiToken.readOnly}`;

    this.proxyService.proxyRequest({
      req,
      resp,
      schema: apiToken.project.pgSchemaIdentifier,
    });
  }
}
