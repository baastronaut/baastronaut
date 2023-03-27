import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthedUser } from '../auth/auth.service';
import { ProjectsService } from '../projects/projects.service';
import { UserDataService } from '../user-data/user-data.service';
import { ApiTokenEntity } from './api-token.entity';

export type ApiTokenServiceDto = {
  token: string;
  readOnly: boolean;
  id: number;
  createdAt: Date;
  updatedAt: Date;
  projectId: number;
  generatedByUser: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
};

@Injectable()
export class ApiTokensService {
  constructor(
    @InjectRepository(ApiTokenEntity)
    private apiTokensRepository: Repository<ApiTokenEntity>,
    private projectsService: ProjectsService,
    private userDataService: UserDataService,
  ) {}

  /**
   * We only support one api token per project for now, hence this returns only one api token.
   */
  async getProjectApiToken(
    projectId: number,
  ): Promise<ApiTokenServiceDto | null> {
    const apiToken = await this.apiTokensRepository.findOne({
      where: {
        projectId,
      },
      relations: {
        generatedByUser: true,
      },
    });

    if (!apiToken) {
      return null;
    }

    return toApiTokenServiceDto(apiToken);
  }

  /**
   * We only support read-only api tokens for now. If we want to support write api tokens, there
   * are a few parts to modify:
   * 1. Table policies when creating tables.
   * 2. User api docs (where we remove modifying queries).
   */
  async createOrUpdateProjectApiToken(
    projectId: number,
    user: AuthedUser,
  ): Promise<ApiTokenServiceDto> {
    const projectEntity = await this.projectsService.getProjectEntityOrThrow(
      projectId,
    );
    const token =
      await this.userDataService.createReadOnlyApiUserSignedJwtForPgrst(
        projectEntity.pgSchemaOwner,
      );
    await this.apiTokensRepository.upsert(
      {
        projectId: projectEntity.id!,
        generatedByUserId: user.id,
        token,
        updatedAt: new Date(),
        readOnly: true,
      },
      ['projectId'],
    );

    const apiTokenResp = await this.getProjectApiToken(projectEntity.id!);
    if (!apiTokenResp) {
      throw new InternalServerErrorException(
        'Api token was not saved properly.',
      );
    }

    return apiTokenResp;
  }

  async deleteProjectApiToken(projectId: number, apiTokenId: number) {
    await this.apiTokensRepository.delete({
      projectId,
      id: apiTokenId,
    });
  }

  async getApiTokenWithProjectAndCreatorDetails(
    token: string,
  ): Promise<ApiTokenEntity | null> {
    return await this.apiTokensRepository.findOne({
      where: {
        token,
      },
      relations: {
        generatedByUser: true,
        project: true,
      },
    });
  }
}

function toApiTokenServiceDto(apiToken: ApiTokenEntity): ApiTokenServiceDto {
  let generatedByUser: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null = null;
  if (apiToken.generatedByUser) {
    generatedByUser = {
      id: apiToken.generatedByUser.id,
      firstName: apiToken.generatedByUser.firstName || '',
      lastName: apiToken.generatedByUser.lastName || '',
      email: apiToken.generatedByUser.email,
    };
  }
  return {
    token: apiToken.token,
    readOnly: apiToken.readOnly,
    id: apiToken.id,
    createdAt: apiToken.createdAt,
    updatedAt: apiToken.updatedAt,
    projectId: apiToken.projectId,
    generatedByUser,
  };
}
