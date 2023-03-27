import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthedRequest } from '../auth/auth.service';
import { HasAdminRightsGuard } from '../workspaces/workspace-auth.guard';
import { ProjectAuthorizationGuard } from '../projects/project-auth.guard';
import { ApiTokenServiceDto, ApiTokensService } from './api-tokens.service';

export type ApiTokenResp = {
  token: string;
  readOnly: boolean;
  id: number;
  createdAt: string;
  updatedAt: string;
  projectId: number;
  generatedByUser: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
};

function toApiTokenResp(apiTokenServiceDto: ApiTokenServiceDto): ApiTokenResp {
  let generatedByUser: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null = null;
  if (apiTokenServiceDto.generatedByUser) {
    generatedByUser = {
      id: apiTokenServiceDto.generatedByUser.id,
      firstName: apiTokenServiceDto.generatedByUser.firstName || '',
      lastName: apiTokenServiceDto.generatedByUser.lastName || '',
      email: apiTokenServiceDto.generatedByUser.email,
    };
  }
  return {
    token: apiTokenServiceDto.token,
    readOnly: apiTokenServiceDto.readOnly,
    id: apiTokenServiceDto.id,
    createdAt: apiTokenServiceDto.createdAt.toISOString(),
    updatedAt: apiTokenServiceDto.updatedAt.toISOString(),
    projectId: apiTokenServiceDto.projectId,
    generatedByUser,
  };
}

@UseGuards(ProjectAuthorizationGuard)
@Controller('workspaces/:workspaceId/projects/:projectId/api-tokens')
export class ApiTokensController {
  constructor(private apiTokensService: ApiTokensService) {}

  @Get()
  async getProjectApiToken(
    @Param('projectId', ParseIntPipe) projectId: number,
  ): Promise<ApiTokenResp | null> {
    const apiToken = await this.apiTokensService.getProjectApiToken(projectId);
    return apiToken ? toApiTokenResp(apiToken) : null;
  }

  @UseGuards(HasAdminRightsGuard)
  @Post()
  async createOrUpdateProjectApiToken(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Request() req: AuthedRequest,
  ): Promise<ApiTokenResp> {
    const apiToken = await this.apiTokensService.createOrUpdateProjectApiToken(
      projectId,
      req.user,
    );
    return toApiTokenResp(apiToken);
  }

  @UseGuards(HasAdminRightsGuard)
  @Delete(':apiTokenId')
  async deleteProjectApiToken(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('apiTokenId', ParseIntPipe) apiTokenId: number,
  ) {
    await this.apiTokensService.deleteProjectApiToken(projectId, apiTokenId);
    return {
      success: true,
    };
  }
}
