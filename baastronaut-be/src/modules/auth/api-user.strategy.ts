import { Strategy } from 'passport-custom';
import { PassportStrategy } from '@nestjs/passport';
import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTokensService } from '../api-tokens/api-tokens.service';

export const API_USER_AUTH_GUARD_KEY = 'api-user';
export const API_USER_HEADER_KEY = 'x-baas-api-key';
export const API_PROJECT_ID_HEADER_KEY = 'x-baas-project-id';

export type AuthedApiUser = {
  apiToken: string;
  project: {
    id: number;
    pgSchemaIdentifier: string;
    pgSchemaOwner: string;
  };
};

export type AuthedApiRequest = Request & { user: AuthedApiUser };

@Injectable()
export class ApiUserStrategy extends PassportStrategy(
  Strategy,
  API_USER_AUTH_GUARD_KEY,
) {
  constructor(private apiTokensService: ApiTokensService) {
    super();
  }

  async validate(request: Request): Promise<AuthedApiUser> {
    const apiKey = request.headers[API_USER_HEADER_KEY];
    const projectId = request.headers[API_PROJECT_ID_HEADER_KEY];

    if (!apiKey) {
      throw new UnauthorizedException(
        `Missing API key in ${API_USER_HEADER_KEY} header.`,
      );
    } else if (Array.isArray(apiKey)) {
      throw new UnauthorizedException(
        `Invalid API key in header (should be a single string value).`,
      );
    }

    let projectIdNum: number | null = null;
    if (!projectId) {
      throw new UnauthorizedException(
        `Missing project ID in ${API_PROJECT_ID_HEADER_KEY} header.`,
      );
    } else if (Array.isArray(projectId)) {
      throw new UnauthorizedException(
        `Invalid project ID in header (should be a single numeric value).`,
      );
    } else {
      projectIdNum = parseInt(projectId);
      if (!projectIdNum || isNaN(projectIdNum)) {
        throw new UnauthorizedException(
          `Invalid project ID in header (should be a single numeric value).`,
        );
      }
    }

    const apiTokenEntity =
      await this.apiTokensService.getApiTokenWithProjectAndCreatorDetails(
        apiKey,
      );

    if (!apiTokenEntity || apiTokenEntity.projectId !== projectIdNum) {
      throw new UnauthorizedException('Invalid API key.');
    }

    if (!apiTokenEntity.project) {
      throw new InternalServerErrorException(
        'An internal server error occurred while validating API key.',
      );
    }

    return {
      apiToken: apiKey,
      project: {
        id: projectIdNum,
        pgSchemaIdentifier: apiTokenEntity.project.pgSchemaIdentifier,
        pgSchemaOwner: apiTokenEntity.project.pgSchemaOwner,
      },
    };
  }
}
